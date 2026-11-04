import { accessor, functor, type Accessor, type Functor, type Theme } from "@reincharts/core";
import { barLeft, barWidth, PathBatch } from "./geometry";
import { ohlcLegend } from "./ohlc";
import { drawOhlcColumns, ohlcExtent } from "./aggregate";
import { useSeries, type SeriesProps } from "./useSeries";

export interface OHLCAccessors<T> {
    /** Open accessor. Default "open". */
    /** Open price accessor (field name or function). Default `"open"`. */
    readonly open?: Accessor<T>;
    /** High accessor. Default "high". */
    /** High price accessor (field name or function). Default `"high"`. */
    readonly high?: Accessor<T>;
    /** Low accessor. Default "low". */
    /** Low price accessor (field name or function). Default `"low"`. */
    readonly low?: Accessor<T>;
    /** Close accessor. Default "close". */
    /** Close price accessor (field name or function). Default `"close"`. */
    readonly close?: Accessor<T>;
}

export interface CandlestickSeriesProps<T = any> extends SeriesProps, OHLCAccessors<T> {
    /** Body color for rising candles. Defaults to theme.up. */
    readonly upColor?: string;
    /** Body color for falling candles. Defaults to theme.down. */
    readonly downColor?: string;
    /** Per-candle body color (overrides up/down). Also renders Heikin Ashi data unchanged. */
    readonly fill?: Functor<T, string>;
    /** Wick color (defaults to the body color). */
    readonly wickColor?: Functor<T, string>;
    /** Border color (defaults to the body color). */
    readonly borderColor?: Functor<T, string>;
    /** Draw rising candles hollow ("hollow candles"). */
    readonly hollow?: boolean;
    /** Body width as a fraction of bar spacing. Default 0.8. */
    readonly widthRatio?: number;
    /** Per-candle body width multiplier in 0..1 (e.g. volume-weighted candles). Default 1. */
    readonly widthFactor?: (d: T, index: number) => number;
}

/** Candlesticks (also hollow candles and Heikin Ashi data). Batches all candles per color. */
export function CandlestickSeries<T = any>({
    open = "open" as Accessor<T>,
    high = "high" as Accessor<T>,
    low = "low" as Accessor<T>,
    close = "close" as Accessor<T>,
    upColor,
    downColor,
    fill,
    wickColor,
    borderColor,
    hollow = false,
    widthRatio = 0.8,
    widthFactor,
    ...rest
}: CandlestickSeriesProps<T>) {
    const o = accessor(open);
    const h = accessor(high);
    const l = accessor(low);
    const c = accessor(close);
    const fillAt = fill === undefined ? undefined : functor(fill);
    const wickAt = wickColor === undefined ? undefined : functor(wickColor);
    const borderAt = borderColor === undefined ? undefined : functor(borderColor);
    const colorOf = (d: T, i: number, theme: Theme) =>
        fillAt?.(d, i) ?? (c(d, i) >= o(d, i) ? (upColor ?? theme.up) : (downColor ?? theme.down));

    useSeries<T>({
        ...rest,
        values: (d, i) => [o(d, i), h(d, i), l(d, i), c(d, i)],
        base: (d, i) => c(d, i),
        color: colorOf,
        legendValues: (d, i, { format, color }) => ohlcLegend([o(d, i), h(d, i), l(d, i), c(d, i)], format, color),
        // fast autoscale: min low / max high without allocating per bar
        extentOf: (start, end, data) => ohlcExtent(data, start, end, l, h),
        draw(ctx, scope) {
            const { data, start, end, x, y, barSpacing, theme } = scope;
            const full = barWidth(barSpacing, widthRatio);
            const wicks = new PathBatch();
            if (barSpacing < 1 && !widthFactor) {
                drawOhlcColumns(
                    ctx,
                    scope,
                    o,
                    h,
                    l,
                    c,
                    (up, d, i) =>
                        wickAt?.(d, i) ?? fillAt?.(d, i) ?? (up ? (upColor ?? theme.up) : (downColor ?? theme.down)),
                );
                return;
            }
            const bodies = new PathBatch();
            const borders = new PathBatch();
            for (let i = start; i <= end; i++) {
                const d = data[i];
                const oo = o(d, i);
                const cc = c(d, i);
                const hh = h(d, i);
                const ll = l(d, i);
                if (!Number.isFinite(cc) || !Number.isFinite(oo)) {
                    continue;
                }
                const body = colorOf(d, i, theme);
                const cx = Math.round(x(i));
                const yh = Math.round(y(Number.isFinite(hh) ? hh : Math.max(oo, cc)));
                const yl = Math.round(y(Number.isFinite(ll) ? ll : Math.min(oo, cc)));
                const top = Math.round(y(Math.max(oo, cc)));
                const bottom = Math.round(y(Math.min(oo, cc)));
                const w = widthFactor
                    ? Math.max(1, Math.round(full * Math.min(1, Math.max(0, widthFactor(d, i)))))
                    : full;
                const isHollow = hollow && cc >= oo;
                const wick = wickAt?.(d, i) ?? body;
                if (w <= 2) {
                    wicks
                        .get(wick)
                        .rect(cx, Math.min(yh, top), 1, Math.max(1, Math.max(yl, bottom) - Math.min(yh, top)));
                    continue;
                }
                const left = barLeft(cx + 0.5, w);
                const height = Math.max(1, bottom - top);
                // wick above and below the body (not through a hollow body)
                if (top > yh) {
                    wicks.get(wick).rect(cx, yh, 1, top - yh);
                }
                if (yl > bottom) {
                    wicks.get(wick).rect(cx, bottom, 1, yl - bottom);
                }
                const border = borderAt?.(d, i) ?? (isHollow ? body : undefined);
                if (!isHollow) {
                    bodies.get(body).rect(left, top, w, height);
                }
                if (border) {
                    borders.get(border).rect(left + 0.5, top + 0.5, w - 1, Math.max(0, height - 1));
                }
            }
            wicks.fill(ctx);
            bodies.fill(ctx);
            borders.stroke(ctx, 1);
        },
    });
    return null;
}
