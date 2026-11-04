import * as React from "react";
import { ChartEngine, type ChartOptions, type ChartState } from "./engine";
import { Interaction } from "./interaction";
import { resolveTheme, type DeepPartial, type Theme } from "./theme";
import type { ChartEventMap, HitTarget, PaneOptions, Renderable } from "./types";

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const ChartContext = React.createContext<ChartEngine | null>(null);
const PaneContext = React.createContext<string>("main");

/** The chart engine of the closest `<ChartCanvas>`. */
export function useChart<T = any>(): ChartEngine<T> {
    const engine = React.useContext(ChartContext);
    if (!engine) {
        throw new Error("Reincharts components must be rendered inside <ChartCanvas>.");
    }
    return engine as ChartEngine<T>;
}

/** Id of the closest `<Pane>` (or "main" when there is none). */
export const usePaneId = () => React.useContext(PaneContext);

/** Shallow equality of two values or plain objects (for `useChartState` selectors). */
export const shallowEqual = (a: any, b: any) => {
    if (Object.is(a, b)) {
        return true;
    }
    if (!a || !b || typeof a !== "object" || typeof b !== "object") {
        return false;
    }
    const ka = Object.keys(a);
    if (ka.length !== Object.keys(b).length) {
        return false;
    }
    return ka.every((k) => Object.is(a[k], b[k]));
};

/** Subscribes to chart state (layout, visible range, crosshair...). Re-renders only when the selection changes. */
export function useChartState<S>(selector: (state: ChartState) => S, isEqual: (a: S, b: S) => boolean = Object.is): S {
    const engine = useChart();
    const selectorRef = React.useRef(selector);
    selectorRef.current = selector;
    const cache = React.useRef<{ state: ChartState; value: S } | null>(null);
    const get = () => {
        const state = engine.getState();
        const c = cache.current;
        if (c && c.state === state) {
            return c.value;
        }
        const value = selectorRef.current(state);
        cache.current = { state, value: c && isEqual(c.value, value) ? c.value : value };
        return cache.current.value;
    };
    return React.useSyncExternalStore(engine.subscribe, get, get);
}

export type RenderableSpec<T = any> = Omit<Renderable<T>, "pane" | "layer" | "zIndex"> & {
    /** Pane id; defaults to the closest `<Pane>`. Pass `null` to draw over the whole canvas. */
    pane?: string | null;
    layer?: Renderable["layer"];
    zIndex?: number;
};

/** Optional renderable fields passed through from the spec unchanged. */
const SPEC_FIELDS = [
    "clip",
    "visible",
    "scale",
    "extent",
    "baseValue",
    "snapValues",
    "legend",
    "lastValue",
    "xExtent",
    "indexAt",
    "axisLabels",
] as const satisfies readonly Exclude<keyof RenderableSpec, "pane" | "layer" | "zIndex" | "draw">[];

/**
 * Registers a canvas renderable with the chart. The latest spec is used on every frame,
 * and the chart redraws whenever the calling component re-renders.
 */
export function useRenderable<T = any>(spec: RenderableSpec<T>) {
    const engine = useChart<T>();
    const paneId = usePaneId();
    const ref = React.useRef(spec);
    ref.current = spec;
    const pane = spec.pane === undefined ? paneId : spec.pane;
    const paneRef = React.useRef(pane);
    paneRef.current = pane;
    // one stable object for the engine; every field reads the latest spec
    const [renderable] = React.useState<Renderable<T>>(() => {
        const r: Renderable<T> = {
            get pane() {
                return paneRef.current;
            },
            get layer() {
                return ref.current.layer ?? "scene";
            },
            get zIndex() {
                return ref.current.zIndex ?? 0;
            },
            draw: (ctx, scope) => ref.current.draw(ctx, scope),
        };
        for (const key of SPEC_FIELDS) {
            Object.defineProperty(r, key, { get: () => ref.current[key], enumerable: true });
        }
        return r;
    });
    useIsoLayoutEffect(() => {
        if (pane !== null) {
            engine.ensurePane(pane);
        }
    }, [engine, pane]);
    useIsoLayoutEffect(() => engine.addRenderable(renderable), [engine, renderable]);
    useIsoLayoutEffect(() => {
        engine.invalidate(spec.layer === "top" ? "top" : "scene");
    });
    return renderable;
}

