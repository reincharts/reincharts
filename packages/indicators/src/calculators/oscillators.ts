import {
    changeK,
    extremeK,
    highestK,
    lowestK,
    maK,
    nan,
    out,
    period,
    read,
    readOHLCV,
    rmaK,
    smaK,
    sumK,
    type MovingAverageType,
    type OHLCVOptions,
    type SourceOptions,
    type Values,
} from "./core";

export interface RSIOptions<T = any> extends SourceOptions<T> {
    /** Number of bars. Default 14. */
    readonly period?: number;
}

/** Relative Strength Index (Wilder smoothing). First value at index `period`. */
export const rsi = <T>(data: readonly T[], o: RSIOptions<T> = {}): Values => {
    const n = period(o.period, 14);
    const ch = changeK(read(data, o.source));
    const up = rmaK(
        ch.map((c) => (c === c ? Math.max(c, 0) : NaN)),
        n,
    );
    const down = rmaK(
        ch.map((c) => (c === c ? -Math.min(c, 0) : NaN)),
        n,
    );
    const r = nan(ch.length);
    for (let i = 0; i < r.length; i++) {
        const u = up[i];
        const d = down[i];
        if (u === u && d === d) {
            r[i] = d === 0 ? 100 : u === 0 ? 0 : 100 - 100 / (1 + u / d);
        }
    }
    return out(r);
};

export interface MACDOptions<T = any> extends SourceOptions<T> {
    /** Fast MA length. Default 12. */
    readonly fast?: number;
    /** Slow MA length. Default 26. */
    readonly slow?: number;
    /** Signal MA length. Default 9. */
    readonly signal?: number;
    /** MA type of the fast / slow lines. Default `"ema"`. */
    readonly maType?: MovingAverageType;
    /** MA type of the signal line. Default `"ema"`. */
    readonly signalMaType?: MovingAverageType;
}

export interface MACDResult {
    /** fast MA − slow MA. First value at `slow - 1`. */
    readonly macd: Values;
    /** MA of `macd`. First value at `slow + signal - 2`. */
    readonly signal: Values;
    /** macd − signal. */
    readonly histogram: Values;
}

/** Moving Average Convergence Divergence. */
export const macd = <T>(data: readonly T[], o: MACDOptions<T> = {}): MACDResult => {
    const x = read(data, o.source);
    const type = o.maType ?? "ema";
    const fast = maK(type, x, period(o.fast, 12));
    const slow = maK(type, x, period(o.slow, 26));
    const line = fast.map((f, i) => f - slow[i]);
    const signal = maK(o.signalMaType ?? "ema", line, period(o.signal, 9));
    const hist = line.map((m, i) => m - signal[i]);
    return { macd: out(line), signal: out(signal), histogram: out(hist) };
};

export interface StochasticOptions<T = any> extends OHLCVOptions<T> {
    /** %K lookback. Default 14. */
    readonly period?: number;
    /** SMA smoothing of %K (1 = fast stochastic, 3 = slow). Default 1. */
    readonly kSmoothing?: number;
    /** SMA length of %D. Default 3. */
    readonly dSmoothing?: number;
}

export interface StochasticResult {
    /** %K in [0, 100]. First value at `period + kSmoothing - 2`. */
    readonly k: Values;
    /** %D = SMA(%K, dSmoothing). */
    readonly d: Values;
}

/**
 * Full stochastic oscillator: %K = 100·(C − LL)/(HH − LL) smoothed by `kSmoothing`, %D = SMA(%K).
 * A flat window (HH = LL) gives 50.
 */
export const stochastic = <T>(data: readonly T[], o: StochasticOptions<T> = {}): StochasticResult => {
    const f = readOHLCV(data, o);
    const n = period(o.period, 14);
    const hh = highestK(f.high(), n);
    const ll = lowestK(f.low(), n);
    const close = f.close();
    const raw = close.map((c, i) => {
        const range = hh[i] - ll[i];
        return range === 0 ? 50 : (100 * (c - ll[i])) / range;
    });
    const k = smaK(raw, period(o.kSmoothing, 1));
    return { k: out(k), d: out(smaK(k, period(o.dSmoothing, 3))) };
};

/** Fast stochastic (%K unsmoothed). */
export const fastStochastic = <T>(data: readonly T[], o: Omit<StochasticOptions<T>, "kSmoothing"> = {}) =>
    stochastic(data, { ...o, kSmoothing: 1 });

/** Slow stochastic (%K smoothed by 3). */
export const slowStochastic = <T>(data: readonly T[], o: Omit<StochasticOptions<T>, "kSmoothing"> = {}) =>
    stochastic(data, { ...o, kSmoothing: 3 });

