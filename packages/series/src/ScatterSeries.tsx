import {
    accessor,
    isFiniteNumber,
    useChart,
    usePaneId,
    withAlpha,
    type Accessor,
    type Functor,
    type Theme,
} from "@reincharts/core";
import * as React from "react";
import type { BarColor } from "./bars";
import { resolveColor } from "./BarSeries";
import { PathBatch } from "./geometry";
import { traceMarker, type MarkerShape } from "./marker";
import { useSeries, type SeriesProps } from "./useSeries";

export interface ScatterSeriesProps<T = any> extends SeriesProps {
    /** Value accessor (vertical position). */
    readonly y: Accessor<T, number | undefined>;
    /** Marker shape, static or per point. Default "circle". */
    readonly marker?: Functor<T, MarkerShape>;
    /** Marker diameter in pixels, static or per point. Default 8. */
    readonly size?: Functor<T, number>;
    /** Marker color, static or per point (receives the theme). Defaults to theme.line. */
    readonly fill?: BarColor<T>;
    /** Fill opacity applied to `fill`. Default 0.6. */
    readonly fillOpacity?: number;
    /** Outline color; defaults to the opaque marker color. Pass "none" for no outline. */
    readonly stroke?: BarColor<T>;
    /** Outline width. Default 1. */
    readonly strokeWidth?: number;
    /** Max pixel distance for hover to pick the nearest point (2D). Default 32. */
    readonly hoverRadius?: number;
}

/**
 * Markers at (x, y) per datum: scatter plots (works with unsorted data in `xMode="linear"`),
 * dot plots and indicator dots such as Parabolic SAR. Hover picks the nearest point in 2D.
 */
export function ScatterSeries<T = any>({
    y,
    marker = "circle",
    size = 8,
    fill,
    fillOpacity = 0.6,
    stroke,
    strokeWidth = 1,
    hoverRadius = 32,
    ...rest
}: ScatterSeriesProps<T>) {
    const engine = useChart<T>();
    const paneId = usePaneId();
    const value = accessor(y);
    const shapeAt = typeof marker === "function" ? marker : () => marker;
    const sizeAt = typeof size === "function" ? size : () => size;
    const colorOf = (d: T, i: number, theme: Theme) => resolveColor(fill, d, i, theme);
    useSeries<T>({
        ...rest,
        values: (d, i) => value(d, i),
        color: colorOf,
        draw(ctx, { data, start, end, x, y: yOf, theme }) {
            const fills = new PathBatch();
            const strokes = new PathBatch();
            for (let i = start; i <= end; i++) {
                const d = data[i];
                const v = d === undefined ? undefined : value(d, i);
                if (!isFiniteNumber(v)) {
                    continue;
                }
                const s = sizeAt(d, i);
                if (!(s > 0)) {
                    continue;
                }
                const color = colorOf(d, i, theme);
                const px = x(i);
                const py = yOf(v);
                const shape = shapeAt(d, i);
                traceMarker(fills.get(fillOpacity < 1 ? withAlpha(color, fillOpacity) : color), shape, px, py, s);
                const outline = stroke === undefined ? color : resolveColor(stroke, d, i, theme);
                if (strokeWidth > 0 && outline !== "none") {
                    traceMarker(strokes.get(outline), shape, px, py, s);
                }
            }
            fills.fill(ctx);
            ctx.lineJoin = "round";
            strokes.stroke(ctx, strokeWidth);
        },
        indexAt: (px, py) => {
            const { start, end } = engine.range;
            const scale = engine.getScale(paneId, rest.scale);
            let best: number | undefined;
            let bestDist = hoverRadius * hoverRadius;
            for (let i = start; i <= end; i++) {
                const v = engine.data[i] === undefined ? undefined : value(engine.data[i], i);
                if (!isFiniteNumber(v)) {
                    continue;
                }
                const dx = engine.xOfIndex(i) - px;
                const dy = scale.toY(v) - py;
                const dist = dx * dx + dy * dy;
                if (dist <= bestDist) {
                    bestDist = dist;
                    best = i;
                }
            }
            return best;
        },
    });
    return null;
}

export interface BubbleSeriesProps<T = any> extends Omit<ScatterSeriesProps<T>, "size"> {
    /** Value mapped to the bubble area. */
    readonly r: Accessor<T, number | undefined>;
    /** Diameter of the smallest bubble in pixels. Default 4. */
    readonly minSize?: number;
    /** Diameter of the largest bubble in pixels. Default 40. */
    readonly maxSize?: number;
}

/** Scatter plot whose marker area is proportional to a third value (`r`). */
export function BubbleSeries<T = any>({
    r,
    minSize = 4,
    maxSize = 40,
    fillOpacity = 0.45,
    ...rest
}: BubbleSeriesProps<T>) {
    const engine = useChart<T>();
    const radius = accessor(r);
    const cache = React.useRef<{ data: readonly T[] | null; max: number }>({ data: null, max: 1 });
    const size = (d: T, i: number) => {
        const c = cache.current;
        if (c.data !== engine.data) {
            c.data = engine.data;
            c.max = engine.data.reduce((m, each, k) => Math.max(m, Math.abs(radius(each, k) ?? 0)), 0) || 1;
        }
        const v = Math.abs(radius(d, i) ?? NaN);
        return isFiniteNumber(v) ? minSize + (maxSize - minSize) * Math.sqrt(v / c.max) : 0;
    };
    return <ScatterSeries<T> {...rest} fillOpacity={fillOpacity} size={size} />;
}
