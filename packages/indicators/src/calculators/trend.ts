import {
    changeK,
    highestK,
    lowestK,
    nan,
    out,
    period,
    read,
    readOHLCV,
    rmaK,
    trueRangeK,
    type OHLCVOptions,
    type SourceOptions,
    type Values,
} from "./core";

export interface SAROptions<T = any> extends OHLCVOptions<T> {
    /** Initial acceleration factor. Default 0.02. */
    readonly start?: number;
    /** Acceleration increment on each new extreme. Default 0.02. */
    readonly increment?: number;
    /** Maximum acceleration factor. Default 0.2. */
    readonly max?: number;
}

/** Parabolic SAR (Wilder), with the standard start / increment / max parameters. First value at index 1. */
export const sar = <T>(data: readonly T[], o: SAROptions<T> = {}): Values => {
    const f = readOHLCV(data, o);
    const h = f.high();
    const l = f.low();
    const c = f.close();
    const start = o.start ?? 0.02;
    const inc = o.increment ?? 0.02;
    const max = o.max ?? 0.2;
    const r = nan(h.length);
    let result = NaN;
    let extreme = NaN;
    let acc = start;
    let below = false;
    for (let i = 1; i < h.length; i++) {
        let first = false;
        if (i === 1) {
            below = c[1] > c[0];
            extreme = below ? h[1] : l[1];
            result = below ? l[0] : h[0];
            first = true;
            acc = start;
        }
        result += acc * (extreme - result);
        if (below ? result > l[i] : result < h[i]) {
            first = true;
            below = !below;
            result = below ? Math.min(l[i], extreme) : Math.max(h[i], extreme);
            extreme = below ? h[i] : l[i];
            acc = start;
        }
        if (!first && (below ? h[i] > extreme : l[i] < extreme)) {
            extreme = below ? h[i] : l[i];
            acc = Math.min(acc + inc, max);
        }
        if (below) {
            result = Math.min(result, l[i - 1], i > 1 ? l[i - 2] : Infinity);
        } else {
            result = Math.max(result, h[i - 1], i > 1 ? h[i - 2] : -Infinity);
        }
        r[i] = result;
    }
    return out(r);
};

export interface SupertrendOptions<T = any> extends SourceOptions<T>, OHLCVOptions<T> {
    /** ATR length. Default 10. */
    readonly period?: number;
    /** ATR multiplier. Default 3. */
    readonly factor?: number;
}

export interface SupertrendResult {
    /** The supertrend line (lower band in uptrends, upper band in downtrends). */
    readonly supertrend: Values;
    /** 1 = uptrend, −1 = downtrend. */
    readonly direction: Values;
    /** `supertrend` only where the trend is up (gaps elsewhere) — for green plotting. */
    readonly up: Values;
    /** `supertrend` only where the trend is down — for red plotting. */
    readonly down: Values;
}

/** Supertrend: hl2 ± factor × ATR with trailing bands. */
export const supertrend = <T>(data: readonly T[], o: SupertrendOptions<T> = {}): SupertrendResult => {
    const f = readOHLCV(data, o);
    const close = f.close();
    const src = read(data, o.source, "hl2");
    const atr = rmaK(trueRangeK(f.high(), f.low(), close), period(o.period, 10));
    const factor = o.factor ?? 3;
    const n = close.length;
    const st = nan(n);
    const dir = nan(n);
    let prevUpper = NaN;
    let prevLower = NaN;
    let prevSt = NaN;
    for (let i = 0; i < n; i++) {
        let upper = src[i] + factor * atr[i];
        let lower = src[i] - factor * atr[i];
        const pl = prevLower === prevLower ? prevLower : 0;
        const pu = prevUpper === prevUpper ? prevUpper : 0;
        const pc = i > 0 ? close[i - 1] : NaN;
        lower = lower > pl || pc < pl ? lower : pl;
        upper = upper < pu || pc > pu ? upper : pu;
        let d: number;
        if (i === 0 || atr[i - 1] !== atr[i - 1]) {
            d = -1;
        } else if (prevSt === pu) {
            d = close[i] > upper ? 1 : -1;
        } else {
            d = close[i] < lower ? -1 : 1;
        }
        const value = d === 1 ? lower : upper;
        if (atr[i] === atr[i]) {
            st[i] = value;
            dir[i] = d;
        }
        prevSt = value;
        prevUpper = upper;
        prevLower = lower;
    }
    const supertrend = out(st);
    const direction = out(dir);
    return {
        supertrend,
        direction,
        up: supertrend.map((v, i) => (direction[i] === 1 ? v : undefined)),
        down: supertrend.map((v, i) => (direction[i] === -1 ? v : undefined)),
    };
};

