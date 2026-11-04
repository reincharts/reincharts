import { accessor, isFiniteNumber, type Accessor } from "@reincharts/core";
import { useSeries, type SeriesProps } from "./useSeries";

export interface ErrorBarSeriesProps<T = any> extends SeriesProps {
    /** Central value accessor. */
    readonly y: Accessor<T, number | undefined>;
    /** Symmetric error: the bar spans y − error … y + error. */
    readonly error?: Accessor<T, number | undefined>;
    /** Lower end accessor (overrides `error` for the lower end). */
    readonly low?: Accessor<T, number | undefined>;
    /** Upper end accessor (overrides `error` for the upper end). */
    readonly high?: Accessor<T, number | undefined>;
    /** Line color. Defaults to theme.neutral. */
    readonly color?: string;
    /** Line width. Default 1.5. */
    readonly lineWidth?: number;
    /** Whisker cap width in pixels. Default: half the bar spacing, at most 12. */
    readonly capWidth?: number;
}

/** Vertical error bars (whiskers) around a value. Combine with `ScatterSeries` or `BarSeries` for the value itself. */
export function ErrorBarSeries<T = any>({
    y,
    error,
    low,
    high,
    color,
    lineWidth = 1.5,
    capWidth,
    ...rest
}: ErrorBarSeriesProps<T>) {
    const value = accessor(y);
    const err = accessor(error);
    const lo = accessor(low);
    const hi = accessor(high);
    const range = (d: T, i: number): [number, number] | undefined => {
        const v = value(d, i);
        const e = err?.(d, i);
        const a = lo ? lo(d, i) : isFiniteNumber(v) && isFiniteNumber(e) ? v - e : undefined;
        const b = hi ? hi(d, i) : isFiniteNumber(v) && isFiniteNumber(e) ? v + e : undefined;
        return isFiniteNumber(a) && isFiniteNumber(b) ? [a, b] : undefined;
    };
    useSeries<T>({
        ...rest,
        values: (d, i) => [...(range(d, i) ?? []), value(d, i)],
        base: (d, i) => value(d, i),
        color: (_d, _i, theme) => color ?? theme.neutral,
        legendValues: (d, i, { format }) => {
            const r = range(d, i);
            const v = value(d, i);
            return [
                { value: isFiniteNumber(v) ? format(v) : "∅" },
                { label: "±", value: r ? `${format(r[0])} – ${format(r[1])}` : "∅" },
            ];
        },
        draw(ctx, { data, start, end, x, y: yOf, theme, barSpacing }) {
            const half = Math.round((capWidth ?? Math.min(12, barSpacing * 0.5)) / 2);
            const path = new Path2D();
            for (let i = start; i <= end; i++) {
                const r = data[i] === undefined ? undefined : range(data[i], i);
                if (!r) {
                    continue;
                }
                const cx = Math.round(x(i)) + 0.5;
                const y0 = Math.round(yOf(r[0])) + 0.5;
                const y1 = Math.round(yOf(r[1])) + 0.5;
                path.moveTo(cx, y0);
                path.lineTo(cx, y1);
                if (half > 0) {
                    path.moveTo(cx - half, y0);
                    path.lineTo(cx + half, y0);
                    path.moveTo(cx - half, y1);
                    path.lineTo(cx + half, y1);
                }
            }
            ctx.strokeStyle = color ?? theme.neutral;
            ctx.lineWidth = lineWidth;
            ctx.setLineDash([]);
            ctx.lineCap = "butt";
            ctx.stroke(path);
        },
    });
    return null;
}
