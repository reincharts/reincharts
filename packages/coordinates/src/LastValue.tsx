import {
    accessor,
    functor,
    isFiniteNumber,
    useChart,
    useRenderable,
    type Accessor,
    type ChartEngine,
    type Functor,
    type LineDash,
    type Renderable,
} from "@reincharts/core";
import { drawValueMarkers, type ValueMarker } from "./PriceLine";

export interface LastValueEntry {
    readonly renderable: Renderable;
    /** Price scale id of the series. */
    readonly scale: string;
    /** Last raw value of the series. */
    readonly value: number;
    readonly color: string;
    /** Base value for percent / indexed scales. */
    readonly base: number | undefined;
    /** Series name from its legend (may be empty). */
    readonly name: string;
}

/** Last values of every visible series in a pane (renderables implementing `lastValue()`), in z order. */
export const lastValues = (engine: ChartEngine, paneId: string): LastValueEntry[] => {
    const out: LastValueEntry[] = [];
    const start = engine.range.start;
    const last = engine.data.length - 1;
    for (const r of engine.ordered()) {
        if (r.pane !== paneId || r.visible === false || !r.lastValue) {
            continue;
        }
        const lv = r.lastValue();
        if (!lv || !isFiniteNumber(lv.value)) {
            continue;
        }
        const name = r.legend?.(last)?.name ?? "";
        out.push({
            renderable: r,
            scale: r.scale ?? "right",
            value: lv.value,
            color: lv.color,
            base: r.baseValue?.(start),
            name,
        });
    }
    return out;
};

export interface LastValueLabelProps {
    /** Also draw a line across the plot at each last value. Default false. */
    readonly line?: boolean;
    /** Line dash. Default "dotted". */
    readonly lineStyle?: LineDash;
    /** Line width. Default 1. */
    readonly lineWidth?: number;
    /** Show the colored value label on the price axis. Default true. */
    readonly axisLabel?: boolean;
    /** Draw the series name as a title at the right edge of the plot. Default false. */
    readonly showName?: boolean;
    /** Only show some series. */
    readonly filter?: (entry: LastValueEntry) => boolean;
    /** Custom label text. Defaults to the scale's formatting. */
    readonly format?: (value: number, entry: LastValueEntry) => string;
    /** Label text color. Defaults to black / white depending on the series color. */
    readonly textColor?: string;
    readonly zIndex?: number;
}

/** Colored labels with the last value of each series of the pane on the price axis. */
export function LastValueLabel({
    line = false,
    lineStyle = "dotted",
    lineWidth = 1,
    axisLabel = true,
    showName = false,
    filter,
    format,
    textColor,
    zIndex = 110,
}: LastValueLabelProps) {
    const engine = useChart();
    useRenderable({
        clip: false,
        zIndex,
        // tell axes where the labels go, so tick labels underneath are skipped
        axisLabels: axisLabel
            ? (paneId) =>
                  lastValues(engine, paneId)
                      .filter((e) => !filter || filter(e))
                      .map((e) => ({ scale: e.scale, y: engine.getScale(paneId, e.scale).toY(e.value, e.base) }))
            : undefined,
        draw(ctx, scope) {
            if (!scope.pane) {
                return;
            }
            const paneId = scope.pane.id;
            const byScale = new Map<string, ValueMarker[]>();
            for (const e of lastValues(engine, paneId)) {
                if (filter && !filter(e)) {
                    continue;
                }
                const s = engine.getScale(paneId, e.scale);
                const list = byScale.get(e.scale) ?? [];
                list.push({
                    y: s.toY(e.value, e.base),
                    text: format ? format(e.value, e) : s.format(e.value, e.base),
                    color: e.color,
                    textColor,
                    line,
                    lineStyle,
                    lineWidth,
                    axisLabel,
                    title: showName && e.name ? e.name : undefined,
                });
                byScale.set(e.scale, list);
            }
            for (const [scaleId, markers] of byScale) {
                drawValueMarkers(ctx, scope, scaleId, markers);
            }
        },
    });
    return null;
}

/** `LastValueLabel` with a dotted line across the plot at each last value. */
export const LastValueLine = (props: LastValueLabelProps) => <LastValueLabel line {...props} />;

export interface EdgeIndicatorProps<T = any> {
    /** Value accessor. */
    readonly y: Accessor<T, number | undefined>;
    /** Use the first or the last visible datum. Default "last". */
    readonly item?: "first" | "last";
    /** Label / line color (static or per datum). Defaults to theme.line. */
    readonly color?: Functor<T, string>;
    /** Label text color. Defaults to black / white depending on `color`. */
    readonly textColor?: string;
    /** Draw a line across the plot. Default false. */
    readonly line?: boolean;
    /** Line dash. Default "dotted". */
    readonly lineStyle?: LineDash;
    /** Price scale id. Default "right". */
    readonly scale?: string;
    /** Custom label text. */
    readonly format?: (value: number) => string;
    readonly zIndex?: number;
}

/** A price axis label (and optional line) for the first or last visible value of any accessor. */
export function EdgeIndicator<T = any>({
    y,
    item = "last",
    color,
    textColor,
    line = false,
    lineStyle = "dotted",
    scale = "right",
    format,
    zIndex = 110,
}: EdgeIndicatorProps<T>) {
    const value = accessor(y);
    const colorOf = color === undefined ? undefined : functor(color);
    useRenderable<T>({
        scale,
        clip: false,
        zIndex,
        draw(ctx, scope) {
            const { data, start, end } = scope;
            const step = item === "last" ? -1 : 1;
            for (let i = item === "last" ? end : start; i >= start && i <= end; i += step) {
                const v = value(data[i], i);
                if (isFiniteNumber(v)) {
                    const c = colorOf?.(data[i], i) ?? scope.theme.line;
                    const text = format ? format(v) : (scope.scale?.format(v) ?? String(v));
                    drawValueMarkers(ctx, scope, scale, [
                        { y: scope.y(v), text, color: c, textColor, line, lineStyle },
                    ]);
                    return;
                }
            }
        },
    });
    return null;
}
