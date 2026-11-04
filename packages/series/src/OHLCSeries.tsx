import { accessor, functor, type Accessor, type Functor, type Theme } from "@reincharts/core";
import type { OHLCAccessors } from "./CandlestickSeries";
import { barWidth, PathBatch } from "./geometry";
import { ohlcLegend } from "./ohlc";
import { useSeries, type SeriesProps } from "./useSeries";
import { drawOhlcColumns, ohlcExtent } from "./aggregate";

export interface OHLCSeriesProps<T = any> extends SeriesProps, OHLCAccessors<T> {
    /** Color of rising bars. Defaults to theme.up. */
    readonly upColor?: string;
    /** Color of falling bars. Defaults to theme.down. */
    readonly downColor?: string;
    /** Per-bar color (overrides up/down). */
    readonly color?: Functor<T, string>;
    /** Line thickness in pixels; "auto" grows with zoom (1–3px). Default "auto". */
    readonly thickness?: number | "auto";
    /** Total tick width as a fraction of bar spacing. Default 0.8. */
    readonly widthRatio?: number;
    /** Draw HLC bars (no open tick). Default false. */
    readonly hlc?: boolean;
}

/** OHLC bars: a vertical high–low line with an open tick on the left and a close tick on the right (or HLC bars). */
export function OHLCSeries<T = any>({
    open = "open" as Accessor<T>,
    high = "high" as Accessor<T>,
    low = "low" as Accessor<T>,
    close = "close" as Accessor<T>,
    upColor,
    downColor,
    color,
    thickness = "auto",
    widthRatio = 0.8,
    hlc = false,
    ...rest
}: OHLCSeriesProps<T>) {
    const o = accessor(open);
    const h = accessor(high);
    const l = accessor(low);
    const c = accessor(close);
    const colorAt = color === undefined ? undefined : functor(color);
    const colorOf = (d: T, i: number, theme: Theme) =>
        colorAt?.(d, i) ?? (c(d, i) >= o(d, i) ? (upColor ?? theme.up) : (downColor ?? theme.down));

    useSeries<T>({
        ...rest,
        values: (d, i) => [o(d, i), h(d, i), l(d, i), c(d, i)],
        base: (d, i) => c(d, i),
        color: colorOf,
        legendValues: (d, i, { format, color: legendColor }) =>
            hlc
                ? ohlcLegend([h(d, i), l(d, i), c(d, i)], format, legendColor, ["H", "L", "C"])
                : ohlcLegend([o(d, i), h(d, i), l(d, i), c(d, i)], format, legendColor),
        extentOf: (start, end, data) => ohlcExtent(data, start, end, l, h),
        draw(ctx, scope) {
            const { data, start, end, x, y, barSpacing, theme } = scope;
            if (barSpacing < 1) {
                drawOhlcColumns(ctx, scope, o, h, l, c, (_up, d, i) => colorOf(d, i, theme));
                return;
            }
            const t =
                thickness === "auto"
                    ? barSpacing > 24
                        ? 3
                        : barSpacing > 10
                          ? 2
                          : 1
                    : Math.max(1, Math.round(thickness));
            const tick = Math.max(0, Math.round((barWidth(barSpacing, widthRatio) - t) / 2));
            const batch = new PathBatch();
            for (let i = start; i <= end; i++) {
                const d = data[i];
                const cc = c(d, i);
                if (!Number.isFinite(cc)) {
                    continue;
                }
                const p = batch.get(colorOf(d, i, theme));
                const left = Math.round(x(i) - t / 2);
                const top = Math.round(y(h(d, i)));
                const bottom = Math.round(y(l(d, i)));
                p.rect(left, top, t, Math.max(1, bottom - top));
                if (tick > 0) {
                    const yc = Math.round(y(cc) - t / 2);
                    p.rect(left + t, yc, tick, t);
                    if (!hlc) {
                        const yo = Math.round(y(o(d, i)) - t / 2);
                        p.rect(left - tick, yo, tick, t);
                    }
                }
            }
            batch.fill(ctx);
        },
    });
    return null;
}