export type HitTargetSpec = Omit<HitTarget, "pane" | "zIndex"> & { pane?: string | null; zIndex?: number };

/** Registers an interactive object (hover, click, drag) such as a drawing or a draggable price line. */
export function useHitTarget(spec: HitTargetSpec | null) {
    const engine = useChart();
    const paneId = usePaneId();
    const ref = React.useRef(spec);
    ref.current = spec;
    const enabled = spec !== null;
    const [target] = React.useState<HitTarget>(() => ({
        get pane() {
            const p = ref.current?.pane;
            return p === undefined ? paneId : p;
        },
        get zIndex() {
            return ref.current?.zIndex ?? 0;
        },
        hitTest: (x, y) => ref.current?.hitTest(x, y),
        onPointerDown: (e) => ref.current?.onPointerDown?.(e),
        onDrag: (e) => ref.current?.onDrag?.(e),
        onDragEnd: (e) => ref.current?.onDragEnd?.(e),
        onClick: (e) => ref.current?.onClick?.(e),
        onDoubleClick: (e) => ref.current?.onDoubleClick?.(e),
        onContextMenu: (e) => ref.current?.onContextMenu?.(e),
        onHover: (h) => ref.current?.onHover?.(h),
    }));
    useIsoLayoutEffect(() => (enabled ? engine.addHitTarget(target) : undefined), [engine, target, enabled]);
}

/** Listens to chart events (pointer events in chart coordinates, keydown, rangechange, crosshair...). */
export function useChartEvent<K extends keyof ChartEventMap>(
    type: K,
    handler: ((e: ChartEventMap[K]) => void) | undefined,
) {
    const engine = useChart();
    const ref = React.useRef(handler);
    ref.current = handler;
    const active = handler !== undefined;
    useIsoLayoutEffect(() => (active ? engine.on(type, (e) => ref.current?.(e)) : undefined), [engine, type, active]);
}

export interface PaneProps extends PaneOptions {
    /** Stable id (needed to address the pane, e.g. from drawings or saved state). Defaults to an auto id. */
    readonly id?: string;
    readonly children?: React.ReactNode;
}

/** A vertically stacked chart area with its own price scales. Panes are resizable by dragging separators. */
export function Pane({ id, children, ...options }: PaneProps) {
    const engine = useChart();
    const autoId = React.useId();
    const paneId = id ?? autoId;
    useIsoLayoutEffect(() => {
        engine.registerPane(paneId, options);
    });
    useIsoLayoutEffect(() => () => engine.unregisterPane(paneId), [engine, paneId]);
    return <PaneContext.Provider value={paneId}>{children}</PaneContext.Provider>;
}

export interface ChartOverlayProps {
    /** Pane to cover; defaults to the closest pane. */
    readonly pane?: string;
    /** "plot" covers the pane plot area, "chart" the whole chart. */
    readonly area?: "plot" | "chart";
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly children?: React.ReactNode;
}

/** Absolutely positioned DOM layer over a pane (legends, buttons, custom HTML). Pointer events pass through by default. */
export function ChartOverlay({ pane, area = "plot", className, style, children }: ChartOverlayProps) {
    const contextPane = usePaneId();
    const paneId = pane ?? contextPane;
    const rect = useChartState((s) => {
        if (area === "chart") {
            return { left: 0, top: 0, width: s.layout.width, height: s.layout.height };
        }
        const p = s.layout.panes.find((each) => each.id === paneId);
        return p ? { left: p.left, top: p.top, width: p.width, height: p.height } : null;
    }, shallowEqual);
    if (!rect || rect.height <= 0) {
        return null;
    }
    return (
        <div
            className={className}
            style={{ position: "absolute", ...rect, pointerEvents: "none", overflow: "hidden", ...style }}
        >
            {children}
        </div>
    );
}

