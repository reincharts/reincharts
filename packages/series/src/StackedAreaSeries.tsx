import { accessor, applyStroke, isFiniteNumber, withAlpha, type Accessor } from "@reincharts/core";
import { paletteColor } from "./MultiBarSeries";
import { traceArea, tracePath, type Curve, type Point } from "./path";
import { stackAt, type StackOptions, type StackedValue } from "./stack";
import { useSeries, type SeriesProps } from "./useSeries";

export interface StackedAreaSeriesProps<T = any> extends SeriesProps, StackOptions {
    /** One accessor per layer, bottom layer first. */
    readonly ys: readonly Accessor<T, number | undefined>[];
    /** Color per layer. Defaults to the theme palette. */
    readonly colors?: readonly string[];
    /** Legend label per layer. */
    readonly names?: readonly string[];
    /** Fill opacity of each layer. Default 0.35. */
    readonly fillOpacity?: number;
    /** Width of the line on top of each layer; 0 for none. Default 1.5. */
    readonly lineWidth?: number;
    /** Interpolation. Default "linear". */
    readonly curve?: Curve;
}

/** Areas stacked on top of each other (or normalised to 100% with `offset="percent"`). */
export function StackedAreaSeries<T = any>({
    ys,
    colors,
    names,
    offset = "none",
    fillOpacity = 0.35,
    lineWidth = 1.5,
    curve = "linear",
    ...rest
}: StackedAreaSeriesProps<T>) {
    const fns = ys.map((y) => accessor(y));
    const stacked = (d: T, i: number) => {
        const out: (StackedValue | undefined)[] = [];
        stackAt(d, i, fns, offset, (k, v) => {
            out[k] = v;
        });
        return out;
    };
    useSeries<T>({
        ...rest,
        values: (d, i) => stacked(d, i).flatMap((v) => (v ? [v[0], v[1]] : [])),
        base: (d, i) => stacked(d, i).at(-1)?.[1],
        color: (_d, _i, theme) => paletteColor(colors, fns.length - 1, theme),
        legendValues: (d, i, { format, theme }) =>
            fns.map((f, k) => {
                const v = f(d, i);
                return {
                    label: names?.[k],
                    value: isFiniteNumber(v) ? format(v) : "∅",
                    color: paletteColor(colors, k, theme),
                };
            }),
        draw(ctx, { data, start, end, x, y, theme }) {
            const tops: (Point | null)[][] = fns.map(() => []);
            const bottoms: (Point | null)[][] = fns.map(() => []);
            for (let i = start; i <= end; i++) {
                const px = x(i);
                const s = data[i] === undefined ? [] : stacked(data[i], i);
                for (let k = 0; k < fns.length; k++) {
                    const v = s[k];
                    tops[k].push(v ? [px, y(v[1])] : null);
                    bottoms[k].push(v ? [px, y(v[0])] : null);
                }
            }
            ctx.lineJoin = "round";
            for (let k = 0; k < fns.length; k++) {
                const color = paletteColor(colors, k, theme);
                const area = new Path2D();
                traceArea(area, tops[k], bottoms[k], curve);
                ctx.fillStyle = withAlpha(color, fillOpacity);
                ctx.fill(area);
                if (lineWidth > 0) {
                    applyStroke(ctx, { color, width: lineWidth });
                    ctx.beginPath();
                    tracePath(ctx, tops[k], curve);
                    ctx.stroke();
                }
            }
        },
    });
    return null;
}
