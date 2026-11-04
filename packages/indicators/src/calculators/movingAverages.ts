import type { Accessor } from "@reincharts/core";
import {
    emaK,
    hmaK,
    maK,
    out,
    period,
    read,
    rmaK,
    smaK,
    tmaK,
    vwmaK,
    wmaK,
    type MovingAverageType,
    type SourceOptions,
    type Values,
} from "./core";

export interface MovingAverageOptions<T = any> extends SourceOptions<T> {
    /** Number of bars. Default 9. */
    readonly period?: number;
}

/** Simple moving average. First value at index `period - 1`. */
export const sma = <T>(data: readonly T[], o: MovingAverageOptions<T> = {}): Values =>
    out(smaK(read(data, o.source), period(o.period, 9)));

/** Exponential moving average (alpha = 2 / (period + 1)), seeded with the SMA of the first `period` values. */
export const ema = <T>(data: readonly T[], o: MovingAverageOptions<T> = {}): Values =>
    out(emaK(read(data, o.source), period(o.period, 9)));

/** Linearly weighted moving average (weights 1..period, newest heaviest). */
export const wma = <T>(data: readonly T[], o: MovingAverageOptions<T> = {}): Values =>
    out(wmaK(read(data, o.source), period(o.period, 9)));

/** Triangular moving average (double smoothed SMA, weights 1, 2, ..., 2, 1). First value at `period - 1`. */
export const tma = <T>(data: readonly T[], o: MovingAverageOptions<T> = {}): Values =>
    out(tmaK(read(data, o.source), period(o.period, 9)));

/** Wilder's moving average (RMA / SMMA, alpha = 1 / period) as used by RSI and ATR. */
export const rma = <T>(data: readonly T[], o: MovingAverageOptions<T> = {}): Values =>
    out(rmaK(read(data, o.source), period(o.period, 9)));

/** Hull moving average: WMA(2·WMA(n/2) − WMA(n), √n). First value at `period + floor(√period) - 2`. */
export const hma = <T>(data: readonly T[], o: MovingAverageOptions<T> = {}): Values =>
    out(hmaK(read(data, o.source), period(o.period, 9)));

export interface VWMAOptions<T = any> extends MovingAverageOptions<T> {
    /** Volume accessor. Default `"volume"`. */
    readonly volume?: Accessor<T, number | undefined>;
}

/** Volume weighted moving average: Σ(price·volume) / Σ(volume) over `period` bars (default 20). */
export const vwma = <T>(data: readonly T[], o: VWMAOptions<T> = {}): Values =>
    out(vwmaK(read(data, o.source), read(data, o.volume, "volume"), period(o.period, 20)));

export interface AnyMovingAverageOptions<T = any> extends MovingAverageOptions<T> {
    /** Moving average type. Default `"sma"`. */
    readonly type?: MovingAverageType;
}

/** Any moving average by type (`"sma" | "ema" | "wma" | "rma" | "hma" | "tma"`). */
export const movingAverage = <T>(data: readonly T[], o: AnyMovingAverageOptions<T> = {}): Values =>
    out(maK(o.type, read(data, o.source), period(o.period, 9)));
