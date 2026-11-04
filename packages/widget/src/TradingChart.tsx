import { darkTheme, lightTheme, type ChartEngine, type Theme } from "@reincharts/core";
import type { CrosshairMode } from "@reincharts/coordinates";
import { RESOLUTIONS, type Datafeed } from "@reincharts/datafeed";
import { indicators as builtinIndicators, type IndicatorDefinition } from "@reincharts/indicators";
import * as React from "react";
import { BottomBar } from "./BottomBar";
import { ChartCell } from "./ChartCell";
import { ContextMenu } from "./ContextMenu";
import {
    WidgetContext,
    type CellSymbol,
    type ContextMenuState,
    type DialogState,
    type EffectiveSettings,
    type Features,
    type WidgetContextValue,
} from "./context";
import { Dialogs } from "./dialogs/Dialogs";
import { DrawingSidebar, useDrawingIntegration } from "./Drawings";
import { ObjectTree } from "./ObjectTree";
import { captureScreenshot, downloadDataUrl } from "./screenshot";
import {
    layoutCount,
    normalizeState,
    parseState,
    reduceState,
    type ChartType,
    type IndicatorState,
    type LayoutKind,
    type StateAction,
    type TradingChartState,
} from "./state";
import { Toolbar } from "./toolbar/Toolbar";
import { applyIndicatorColors, inferResolution, intervalLabel, measurePaneSizes } from "./utils";

/** An OHLCV bar for data mode: a `date` (Date) or `time` (ms epoch) plus prices. */
export interface TradingChartBar {
    /** Bar time as a Date (or use `time`). */
    readonly date?: Date;
    /** Bar time in ms epoch (or use `date`). */
    readonly time?: number;
    /** Open price. */
    readonly open: number;
    /** High price. */
    readonly high: number;
    /** Low price. */
    readonly low: number;
    /** Close (last) price. */
    readonly close: number;
    /** Traded volume (enables the volume histogram). */
    readonly volume?: number;
}

/** An indicator to start with: a registry id (`"rsi"`) or an object with inputs / styles. */
export type IndicatorConfig =
    | string
    | {
          /** Registry id (`indicators` key or an `extraIndicators` id). */
          readonly definitionId: string;
          /** Stable id (default `<definitionId>-<n>`). */
          readonly id?: string;
          /** Inputs merged over the defaults. */
          readonly inputs?: Record<string, unknown>;
          /** Output style overrides. */
          readonly styles?: IndicatorState["styles"];
          /** Pane: `"price"` to overlay, any id to share a pane. Default: overlays on the price pane, others in a new pane. */
          readonly paneId?: string;
          /** Start hidden. */
          readonly hidden?: boolean;
      };

/** Imperative API of `<TradingChart ref>`. */
export interface TradingChartHandle {
    /** Engine of the active chart (null before the first render). */
    readonly engine: ChartEngine | null;
    /** Current layout state including pane sizes and the visible range. */
    save(): TradingChartState;
    /**
     * Restores a state saved with `save()` (an object or its JSON string). Fields missing from a partial state get
     * their defaults, except `symbol` and `resolution` which stay as they are.
     */
    load(state: TradingChartState | Partial<TradingChartState> | string): void;
    /** Adds an indicator (registry id or definition) and returns its id. */
    addIndicator(
        definition: string | IndicatorDefinition,
        options?: { inputs?: Record<string, unknown>; styles?: IndicatorState["styles"]; paneId?: string },
    ): string | undefined;
    /** Removes an indicator by id. */
    removeIndicator(id: string): void;
    /** PNG data URL of every chart of the layout, with legends. */
    screenshot(): string;
    /** Resets zoom, scroll and price scales of every chart. */
    resetView(): void;
}

