import {
    maK,
    nan,
    out,
    period,
    read,
    readOHLCV,
    type MovingAverageType,
    type OHLCVOptions,
    type SourceOptions,
    type Values,
} from "./core";

export interface ElderRayOptions<T = any> extends SourceOptions<T>, OHLCVOptions<T> {
    /** MA length. Default 13. */
    readonly period?: number;
    /** MA type. Default `"ema"` (Elder's original). */
    readonly maType?: MovingAverageType;
}

export interface ElderRayResult {
    /** high − MA. */
    readonly bullPower: Values;
    /** low − MA. */
    readonly bearPower: Values;
}

/** Elder-ray bull and bear power ("Bull Bear Power" is their sum). */
export const elderRay = <T>(data: readonly T[], o: ElderRayOptions<T> = {}): ElderRayResult => {
    const f = readOHLCV(data, o);
    const ma = maK(o.maType ?? "ema", read(data, o.source), period(o.period, 13));
    const high = f.high();
    const low = f.low();
    return { bullPower: out(ma.map((m, i) => high[i] - m)), bearPower: out(ma.map((m, i) => low[i] - m)) };
};

export interface ElderImpulseOptions<T = any> extends SourceOptions<T> {
    /** EMA length. Default 13. */
    readonly period?: number;
    /** MACD fast length. Default 12. */
    readonly fast?: number;
    /** MACD slow length. Default 26. */
    readonly slow?: number;
    /** MACD signal length. Default 9. */
    readonly signal?: number;
}

/**
 * Elder impulse system: 1 (green) when both the EMA and the MACD histogram rise, −1 (red) when both fall,
 * 0 (neutral / blue) otherwise; undefined until both are available.
 */
export const elderImpulse = <T>(data: readonly T[], o: ElderImpulseOptions<T> = {}): Values => {
    const x = read(data, o.source);
    const e = maK("ema", x, period(o.period, 13));
    const fast = maK("ema", x, period(o.fast, 12));
    const slow = maK("ema", x, period(o.slow, 26));
    const line = fast.map((v, i) => v - slow[i]);
    const signal = maK("ema", line, period(o.signal, 9));
    const hist = line.map((m, i) => m - signal[i]);
    const r = nan(x.length);
    for (let i = 1; i < r.length; i++) {
        const de = e[i] - e[i - 1];
        const dh = hist[i] - hist[i - 1];
        if (de === de && dh === dh) {
            r[i] = de >= 0 && dh >= 0 ? 1 : de <= 0 && dh <= 0 ? -1 : 0;
        }
    }
    return out(r);
};

export interface ChangeResult {
    /** src − src[1]. */
    readonly absolute: Values;
    /** 100 × (src − src[1]) / src[1]. */
    readonly percent: Values;
}

/** Bar-to-bar change, absolute and in percent. First value at index 1. */
export const change = <T>(data: readonly T[], o: SourceOptions<T> = {}): ChangeResult => {
    const x = read(data, o.source);
    const abs = nan(x.length);
    const pct = nan(x.length);
    for (let i = 1; i < x.length; i++) {
        abs[i] = x[i] - x[i - 1];
        pct[i] = x[i - 1] === 0 ? NaN : (100 * abs[i]) / x[i - 1];
    }
    return { absolute: out(abs), percent: out(pct) };
};

export interface CompareOptions<T = any> extends SourceOptions<T> {
    /** Index from which the base value is searched (e.g. the first visible bar). Default 0. */
    readonly baseIndex?: number;
}

/**
 * Percent change of a series relative to its first defined value at or after `baseIndex`
 * (e.g. `compare(data, { source: (d) => d.AAPL })`), used to compare symbols. Values before the base are undefined.
 * Values are in percent (12.5 = +12.5%).
 */
export const compare = <T>(data: readonly T[], o: CompareOptions<T> = {}): Values => {
    const x = read(data, o.source);
    const r = nan(x.length);
    let base = NaN;
    for (let i = Math.max(0, Math.floor(o.baseIndex ?? 0)); i < x.length; i++) {
        if (base !== base && x[i] === x[i] && x[i] !== 0) {
            base = x[i];
        }
        r[i] = (100 * (x[i] - base)) / base;
    }
    return out(r);
};