export interface ChartCanvasProps<T = any> extends Omit<ChartOptions<T>, "theme"> {
    readonly data: readonly T[];
    /** Width in pixels; fills the parent when omitted. */
    readonly width?: number;
    /** Height in pixels; fills the parent when omitted. */
    readonly height?: number;
    /** Device pixel ratio; defaults to window.devicePixelRatio. */
    readonly ratio?: number;
    readonly theme?: "light" | "dark" | Theme | DeepPartial<Theme>;
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly children?: React.ReactNode;
}

const canvasStyle: React.CSSProperties = { position: "absolute", left: 0, top: 0 };

function ChartCanvasInner<T>(props: ChartCanvasProps<T>, ref: React.ForwardedRef<ChartEngine<T>>) {
    const { data, width, height, ratio: ratioProp, theme, className, style, children, ...options } = props;
    const [engine] = React.useState(() => new ChartEngine<T>());
    const containerRef = React.useRef<HTMLDivElement>(null);
    const sceneRef = React.useRef<HTMLCanvasElement>(null);
    const topRef = React.useRef<HTMLCanvasElement>(null);
    const [measured, setMeasured] = React.useState({ width: width ?? 0, height: height ?? 0 });
    const resolvedTheme = React.useMemo(() => resolveTheme(theme), [theme]);
    const ratio = ratioProp ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const w = width ?? measured.width;
    const h = height ?? measured.height;

    React.useImperativeHandle(ref, () => engine, [engine]);

    useIsoLayoutEffect(() => {
        engine.setOptions({ ...options, theme: resolvedTheme });
    });
    useIsoLayoutEffect(() => engine.setData(data), [engine, data]);
    useIsoLayoutEffect(() => engine.setSize(w, h, ratio), [engine, w, h, ratio]);

    useIsoLayoutEffect(() => {
        engine.attach(sceneRef.current!, topRef.current!);
        const detach = new Interaction(engine, topRef.current!, containerRef.current!).attach();
        return () => {
            detach();
            engine.destroy();
        };
    }, [engine]);

    useIsoLayoutEffect(() => {
        if (width !== undefined && height !== undefined) {
            return;
        }
        const el = containerRef.current!;
        const observer = new ResizeObserver(([entry]) => {
            const cw = Math.floor(entry.contentRect.width);
            const ch = Math.floor(entry.contentRect.height);
            if (cw <= 0 || ch <= 0) {
                return; // hidden (display: none, inactive tab): keep the last real size and view
            }
            setMeasured((m) => (m.width === cw && m.height === ch ? m : { width: cw, height: ch }));
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [width, height]);

    const canvasProps = { width: Math.max(1, Math.round(w * ratio)), height: Math.max(1, Math.round(h * ratio)) };
    const sized = { ...canvasStyle, width: w, height: h };

    return (
        <ChartContext.Provider value={engine as ChartEngine}>
            <div
                ref={containerRef}
                className={className ? `rc-chart ${className}` : "rc-chart"}
                tabIndex={0}
                style={{
                    position: "relative",
                    width: width ?? "100%",
                    height: height ?? "100%",
                    outline: "none",
                    overflow: "hidden",
                    background: resolvedTheme.background,
                    userSelect: "none",
                    WebkitTapHighlightColor: "transparent",
                    ...style,
                }}
            >
                <canvas ref={sceneRef} {...canvasProps} style={sized} />
                <canvas ref={topRef} {...canvasProps} style={sized} />
                {children}
            </div>
        </ChartContext.Provider>
    );
}

/**
 * The chart root. Owns data, the time axis viewport and the render loop; children
 * (panes, series, axes, tools) register with it. The ref exposes the `ChartEngine`
 * (zoomIn, zoomOut, resetView, scrollToRealtime, setVisibleRange, fitContent, screenshot...).
 */
export const ChartCanvas = React.forwardRef(ChartCanvasInner) as <T = any>(
    props: ChartCanvasProps<T> & { ref?: React.Ref<ChartEngine<T>> },
) => React.ReactElement;