export interface CCIOptions<T = any> extends SourceOptions<T> {
    /** Number of bars. Default 20. */
    readonly period?: number;
}

/** Commodity Channel Index: (src − SMA) / (0.015 × mean deviation). Default source `hlc3`. */
export const cci = <T>(data: readonly T[], o: CCIOptions<T> = {}): Values => {
    const x = read(data, o.source, "hlc3");
    const n = period(o.period, 20);
    const ma = smaK(x, n);
    const r = nan(x.length);
    for (let i = n - 1; i < x.length; i++) {
        const m = ma[i];
        if (m !== m) {
            continue;
        }
        let dev = 0;
        for (let j = i - n + 1; j <= i; j++) {
            dev += Math.abs(x[j] - m);
        }
        dev /= n;
        r[i] = dev === 0 ? 0 : (x[i] - m) / (0.015 * dev);
    }
    return out(r);
};

export interface LookbackOptions<T = any> extends OHLCVOptions<T> {
    /** Number of bars. Default 14. */
    readonly period?: number;
}

/** Williams %R in [−100, 0]: 100·(C − HH)/(HH − LL). A flat window gives −50. */
export const williamsR = <T>(data: readonly T[], o: LookbackOptions<T> = {}): Values => {
    const f = readOHLCV(data, o);
    const n = period(o.period, 14);
    const hh = highestK(f.high(), n);
    const ll = lowestK(f.low(), n);
    const close = f.close();
    return out(close.map((c, i) => (hh[i] === ll[i] ? -50 : (100 * (c - hh[i])) / (hh[i] - ll[i]))));
};

export interface ChangeOverOptions<T = any> extends SourceOptions<T> {
    /** Number of bars back. Default 9 for ROC, 10 for momentum. */
    readonly period?: number;
}

/** Rate of change in percent: 100·(src − src[n]) / src[n]. */
export const roc = <T>(data: readonly T[], o: ChangeOverOptions<T> = {}): Values => {
    const x = read(data, o.source);
    const n = period(o.period, 9);
    const r = nan(x.length);
    for (let i = n; i < x.length; i++) {
        r[i] = x[i - n] === 0 ? NaN : (100 * (x[i] - x[i - n])) / x[i - n];
    }
    return out(r);
};

/** Momentum: src − src[n]. */
export const momentum = <T>(data: readonly T[], o: ChangeOverOptions<T> = {}): Values =>
    out(changeK(read(data, o.source), period(o.period, 10)));

export interface MFIOptions<T = any> extends SourceOptions<T>, OHLCVOptions<T> {
    /** Number of bars. Default 14. */
    readonly period?: number;
}

/**
 * Money Flow Index (volume weighted RSI) on `hlc3` by default. Money flow starts at the second bar,
 * so the first value is at index `period`.
 */
export const mfi = <T>(data: readonly T[], o: MFIOptions<T> = {}): Values => {
    const x = read(data, o.source, "hlc3");
    const vol = read(data, o.volume, "volume");
    const n = period(o.period, 14);
    const len = x.length;
    const pos = nan(len);
    const neg = nan(len);
    for (let i = 1; i < len; i++) {
        const ch = x[i] - x[i - 1];
        const flow = x[i] * vol[i];
        pos[i] = ch > 0 ? flow : ch === ch ? 0 : NaN;
        neg[i] = ch < 0 ? flow : ch === ch ? 0 : NaN;
    }
    const up = sumK(pos, n);
    const down = sumK(neg, n);
    return out(up.map((u, i) => (down[i] === 0 ? (u === 0 ? 50 : 100) : 100 - 100 / (1 + u / down[i]))));
};

export interface AroonResult {
    /** 100·(period − bars since the highest high) / period. */
    readonly up: Values;
    /** 100·(period − bars since the lowest low) / period. */
    readonly down: Values;
    /** up − down. */
    readonly oscillator: Values;
}

/** Aroon up / down over `period + 1` bars (default period 14). First value at index `period`. */
export const aroon = <T>(data: readonly T[], o: LookbackOptions<T> = {}): AroonResult => {
    const f = readOHLCV(data, o);
    const n = period(o.period, 14);
    const [, hi] = extremeK(f.high(), n + 1, true);
    const [, lo] = extremeK(f.low(), n + 1, false);
    const len = hi.length;
    const up = nan(len);
    const down = nan(len);
    for (let i = n; i < len; i++) {
        if (hi[i] >= 0) {
            up[i] = (100 * (n - (i - hi[i]))) / n;
        }
        if (lo[i] >= 0) {
            down[i] = (100 * (n - (i - lo[i]))) / n;
        }
    }
    return { up: out(up), down: out(down), oscillator: out(up.map((u, i) => u - down[i])) };
};