/** Props of `<TradingChart>`. */
export interface TradingChartProps {
    /** Data mode: OHLCV bars (sorted by time). Ignored when `datafeed` is set. */
    readonly data?: readonly TradingChartBar[];
    /** Datafeed mode: loads history, realtime bars, older pages and symbol search from your backend. */
    readonly datafeed?: Datafeed;
    /** Controlled symbol. In data mode it is only a label. */
    readonly symbol?: string;
    /** Initial symbol (uncontrolled). */
    readonly defaultSymbol?: string;
    /** Called when the user picks another symbol. */
    readonly onSymbolChange?: (symbol: string) => void;
    /** Controlled resolution ("1", "60", "1D"...). In data mode it is only a label (default: guessed from the data). */
    readonly resolution?: string;
    /** Initial resolution (uncontrolled). Default "1D". */
    readonly defaultResolution?: string;
    /** Called when the user picks another resolution. */
    readonly onResolutionChange?: (resolution: string) => void;
    /** Resolutions offered by the interval picker (datafeed mode). Default: `RESOLUTIONS` from @reincharts/datafeed. */
    readonly resolutions?: readonly string[];
    /** "light", "dark" or a full theme object. The theme toggle overrides it (saved in the state). Default "light". */
    readonly theme?: "light" | "dark" | Theme;
    /** Widget height (number = px). Default: fills the parent. */
    readonly height?: number | string;
    /** Widget width (number = px). Default: fills the parent. */
    readonly width?: number | string;
    /** IANA time zone of the time axis. Default: the browser time zone. */
    readonly timeZone?: string;
    /** Controlled chart type. */
    readonly chartType?: ChartType;
    /** Initial chart type (uncontrolled). Default "candles". */
    readonly defaultChartType?: ChartType;
    /** Called when the user picks another chart type. */
    readonly onChartTypeChange?: (chartType: ChartType) => void;
    /** Controlled indicator list. */
    readonly indicators?: readonly IndicatorState[];
    /** Indicators to start with (uncontrolled), e.g. `["ema", "rsi", { definitionId: "macd", inputs: { fast: 8 } }]`. */
    readonly defaultIndicators?: readonly IndicatorConfig[];
    /** Called when indicators are added, removed or edited. */
    readonly onIndicatorsChange?: (indicators: IndicatorState[]) => void;
    /** Custom indicators (`defineIndicator`) listed under "Custom" in the indicators dialog. */
    readonly extraIndicators?: readonly IndicatorDefinition[];
    /** Controlled whole-layout state. */
    readonly state?: TradingChartState;
    /** Initial whole-layout state (uncontrolled), e.g. a state saved with `ref.save()`. */
    readonly defaultState?: Partial<TradingChartState>;
    /** Called with the new state after every user change. */
    readonly onStateChange?: (state: TradingChartState) => void;
    /** Controlled multi-chart layout. */
    readonly layout?: LayoutKind;
    /** Called when the user picks another layout. */
    readonly onLayoutChange?: (layout: LayoutKind) => void;
    /** Sync the visible time range across the charts of a layout (the crosshair is always synced). Default false. */
    readonly syncRange?: boolean;
    /** Show the top toolbar. Default true. */
    readonly toolbar?: boolean;
    /** Show the left drawing toolbar. Default true. */
    readonly drawingToolbar?: boolean;
    /** Show pane legends. Default true. */
    readonly legend?: boolean;
    /** Show the volume histogram. Default true (when the bars have volume). */
    readonly volume?: boolean;
    /** Show the symbol watermark. Default true. */
    readonly watermark?: boolean;
    /** Show the grid. Default true. */
    readonly grid?: boolean;
    /** Show the bottom bar (range presets, time zone, scale toggles). Default true. */
    readonly bottomBar?: boolean;
    /** Enable the right-click context menu. Default true. */
    readonly contextMenu?: boolean;
    /** Enable the object tree panel. Pass "open" to show it initially. Default true. */
    readonly objectTree?: boolean | "open";
    /** Enable bar replay. Default true. */
    readonly replay?: boolean;
    /** Enable compare symbols (datafeed mode). Default true. */
    readonly compare?: boolean;
    /** Crosshair mode. Default "normal". */
    readonly crosshair?: CrosshairMode;
    /** Device pixel ratio of the canvases. Default: window.devicePixelRatio. */
    readonly ratio?: number;
    /** Extra class name of the root element (`.rc-widget`). */
    readonly className?: string;
    /** Inline styles of the root element (e.g. `--rc-*` theme variables). */
    readonly style?: React.CSSProperties;
}

const configToAction = (
    config: IndicatorConfig,
    definitions: Record<string, IndicatorDefinition>,
): StateAction | undefined => {
    const c = typeof config === "string" ? { definitionId: config } : config;
    const definition = definitions[c.definitionId];
    return definition
        ? { type: "addIndicator", definition, id: c.id, inputs: c.inputs, styles: c.styles, paneId: c.paneId }
        : undefined;
};

/** Infers the theme name of the `theme` prop. */
const themeNameOf = (theme: TradingChartProps["theme"]): "light" | "dark" =>
    theme === "dark" || (typeof theme === "object" && theme.name === "dark") ? "dark" : "light";