export interface DMIOptions<T = any> extends OHLCVOptions<T> {
    /** DI length. Default 14. */
    readonly period?: number;
    /** ADX smoothing. Default 14. */
    readonly adxSmoothing?: number;
}

export interface DMIResult {
    /** +DI. First value at index `period`. */
    readonly plusDI: Values;
    /** −DI. */
    readonly minusDI: Values;
    /** ADX. First value at index `period + adxSmoothing - 1`. */
    readonly adx: Values;
}

/** Directional Movement Index (+DI, −DI) and ADX (Wilder smoothing). */
export const dmi = <T>(data: readonly T[], o: DMIOptions<T> = {}): DMIResult => {
    const f = readOHLCV(data, o);
    const high = f.high();
    const low = f.low();
    const n = period(o.period, 14);
    const upMove = changeK(high);
    const downMove = changeK(low).map((v) => -v);
    const plusDM = upMove.map((u, i) => (u !== u ? NaN : u > downMove[i] && u > 0 ? u : 0));
    const minusDM = downMove.map((d, i) => (d !== d ? NaN : d > upMove[i] && d > 0 ? d : 0));
    const tr = rmaK(trueRangeK(high, low, f.close(), false), n);
    const plus = rmaK(plusDM, n).map((v, i) => (100 * v) / tr[i]);
    const minus = rmaK(minusDM, n).map((v, i) => (100 * v) / tr[i]);
    const dx = plus.map((p, i) => {
        const sum = p + minus[i];
        return Math.abs(p - minus[i]) / (sum === 0 ? 1 : sum);
    });
    const adx = rmaK(dx, period(o.adxSmoothing, 14)).map((v) => v * 100);
    return { plusDI: out(plus), minusDI: out(minus), adx: out(adx) };
};

/** ADX only (see `dmi`). */
export const adx = <T>(data: readonly T[], o: DMIOptions<T> = {}): Values => dmi(data, o).adx;

export interface IchimokuOptions<T = any> extends OHLCVOptions<T> {
    /** Tenkan-sen (conversion line) length. Default 9. */
    readonly conversion?: number;
    /** Kijun-sen (base line) length. Default 26. */
    readonly base?: number;
    /** Senkou span B length. Default 52. */
    readonly spanB?: number;
    /** Displacement used for plotting. Default 26. Not applied to the returned arrays (see `IchimokuResult`). */
    readonly displacement?: number;
}

/**
 * Ichimoku values computed at each bar, NOT shifted. To plot the cloud, draw `spanA` / `spanB`
 * `displacement - 1` bars to the right (`plotOffset`) and `lagging` `displacement - 1` bars to the left.
 */
export interface IchimokuResult {
    /** Tenkan-sen: mid of the highest high / lowest low over `conversion` bars. */
    readonly conversion: Values;
    /** Kijun-sen: mid over `base` bars. */
    readonly base: Values;
    /** Senkou span A: (conversion + base) / 2 (plotted ahead). */
    readonly spanA: Values;
    /** Senkou span B: mid over `spanB` bars (plotted ahead). */
    readonly spanB: Values;
    /** Chikou span: the close (plotted behind). */
    readonly lagging: Values;
    /** displacement − 1: how far spans are plotted ahead and the lagging span behind. */
    readonly plotOffset: number;
}

const donchianMid = (high: Float64Array, low: Float64Array, n: number) => {
    const hh = highestK(high, n);
    const ll = lowestK(low, n);
    return hh.map((h, i) => (h + ll[i]) / 2);
};

/** Ichimoku Kinko Hyo (defaults 9 / 26 / 52 / 26). */
export const ichimoku = <T>(data: readonly T[], o: IchimokuOptions<T> = {}): IchimokuResult => {
    const f = readOHLCV(data, o);
    const high = f.high();
    const low = f.low();
    const conv = donchianMid(high, low, period(o.conversion, 9));
    const base = donchianMid(high, low, period(o.base, 26));
    return {
        conversion: out(conv),
        base: out(base),
        spanA: out(conv.map((c, i) => (c + base[i]) / 2)),
        spanB: out(donchianMid(high, low, period(o.spanB, 52))),
        lagging: out(f.close()),
        plotOffset: period(o.displacement, 26) - 1,
    };
};
