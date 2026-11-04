import {
    formatCompact,
    formatNumber,
    isFiniteNumber,
    shallowEqual,
    useChart,
    usePaneId,
    useRenderable,
    withAlpha,
    type ChartEngine,
    type DrawScope,
    type LegendItem,
    type Theme,
} from "@reincharts/core";
import * as React from "react";
import type { Values } from "./calculators/core";
import {
    resolveInputs,
    indicatorName,
    type IndicatorColorContext,
    type IndicatorDefinition,
    type IndicatorOutput,
} from "./definitions/types";
import { drawColumns, drawDots, drawLevel, fillArea, fillBetween, strokeLine, type Point } from "./draw";

/** Style overrides for one output. */
export interface IndicatorOutputStyle {
    /** Line / histogram color (overrides the definition color and `colorFn`). */
    readonly color?: string;
    /** Line width or dot radius. */
    readonly width?: number;
    /** Show or hide the output. Outputs marked `hidden` in the definition start hidden. */
    readonly visible?: boolean;
}

export interface IndicatorProps<I = any> {
    /** What to compute and draw, e.g. `indicators.rsi` or a custom `defineIndicator(...)`. */
    readonly definition: IndicatorDefinition<I>;
    /** Partial inputs merged over the definition defaults (e.g. `{ period: 21 }`). */
    readonly inputs?: Partial<I>;
    /** Per output style overrides keyed by output key, e.g. `{ rsi: { color: "#f00", width: 2 } }`. */
    readonly styles?: Readonly<Record<string, IndicatorOutputStyle>>;
    /** Legend name. Default: short name + inputs ("RSI 14 close"). */
    readonly name?: string;
    /** Stable legend / visibility id (defaults to an auto id). */
    readonly id?: string;
    /** Price scale id in the pane. Default "right". */
    readonly scale?: string;
    readonly zIndex?: number;
    readonly visible?: boolean;
    /** Draw the definition's horizontal levels (e.g. RSI 30 / 70). Default true. */
    readonly showLevels?: boolean;
    /** Draw the definition's fills (bands, clouds). Default true. */
    readonly showFills?: boolean;
    /** Register a legend item. Default true. */
    readonly legend?: boolean;
    /**
     * Always include the definition's `scale.domain` (e.g. RSI 0–100) in autoscale. Default false: the scale fits
     * the data plus the levels / band fills . To pin the scale instead, use
     * `<Pane scales={{ right: { domain: [0, 100] } }}>`.
     */
    readonly fitDomain?: boolean;
}

// Indicators mounted per chart, to give colorless outputs distinct palette colors.
const mounted = new WeakMap<ChartEngine, string[]>();

const offsetOf = (o: IndicatorOutput, inputs: unknown) =>
    typeof o.offset === "function" ? Math.round(o.offset(inputs)) : Math.round(o.offset ?? 0);

/** Visible slice of data indices for an output shifted by `off` bars (one extra bar each side). */
const sliceFor = (engine: ChartEngine, scope: { start: number; end: number }, off: number, n: number) => {
    if (engine.options.xMode === "linear") {
        return [Math.max(0, scope.start - 1), Math.min(n - 1, scope.end + 1)] as const;
    }
    const { from, to } = engine.range;
    return [Math.max(0, Math.floor(from) - off - 1), Math.min(n - 1, Math.ceil(to) - off + 1)] as const;
};

/**
 * Renders any indicator definition: lines, histograms, areas, dots, step lines, levels and fills. Computes lazily
 * from the chart data (memoized on data + inputs), autoscales (including `scale.domain`), registers one legend item
 * ("RSI 14 close") and magnet snap values.
 *
 * Oscillators: put them in their own pane (`<Pane><Indicator definition={indicators.rsi} /></Pane>`). Their
 * levels and band fills (RSI 30 / 70) are included in autoscale; pass `fitDomain` to always show the full
 * `scale.domain` (RSI 0–100), or pin the scale with `<Pane scales={{ right: { domain: [0, 100] } }}>`.
 */