function TradingChartInner(props: TradingChartProps, ref: React.ForwardedRef<TradingChartHandle>) {
    const {
        data,
        datafeed,
        theme,
        height,
        width,
        resolutions = RESOLUTIONS,
        extraIndicators,
        syncRange = false,
        ratio,
        className,
        style,
    } = props;

    const definitions = React.useMemo(() => {
        const out: Record<string, IndicatorDefinition> = { ...builtinIndicators };
        for (const def of extraIndicators ?? []) {
            out[def.id] = def;
        }
        return out;
    }, [extraIndicators]);
    const customIds = React.useMemo(() => new Set((extraIndicators ?? []).map((d) => d.id)), [extraIndicators]);

    // ------------------------------------------------------------ state (controlled + uncontrolled)
    const [internal, setInternal] = React.useState<TradingChartState>(() => {
        let s = normalizeState(props.defaultState ?? {}, {
            symbol: props.defaultSymbol ?? "",
            resolution: props.defaultResolution ?? "1D",
            chartType: props.defaultChartType ?? "candles",
        });
        if (!props.defaultState?.indicators) {
            for (const config of props.defaultIndicators ?? []) {
                const action = configToAction(config, definitions);
                if (!action) {
                    continue;
                }
                s = reduceState(s, applyIndicatorColors(action, s, s.theme ?? themeNameOf(theme)));
                const added = s.indicators[s.indicators.length - 1];
                if (typeof config !== "string" && config.hidden) {
                    s = reduceState(s, { type: "updateIndicator", id: added.id, patch: { hidden: true } });
                }
            }
        }
        return s;
    });
    const controlledState = React.useMemo(() => (props.state ? normalizeState(props.state) : undefined), [props.state]);
    const base = controlledState ?? internal;
    const state = React.useMemo<TradingChartState>(() => {
        let s = base;
        const patch: Partial<TradingChartState> = {};
        if (props.symbol !== undefined && props.symbol !== s.symbol) {
            patch.symbol = props.symbol;
        }
        if (props.resolution !== undefined && props.resolution !== s.resolution) {
            patch.resolution = props.resolution;
        }
        if (props.chartType !== undefined && props.chartType !== s.chartType) {
            patch.chartType = props.chartType;
        }
        if (props.indicators !== undefined && props.indicators !== s.indicators) {
            patch.indicators = [...props.indicators];
        }
        if (props.layout !== undefined && props.layout !== s.layout) {
            patch.layout = props.layout;
        }
        if (Object.keys(patch).length) {
            s = { ...s, ...patch };
        }
        return s;
    }, [base, props.symbol, props.resolution, props.chartType, props.indicators, props.layout]);

    const stateRef = React.useRef(state);
    stateRef.current = state;
    const propsRef = React.useRef(props);
    propsRef.current = props;

    const dispatch = React.useCallback((action: StateAction) => {
        const prev = stateRef.current;
        const next = reduceState(prev, action);
        if (next === prev) {
            return;
        }
        stateRef.current = next;
        const p = propsRef.current;
        if (!p.state) {
            setInternal(next);
        }
        p.onStateChange?.(next);
        if (next.symbol !== prev.symbol) {
            p.onSymbolChange?.(next.symbol);
        }
        if (next.resolution !== prev.resolution) {
            p.onResolutionChange?.(next.resolution);
        }
        if (next.chartType !== prev.chartType) {
            p.onChartTypeChange?.(next.chartType);
        }
        if (next.indicators !== prev.indicators) {
            p.onIndicatorsChange?.(next.indicators);
        }
        if ((next.layout ?? "single") !== (prev.layout ?? "single")) {
            p.onLayoutChange?.(next.layout ?? "single");
        }
    }, []);

    // ------------------------------------------------------------ theme & settings
    const themeName = state.theme ?? themeNameOf(theme);
    const chartTheme = React.useMemo(
        () =>
            typeof theme === "object" && themeNameOf(theme) === themeName
                ? theme
                : themeName === "dark"
                  ? darkTheme
                  : lightTheme,
        [theme, themeName],
    );
    const s = state.settings;
    const settings: EffectiveSettings = {
        crosshair: s?.crosshair ?? props.crosshair ?? "normal",
        volume: s?.volume ?? props.volume ?? true,
        watermark: s?.watermark ?? props.watermark ?? true,
        legend: s?.legend ?? props.legend ?? true,
        grid: s?.grid ?? props.grid ?? true,
        lastPriceLine: s?.lastPriceLine ?? true,
        timeZone: s?.timeZone ?? props.timeZone,
    };
    // checked after mount (same markup on the server and the client)
    const [canFullscreen, setCanFullscreen] = React.useState(true);
    React.useEffect(() => setCanFullscreen(typeof HTMLElement.prototype.requestFullscreen === "function"), []);
    const settingsRef = React.useRef(settings);
    settingsRef.current = settings;
    const features: Features = {
        toolbar: props.toolbar ?? true,
        drawingToolbar: props.drawingToolbar ?? true,
        bottomBar: props.bottomBar ?? true,
        contextMenu: props.contextMenu ?? true,
        objectTree: props.objectTree !== false,
        replay: props.replay ?? true,
        compare: (props.compare ?? true) && !!datafeed,
        fullscreen: canFullscreen,
    };

    // ------------------------------------------------------------ UI state
    const rootRef = React.useRef<HTMLDivElement>(null);
    const engines = React.useRef<(ChartEngine | null)[]>([]);
    const [activeCell, setActiveCellState] = React.useState(0);
    const [engine, setEngine] = React.useState<ChartEngine | null>(null);
    const activeRef = React.useRef(0);
    const registerEngine = React.useCallback((cell: number, e: ChartEngine | null) => {
        engines.current[cell] = e;
        if (cell === activeRef.current) {
            setEngine(e);
        }
    }, []);
    const setActiveCell = React.useCallback((cell: number) => {
        activeRef.current = cell;
        setActiveCellState(cell);
        setEngine(engines.current[cell] ?? null);
    }, []);
    const count = layoutCount(state.layout);
    React.useEffect(() => {
        if (activeRef.current >= count) {
            setActiveCell(0);
        }
    }, [count, setActiveCell]);

    const [dialog, openDialog] = React.useState<DialogState>(null);
    const [contextMenu, openContextMenu] = React.useState<ContextMenuState | null>(null);
    const [replay, setReplay] = React.useState(false);
    const [objectTreeOpen, setObjectTreeOpen] = React.useState(props.objectTree === "open");
    const [fullscreen, setFullscreen] = React.useState(false);
    const pendingRange = React.useRef<{ from: number; to: number } | undefined>(state.visibleRange);
    const [infos, setInfos] = React.useState<Record<number, CellSymbol>>({});
    const setSymbolInfo = React.useCallback(
        (cell: number, info: CellSymbol) =>
            setInfos((prev) => {
                const p = prev[cell];
                return p &&
                    p.symbol === info.symbol &&
                    p.description === info.description &&
                    p.exchange === info.exchange
                    ? prev
                    : { ...prev, [cell]: info };
            }),
        [],
    );
    const symbolInfo = (cell: number): CellSymbol => {
        const symbol = cell === 0 ? state.symbol : (state.cells?.[cell - 1] ?? state.symbol);
        const info = infos[cell];
        return info && info.symbol === symbol ? info : { symbol };
    };
    const symbolInfoRef = React.useRef(symbolInfo);
    symbolInfoRef.current = symbolInfo;

    React.useEffect(() => {
        const onChange = () =>
            setFullscreen(!!document.fullscreenElement && document.fullscreenElement === rootRef.current);
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);
    const toggleFullscreen = React.useCallback(() => {
        const el = rootRef.current;
        if (!el) {
            return;
        }
        // another element (e.g. the page) may be fullscreen: the widget can still go fullscreen inside it
        if (document.fullscreenElement === el) {
            void document.exitFullscreen?.();
        } else {
            void el.requestFullscreen?.()?.catch(() => {});
        }
    }, []);

    const drawings = useDrawingIntegration(state.drawings, (d) => dispatch({ type: "drawings", drawings: d }));
    const drawingsRef = React.useRef(drawings);
    drawingsRef.current = drawings;

    const syncIdBase = React.useId();
    const syncId = count > 1 ? `rc-widget-${syncIdBase}` : undefined;

    const screenshot = React.useCallback(() => {
        const cells = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(".rc-w-cell") ?? []);
        return captureScreenshot(
            cells.map((el, i) => ({ el, engine: engines.current[i] ?? null, title: symbolInfoRef.current(i) })),
            {
                // data mode: the interval of the bars (the resolution is only a label there)
                interval: intervalLabel(
                    propsRef.current.datafeed
                        ? stateRef.current.resolution
                        : (inferResolution(propsRef.current.data ?? []) ?? stateRef.current.resolution),
                ),
                legend: settingsRef.current.legend,
                hidden: new Set(stateRef.current.indicators.filter((i) => i.hidden).map((i) => i.id)),
            },
        );
    }, []);
    const downloadScreenshot = React.useCallback(() => {
        downloadDataUrl(screenshot(), `${stateRef.current.symbol || "chart"}.png`);
    }, [screenshot]);

    const addIndicator = React.useCallback<TradingChartHandle["addIndicator"]>(
        (definition, options = {}) => {
            const def = typeof definition === "string" ? definitions[definition] : definition;
            if (!def) {
                return undefined;
            }
            const before = new Set(stateRef.current.indicators.map((i) => i.id));
            dispatch(
                applyIndicatorColors(
                    { type: "addIndicator", definition: def, ...options },
                    stateRef.current,
                    stateRef.current.theme ?? themeNameOf(propsRef.current.theme),
                ),
            );
            return stateRef.current.indicators.find((i) => !before.has(i.id))?.id;
        },
        [definitions, dispatch],
    );

    React.useImperativeHandle(
        ref,
        (): TradingChartHandle => ({
            get engine() {
                return engines.current[activeRef.current] ?? null;
            },
            save() {
                drawingsRef.current.flush();
                const e = engines.current[0];
                const out: TradingChartState = { ...stateRef.current };
                if (e && e.data.length) {
                    out.paneSizes = measurePaneSizes(e);
                    const r = e.getVisibleRange();
                    if (Number.isFinite(r.from) && Number.isFinite(r.to)) {
                        out.visibleRange = { from: r.from, to: r.to };
                    }
                }
                return normalizeState(out);
            },
            load(input) {
                // missing symbol / resolution keep the current ones, every other missing field gets its default
                const { symbol, resolution } = stateRef.current;
                const next = parseState(input, { symbol, resolution });
                // applied by the first chart after the render (once the new data / chart type is in)
                pendingRange.current = next.visibleRange;
                dispatch({ type: "load", state: next });
            },
            addIndicator,
            removeIndicator: (id) => dispatch({ type: "removeIndicator", id }),
            screenshot,
            resetView() {
                for (const e of engines.current) {
                    e?.resetView();
                }
            },
        }),
        [addIndicator, dispatch, screenshot],
    );

    const value: WidgetContextValue = {
        state,
        dispatch,
        definitions,
        customIds,
        datafeed,
        data,
        resolutions,
        features,
        settings,
        themeName,
        chartTheme,
        activeCell,
        setActiveCell,
        engine,
        registerEngine,
        engines,
        dialog,
        openDialog,
        contextMenu,
        openContextMenu,
        replay,
        setReplay,
        objectTreeOpen: objectTreeOpen && features.objectTree,
        setObjectTreeOpen,
        fullscreen,
        toggleFullscreen,
        screenshot,
        downloadScreenshot,
        pendingRange,
        syncId,
        syncRange,
        drawings,
        rootRef,
        symbolInfo,
        setSymbolInfo,
    };

    const layout = state.layout ?? "single";
    return (
        <WidgetContext.Provider value={value}>
            <div
                ref={rootRef}
                className={className ? `rc-widget ${className}` : "rc-widget"}
                data-theme={themeName}
                data-fullscreen={fullscreen ? "" : undefined}
                style={{ width: width ?? "100%", height: height ?? "100%", ...style }}
            >
                {features.toolbar && <Toolbar />}
                <div className="rc-w-body">
                    {features.drawingToolbar && drawings.available && (
                        <DrawingSidebar integration={drawings} theme={themeName} />
                    )}
                    <div className="rc-w-grid" data-layout={layout}>
                        {Array.from({ length: count }, (_, cell) => (
                            <ChartCell key={cell} cell={cell} ratio={ratio} />
                        ))}
                    </div>
                    {value.objectTreeOpen && <ObjectTree />}
                </div>
                {features.bottomBar && <BottomBar />}
                <Dialogs />
                {features.contextMenu && contextMenu && <ContextMenu />}
            </div>
        </WidgetContext.Provider>
    );
}

/**
 * A batteries-included stock chart: toolbar (symbol search, intervals, chart types, indicators,
 * compare, layouts, replay, screenshot, fullscreen, theme), drawing tools, legends with controls, indicator
 * settings, context menu, object tree, range presets and scale modes, multi-chart layouts with sync — in
 * data mode (`data`) or datafeed mode (`datafeed`). Import `@reincharts/widget/styles.css` once.
 */
export const TradingChart = React.forwardRef(TradingChartInner);
