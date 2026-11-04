import {
    highestK,
    lowestK,
    maK,
    out,
    period,
    read,
    readOHLCV,
    rmaK,
    stdevK,
    trueRangeK,
    type MovingAverageType,
    type OHLCVOptions,
    type SourceOptions,
    type Values,
} from "./core";

/** Upper / middle / lower band values. */
export interface Bands {
    readonly upper: Values;
    readonly middle: Values;
    readonly lower: Values;
}

const bands = (mid: Float64Array, offset: (i: number) => number): Bands => {
    const upper = new Float64Array(mid.length);
    const lower = new Float64Array(mid.length);
    for (let i = 0; i < mid.length; i++) {
        const d = offset(i);
        upper[i] = mid[i] + d;
        lower[i] = mid[i] - d;
    }
    return { upper: out(upper), middle: out(mid), lower: out(lower) };
};

/** True range per bar: max(H − L, |H − prevC|, |L − prevC|). The first bar is H − L. */
export const trueRange = <T>(data: readonly T[], o: OHLCVOptions<T> = {}): Values => {
    const f = readOHLCV(data, o);
    return out(trueRangeK(f.high(), f.low(), f.close()));
};

export interface ATROptions<T = any> extends OHLCVOptions<T> {
    /** Number of bars. Default 14. */
    readonly period?: number;
    /** Smoothing of the true range. Default `"rma"` (Wilder). */
    readonly maType?: MovingAverageType;
}

/** Average true range (Wilder). First value at index `period - 1`. */
export const atr = <T>(data: readonly T[], o: ATROptions<T> = {}): Values => out(atrK(data, o));

export const atrK = <T>(data: readonly T[], o: ATROptions<T> = {}) => {
    const f = readOHLCV(data, o);
    const n = period(o.period, 14);
    const tr = trueRangeK(f.high(), f.low(), f.close());
    return o.maType && o.maType !== "rma" ? maK(o.maType, tr, n) : rmaK(tr, n);
};

export interface StdDevOptions<T = any> extends SourceOptions<T> {
    /** Number of bars. Default 20. */
    readonly period?: number;
}

/** Rolling population standard deviation. */
export const stddev = <T>(data: readonly T[], o: StdDevOptions<T> = {}): Values =>
    out(stdevK(read(data, o.source), period(o.period, 20)));

export interface BollingerOptions<T = any> extends SourceOptions<T> {
    /** Number of bars. Default 20. */
    readonly period?: number;
    /** Standard deviations from the basis. Default 2. */
    readonly multiplier?: number;
    /** Basis moving average. Default `"sma"`. */
    readonly maType?: MovingAverageType;
}

/** Bollinger Bands: basis MA ± multiplier × population standard deviation. */
export const bollinger = <T>(data: readonly T[], o: BollingerOptions<T> = {}): Bands => {
    const x = read(data, o.source);
    const n = period(o.period, 20);
    const m = o.multiplier ?? 2;
    const sd = stdevK(x, n);
    return bands(maK(o.maType, x, n), (i) => m * sd[i]);
};

export interface KeltnerOptions<T = any> extends SourceOptions<T>, OHLCVOptions<T> {
    /** Basis length. Default 20. */
    readonly period?: number;
    /** Band multiplier. Default 2. */
    readonly multiplier?: number;
    /** Basis moving average. Default `"ema"`. */
    readonly maType?: MovingAverageType;
    /** Band width: average true range (default), raw true range, or RMA of high − low over `period`. */
    readonly bandsStyle?: "atr" | "tr" | "range";
    /** ATR length when `bandsStyle` is "atr". Default 10. */
    readonly atrPeriod?: number;
}

/** Keltner Channels: MA ± multiplier × ATR (defaults: EMA 20, ×2, ATR 10). */
export const keltner = <T>(data: readonly T[], o: KeltnerOptions<T> = {}): Bands => {
    const n = period(o.period, 20);
    const m = o.multiplier ?? 2;
    const f = readOHLCV(data, o);
    const high = f.high();
    const low = f.low();
    let range: Float64Array;
    if (o.bandsStyle === "tr") {
        range = trueRangeK(high, low, f.close());
    } else if (o.bandsStyle === "range") {
        range = rmaK(
            high.map((h, i) => h - low[i]),
            n,
        );
    } else {
        range = rmaK(trueRangeK(high, low, f.close()), period(o.atrPeriod, 10));
    }
    return bands(maK(o.maType ?? "ema", read(data, o.source), n), (i) => m * range[i]);
};

export interface DonchianOptions<T = any> extends OHLCVOptions<T> {
    /** Number of bars. Default 20. */
    readonly period?: number;
}

/** Donchian Channels: highest high, lowest low and their average over `period` bars. */
export const donchian = <T>(data: readonly T[], o: DonchianOptions<T> = {}): Bands => {
    const n = period(o.period, 20);
    const f = readOHLCV(data, o);
    const hh = highestK(f.high(), n);
    const ll = lowestK(f.low(), n);
    const mid = hh.map((h, i) => (h + ll[i]) / 2);
    return { upper: out(hh), middle: out(mid), lower: out(ll) };
};

export interface EnvelopeOptions<T = any> extends SourceOptions<T> {
    /** Number of bars. Default 20. */
    readonly period?: number;
    /** Band distance in percent of the basis. Default 10. */
    readonly percent?: number;
    /** Basis moving average. Default `"sma"`. */
    readonly maType?: MovingAverageType;
}

/** Moving average envelope: basis × (1 ± percent / 100). */
export const envelope = <T>(data: readonly T[], o: EnvelopeOptions<T> = {}): Bands => {
    const mid = maK(o.maType, read(data, o.source), period(o.period, 20));
    const k = (o.percent ?? 10) / 100;
    return bands(mid, (i) => mid[i] * k);
};