export function Indicator<I = any>({
    definition: def,
    inputs: partial,
    styles,
    name,
    id: idProp,
    scale,
    zIndex,
    visible,
    showLevels = true,
    showFills = true,
    legend = true,
    fitDomain = false,
}: IndicatorProps<I>) {
    const engine = useChart();
    const paneId = usePaneId();
    const autoId = React.useId();
    const id = idProp ?? autoId;

    const merged = resolveInputs(def, partial);
    const inputsRef = React.useRef(merged);
    if (!shallowEqual(inputsRef.current, merged)) {
        inputsRef.current = merged;
    }
    const inputs = inputsRef.current;
    const cache = React.useRef<{
        data: readonly any[];
        def: IndicatorDefinition<I>;
        inputs: I;
        result: Record<string, Values>;
    } | null>(null);
    const compute = (): Record<string, Values> => {
        const data = engine.data;
        const c = cache.current;
        if (c && c.data === data && c.def === def && c.inputs === inputs) {
            return c.result;
        }
        const result = data.length ? def.calculate(data, inputs) : {};
        cache.current = { data, def, inputs, result };
        return result;
    };

    const entries = Object.entries(def.outputs);
    // only indicators with palette colored outputs take a palette slot
    const usesPalette = entries.some(([key, o]) => !o.color && !styles?.[key]?.color);
    React.useLayoutEffect(() => {
        if (!usesPalette) {
            return;
        }
        const list = mounted.get(engine) ?? [];
        mounted.set(engine, list);
        list.push(id);
        return () => {
            list.splice(list.indexOf(id), 1);
        };
    }, [engine, id, usesPalette]);

    const shown = entries.filter(([key, o]) => styles?.[key]?.visible ?? !o.hidden);
    const shownKeys = new Set(shown.map(([key]) => key));
    const colorOf = (key: string, theme: Theme) => {
        const k = entries.findIndex(([each]) => each === key);
        const o = def.outputs[key];
        const index = Math.max(0, mounted.get(engine)?.indexOf(id) ?? 0) + k;
        return styles?.[key]?.color ?? o?.color ?? theme.palette[index % theme.palette.length];
    };
    const barColor = (key: string, values: Values, i: number, ctx: IndicatorColorContext) => {
        const o = def.outputs[key];
        const v = values[i]!;
        return styles?.[key]?.color ?? (o.colorFn ? o.colorFn(v, values[i - 1], i, ctx) : colorOf(key, ctx.theme));
    };
    const offset = (o: IndicatorOutput) => (engine.options.xMode === "linear" ? 0 : offsetOf(o, inputs));
    const label = name ?? indicatorName(def, inputs);
    const format = (v: number) => {
        if (def.scale?.precision !== undefined) {
            return formatNumber(v, def.scale.precision);
        }
        if (def.scale?.compact) {
            return formatCompact(v);
        }
        return engine.getScale(paneId, scale).format(v);
    };
    const valueAt = (result: Record<string, Values>, key: string, i: number) => {
        const j = i - offset(def.outputs[key]);
        return result[key]?.[j];
    };

    const draw = (ctx: CanvasRenderingContext2D, scope: DrawScope) => {
        const result = compute();
        const n = engine.data.length;
        const { theme, y, pane } = scope;
        const width = pane?.width ?? 0;
        const height = pane?.height ?? 0;
        const linear = engine.options.xMode === "linear";
        const xAt = (j: number, off: number) => (linear ? scope.x(j) : engine.xOfLogical(j + off));
        const colorCtx: IndicatorColorContext = { data: engine.data, outputs: result, theme };

        if (showFills) {
            for (const fill of def.fills ?? []) {
                const [a, b] = fill.between;
                // a fill between outputs is drawn only while those outputs are shown
                if ((typeof a === "string" && !shownKeys.has(a)) || (typeof b === "string" && !shownKeys.has(b))) {
                    continue;
                }
                const output = typeof a === "string" ? a : typeof b === "string" ? b : undefined;
                const color = fill.color ?? withAlpha(output ? colorOf(output, theme) : theme.textMuted, 0.1);
                if (output === undefined) {
                    // between two constants: a horizontal band
                    const ya = y(a as number);
                    const yb = y(b as number);
                    ctx.fillStyle = color;
                    ctx.fillRect(0, Math.min(ya, yb), width, Math.abs(yb - ya));
                    continue;
                }
                const off = offset(def.outputs[output]);
                const [lo, hi] = sliceFor(engine, scope, off, n);
                const xs: number[] = [];
                const ya: number[] = [];
                const yb: number[] = [];
                for (let j = lo; j <= hi; j++) {
                    const va = typeof a === "number" ? a : result[a]?.[j];
                    const vb = typeof b === "number" ? b : result[b]?.[j];
                    xs.push(xAt(j, off));
                    ya.push(isFiniteNumber(va) ? y(va) : NaN);
                    yb.push(isFiniteNumber(vb) ? y(vb) : NaN);
                }
                fillBetween(ctx, xs, ya, yb, color, fill.colorBelow);
            }
        }

        if (showLevels) {
            for (const level of def.levels ?? []) {
                drawLevel(
                    ctx,
                    y(level.value),
                    width,
                    level.color ?? withAlpha(theme.textMuted, 0.7),
                    level.dash !== false,
                );
            }
        }

        for (const [key, o] of shown) {
            const values = result[key];
            if (!values) {
                continue;
            }
            const off = offset(o);
            const [lo, hi] = sliceFor(engine, scope, off, n);
            const color = colorOf(key, theme);
            const lineWidth = styles?.[key]?.width ?? o.width ?? (o.type === "dots" ? 2 : 1.5);
            if (o.type === "histogram" || o.type === "dots") {
                // one point per defined value, each colored by the output's colorFn
                const points: { x: number; y: number; color: string }[] = [];
                for (let j = lo; j <= hi; j++) {
                    const v = values[j];
                    if (isFiniteNumber(v)) {
                        points.push({ x: xAt(j, off), y: y(v), color: barColor(key, values, j, colorCtx) });
                    }
                }
                if (o.type === "histogram") {
                    const barWidth = Math.max(1, Math.min(scope.barSpacing * 0.6, scope.barSpacing - 1));
                    drawColumns(ctx, points, y(o.base ?? 0), barWidth);
                } else {
                    drawDots(ctx, points, Math.max(1, Math.min(lineWidth, scope.barSpacing / 2.5)));
                }
                continue;
            }
            const pts: Point[] = [];
            for (let j = lo; j <= hi; j++) {
                const v = values[j];
                pts.push(isFiniteNumber(v) ? [xAt(j, off), y(v)] : null);
            }
            if (o.type === "area") {
                fillArea(ctx, pts, o.base === undefined ? height : y(o.base), withAlpha(color, 0.2));
            }
            strokeLine(ctx, pts, color, lineWidth, o.dash, o.type === "step");
        }
    };

    useRenderable({
        scale,
        zIndex,
        get visible() {
            return visible !== false && !engine.isHidden(id);
        },
        draw,
        extent: (start, end) => {
            const result = compute();
            const n = engine.data.length;
            // shifted outputs (Ichimoku cloud) may be visible beyond the last bar
            const endBar =
                end >= n - 1 && engine.options.xMode !== "linear" ? Math.max(end, Math.ceil(engine.range.to)) : end;
            let min = Infinity;
            let max = -Infinity;
            for (const [key, o] of shown) {
                const values = result[key];
                if (!values) {
                    continue;
                }
                const off = offset(o);
                for (let j = Math.max(0, start - off); j <= Math.min(n - 1, endBar - off); j++) {
                    const v = values[j];
                    if (isFiniteNumber(v)) {
                        min = v < min ? v : min;
                        max = v > max ? v : max;
                    }
                }
                if (o.type === "histogram" && min <= max) {
                    min = Math.min(min, o.base ?? 0);
                    max = Math.max(max, o.base ?? 0);
                }
            }
            // levels and constant band fills are part of the autoscale range
            const fixed: number[] = [];
            if (showLevels) {
                fixed.push(...(def.levels ?? []).map((l) => l.value));
            }
            if (showFills) {
                for (const fill of def.fills ?? []) {
                    for (const v of fill.between as readonly (string | number)[]) {
                        if (typeof v === "number") {
                            fixed.push(v);
                        }
                    }
                }
            }
            if (fitDomain && def.scale?.domain) {
                fixed.push(...def.scale.domain);
            }
            if (min <= max) {
                for (const v of fixed) {
                    min = Math.min(min, v);
                    max = Math.max(max, v);
                }
            }
            return min <= max ? [min, max] : undefined;
        },
        baseValue: (start) => {
            const result = compute();
            const first = shown[0];
            const values = first ? result[first[0]] : undefined;
            for (let i = start; values && i < values.length; i++) {
                if (isFiniteNumber(values[i])) {
                    return values[i];
                }
            }
            return undefined;
        },
        snapValues: (i) => {
            const result = compute();
            return shown.map(([key]) => valueAt(result, key, i)).filter(isFiniteNumber);
        },
        legend: legend
            ? (i): LegendItem | undefined => {
                  if (i < 0) {
                      return undefined;
                  }
                  const result = compute();
                  const theme = engine.theme;
                  const colorCtx: IndicatorColorContext = { data: engine.data, outputs: result, theme };
                  return {
                      id,
                      name: label,
                      color: shown[0] ? colorOf(shown[0][0], theme) : undefined,
                      values: shown.map(([key, o]) => {
                          const v = valueAt(result, key, i);
                          const j = i - offset(o);
                          const color =
                              isFiniteNumber(v) && (o.type === "histogram" || o.type === "dots")
                                  ? barColor(key, result[key], j, colorCtx)
                                  : colorOf(key, theme);
                          return { value: isFiniteNumber(v) ? format(v) : "∅", color };
                      }),
                  };
              }
            : undefined,
        lastValue: () => {
            const result = compute();
            const first = shown.find(([, o]) => o.type !== "histogram" && offsetOf(o, inputs) === 0) ?? shown[0];
            const values = first ? result[first[0]] : undefined;
            for (let i = (values?.length ?? 0) - 1; values && i >= 0; i--) {
                const v = values[i];
                if (isFiniteNumber(v)) {
                    return { value: v, color: colorOf(first![0], engine.theme) };
                }
            }
            return undefined;
        },
    });
    return null;
}
