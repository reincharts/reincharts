import { accessor, applyStroke, withAlpha, type Accessor } from "@reincharts/core";
import { linePoints, traceArea, tracePath } from "./path";
import { ohlcLegend } from "./ohlc";
import { useSeries, type SeriesProps } from "./useSeries";

export interface HLCAreaSeriesProps<T = any> extends SeriesProps {
    /** High accessor. Default "high". */
    readonly high?: Accessor<T>;
    /** Low accessor. Default "low". */
    readonly low?: Accessor<T>;
    /** Close accessor. Default "close". */
    readonly close?: Accessor<T>;
    /** High line and the fill between high and close. Defaults to theme.up. */
    readonly upColor?: string;
    /** Low line and the fill between close and low. Defaults to theme.down. */
    readonly downColor?: string;
    /** Close line color. Defaults to theme.neutral. */
    readonly closeColor?: string;
    /** Fill opacity. Default 0.2. */
    readonly fillOpacity?: number;
    /** Close line width. Default 2. */
    readonly lineWidth?: number;
}

/** HLC area: a high–low band split by the close line into an upper and a lower fill. */
export function HLCAreaSeries<T = any>({
    high = "high" as Accessor<T>,
    low = "low" as Accessor<T>,
    close = "close" as Accessor<T>,
    upColor,
    downColor,
    closeColor,
    fillOpacity = 0.2,
    lineWidth = 2,
    ...rest
}: HLCAreaSeriesProps<T>) {
    const h = accessor(high);
    const l = accessor(low);
    const c = accessor(close);
    useSeries<T>({
        ...rest,
        values: (d, i) => [h(d, i), l(d, i), c(d, i)],
        color: (_d, _i, theme) => closeColor ?? theme.neutral,
        legendValues: (d, i, { format, color }) =>
            ohlcLegend([h(d, i), l(d, i), c(d, i)], format, color, ["H", "L", "C"]),
        draw(ctx, { data, start, end, x, y, theme }) {
            const up = upColor ?? theme.up;
            const down = downColor ?? theme.down;
            const hi = linePoints(data, start, end, x, y, h);
            const lo = linePoints(data, start, end, x, y, l);
            const cl = linePoints(data, start, end, x, y, c);
            const bands = [
                [hi, up],
                [lo, down],
            ] as const;
            for (const [edge, color] of bands) {
                const band = new Path2D();
                traceArea(band, edge, cl);
                ctx.fillStyle = withAlpha(color, fillOpacity);
                ctx.fill(band);
                applyStroke(ctx, { color: withAlpha(color, 0.8), width: 1 });
                ctx.beginPath();
                tracePath(ctx, edge);
                ctx.stroke();
            }
            applyStroke(ctx, { color: closeColor ?? theme.neutral, width: lineWidth });
            ctx.lineJoin = "round";
            ctx.beginPath();
            tracePath(ctx, cl);
            ctx.stroke();
        },
    });
    return null;
}
