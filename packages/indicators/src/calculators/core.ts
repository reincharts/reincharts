import { accessor, type Accessor } from "@reincharts/core";

/** Values aligned 1:1 with the input data; `undefined` during warm-up or where inputs are missing. */
export type Values = (number | undefined)[];

/** Built-in price sources. `hl2` = (H+L)/2, `hlc3` = (H+L+C)/3, `ohlc4`, `hlcc4` = (H+L+2C)/4. */
export type PriceSource = "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4" | "volume";

/** Every built-in price source, e.g. for a "source" select in a settings dialog. */
export const priceSources: readonly PriceSource[] = [
    "open",
    "high",
    "low",
    "close",
    "hl2",
    "hlc3",
    "ohlc4",
    "hlcc4",
    "volume",
];

/** What a calculator reads: a built-in price source, a field name or a function of the datum. */
export type Source<T = any> = PriceSource | Accessor<T, number | undefined>;

export interface SourceOptions<T = any> {
    /** Value the indicator is computed on: a price source (`"close"`, `"hl2"`...), a field name or a function. */
    readonly source?: Source<T>;
}

/** Field accessors for calculators that read several bar fields (ATR, Stochastic, VWAP...). */
export interface OHLCVOptions<T = any> {
    /** Open accessor. Default `"open"`. */
    readonly open?: Accessor<T, number | undefined>;
    /** High accessor. Default `"high"`. */
    readonly high?: Accessor<T, number | undefined>;
    /** Low accessor. Default `"low"`. */
    readonly low?: Accessor<T, number | undefined>;
    /** Close accessor. Default `"close"`. */
    readonly close?: Accessor<T, number | undefined>;
    /** Volume accessor. Default `"volume"`. */
    readonly volume?: Accessor<T, number | undefined>;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);

const derived: Record<string, (d: any) => number> = {
    hl2: (d) => (d.high + d.low) / 2,
    hlc3: (d) => (d.high + d.low + d.close) / 3,
    ohlc4: (d) => (d.open + d.high + d.low + d.close) / 4,
    hlcc4: (d) => (d.high + d.low + 2 * d.close) / 4,
};

/** Reads a source into a Float64Array (NaN where missing). */
export function read<T>(
    data: readonly T[],
    source: Source<T> | undefined,
    fallback: Source<T> = "close",
): Float64Array {
    const s = source ?? fallback;
    const n = data.length;
    const out = new Float64Array(n);
    const fn = typeof s === "string" && derived[s] ? derived[s] : accessor(s as Accessor<T, number | undefined>);
    for (let i = 0; i < n; i++) {
        const d = data[i];
        out[i] = d == null ? NaN : num(fn(d as any, i));
    }
    return out;
}

/** Reads the OHLCV fields that a calculator needs. */
export const readOHLCV = <T>(data: readonly T[], o: OHLCVOptions<T>) => ({
    open: () => read(data, o.open, "open"),
    high: () => read(data, o.high, "high"),
    low: () => read(data, o.low, "low"),
    close: () => read(data, o.close, "close"),
    volume: () => read(data, o.volume, "volume"),
});

/** Float64Array (NaN = missing) to a plain array with `undefined` for missing values. */
export const out = (a: ArrayLike<number>): Values => {
    const n = a.length;
    const r: Values = new Array(n);
    for (let i = 0; i < n; i++) {
        const v = a[i];
        r[i] = v === v && v !== Infinity && v !== -Infinity ? v : undefined;
    }
    return r;
};

/** Normalizes a period option to an integer >= 1. */
export const period = (p: number | undefined, fallback: number) => {
    const v = Math.floor(p ?? fallback);
    return v >= 1 ? v : 1;
};

export const nan = (n: number) => new Float64Array(n).fill(NaN);

// ------------------------------------------------------------------ kernels (Float64Array in / out, NaN = missing)

/** Simple moving average with a sliding sum. Windows containing a missing value are NaN. */
export function smaK(x: ArrayLike<number>, n: number): Float64Array {
    const len = x.length;
    const r = nan(len);
    let sum = 0;
    let bad = 0;
    for (let i = 0; i < len; i++) {
        const v = x[i];
        if (v === v) {
            sum += v;
        } else {
            bad++;
        }
        if (i >= n) {
            const o = x[i - n];
            if (o === o) {
                sum -= o;
            } else {
                bad--;
            }
        }
        if (i >= n - 1 && bad === 0) {
            r[i] = sum / n;
        }
    }
    return r;
}

/** Sliding sum over n values. */
export function sumK(x: ArrayLike<number>, n: number): Float64Array {
    const r = smaK(x, n);
    for (let i = 0; i < r.length; i++) {
        r[i] *= n;
    }
    return r;
}

/**
 * Exponential smoothing seeded with the SMA of the first `n` values (classic / TA-Lib behavior).
 * Leading missing values are skipped; interior missing values output NaN and keep the state.
 */
export function emaK(x: ArrayLike<number>, n: number, alpha = 2 / (n + 1)): Float64Array {
    const len = x.length;
    const r = nan(len);
    let prev = NaN;
    let seed = 0;
    let count = 0;
    for (let i = 0; i < len; i++) {
        const v = x[i];
        if (v !== v) {
            if (prev !== prev) {
                seed = 0;
                count = 0;
            }
            continue;
        }
        if (prev !== prev) {
            seed += v;
            if (++count === n) {
                prev = seed / n;
                r[i] = prev;
            }
            continue;
        }
        prev = alpha * v + (1 - alpha) * prev;
        r[i] = prev;
    }
    return r;
}

/** Wilder's smoothing (RMA / SMMA): EMA with alpha = 1 / n. */
export const rmaK = (x: ArrayLike<number>, n: number) => emaK(x, n, 1 / n);

/** Linearly weighted moving average (weights 1..n, newest heaviest) in O(length). */
export function wmaK(x: ArrayLike<number>, n: number): Float64Array {
    const len = x.length;
    const r = nan(len);
    const denom = (n * (n + 1)) / 2;
    let s = 0;
    let w = 0;
    let lastBad = -Infinity;
    for (let i = 0; i < len; i++) {
        let v = x[i];
        if (v !== v) {
            v = 0;
            lastBad = i;
        }
        w += n * v - s;
        s += v;
        if (i >= n) {
            const o = x[i - n];
            if (o === o) {
                s -= o;
            }
        }
        if (i >= n - 1 && i - lastBad >= n) {
            r[i] = w / denom;
        }
    }
    return r;
}

/** Triangular moving average = SMA of an SMA (weights 1, 2, ..., 2, 1). */
export function tmaK(x: ArrayLike<number>, n: number): Float64Array {
    const a = n % 2 === 0 ? n / 2 : (n + 1) / 2;
    const b = n % 2 === 0 ? n / 2 + 1 : (n + 1) / 2;
    return smaK(smaK(x, a), b);
}

/** Hull moving average: WMA(2 WMA(n/2) - WMA(n), sqrt(n)). */
export function hmaK(x: ArrayLike<number>, n: number): Float64Array {
    const half = wmaK(x, Math.max(1, Math.floor(n / 2)));
    const full = wmaK(x, n);
    const diff = new Float64Array(x.length);
    for (let i = 0; i < diff.length; i++) {
        diff[i] = 2 * half[i] - full[i];
    }
    return wmaK(diff, Math.max(1, Math.floor(Math.sqrt(n))));
}

/** Volume weighted moving average. */
export function vwmaK(x: ArrayLike<number>, volume: ArrayLike<number>, n: number): Float64Array {
    const pv = new Float64Array(x.length);
    for (let i = 0; i < pv.length; i++) {
        pv[i] = x[i] * volume[i];
    }
    const a = sumK(pv, n);
    const b = sumK(volume, n);
    for (let i = 0; i < a.length; i++) {
        a[i] = b[i] === 0 ? NaN : a[i] / b[i];
    }
    return a;
}

/** Moving average types accepted by the `maType` option of calculators. */
export type MovingAverageType = "sma" | "ema" | "wma" | "rma" | "hma" | "tma";

/** Every moving average type, e.g. for a "select" input. */
export const movingAverageTypes: readonly MovingAverageType[] = ["sma", "ema", "wma", "rma", "hma", "tma"];

export function maK(type: MovingAverageType | undefined, x: ArrayLike<number>, n: number): Float64Array {
    switch (type) {
        case "ema":
            return emaK(x, n);
        case "wma":
            return wmaK(x, n);
        case "rma":
            return rmaK(x, n);
        case "hma":
            return hmaK(x, n);
        case "tma":
            return tmaK(x, n);
        default:
            return smaK(x, n);
    }
}

/**
 * Rolling highest (or lowest) value over n bars with a monotonic deque, O(length).
 * Missing values are ignored. Ties resolve to the most recent bar. Returns values and their indices.
 */
export function extremeK(x: ArrayLike<number>, n: number, highest: boolean): [Float64Array, Int32Array] {
    const len = x.length;
    const values = nan(len);
    const indices = new Int32Array(len).fill(-1);
    const dq = new Int32Array(len);
    let head = 0;
    let tail = 0;
    for (let i = 0; i < len; i++) {
        const v = x[i];
        if (v === v) {
            while (tail > head && (highest ? x[dq[tail - 1]] <= v : x[dq[tail - 1]] >= v)) {
                tail--;
            }
            dq[tail++] = i;
        }
        while (tail > head && dq[head] <= i - n) {
            head++;
        }
        if (i >= n - 1 && tail > head) {
            values[i] = x[dq[head]];
            indices[i] = dq[head];
        }
    }
    return [values, indices];
}

export const highestK = (x: ArrayLike<number>, n: number) => extremeK(x, n, true)[0];
export const lowestK = (x: ArrayLike<number>, n: number) => extremeK(x, n, false)[0];

/** Rolling population standard deviation (values shifted by the first value to avoid cancellation). */
export function stdevK(x: ArrayLike<number>, n: number): Float64Array {
    const len = x.length;
    const r = nan(len);
    let k = NaN;
    for (let i = 0; i < len && k !== k; i++) {
        k = x[i];
    }
    let s = 0;
    let s2 = 0;
    let bad = 0;
    for (let i = 0; i < len; i++) {
        const v = x[i] - k;
        if (v === v) {
            s += v;
            s2 += v * v;
        } else {
            bad++;
        }
        if (i >= n) {
            const o = x[i - n] - k;
            if (o === o) {
                s -= o;
                s2 -= o * o;
            } else {
                bad--;
            }
        }
        if (i >= n - 1 && bad === 0) {
            r[i] = Math.sqrt(Math.max(0, (s2 - (s * s) / n) / n));
        }
    }
    return r;
}

/** True range. The first bar (no previous close) is high - low. */
export function trueRangeK(high: ArrayLike<number>, low: ArrayLike<number>, close: ArrayLike<number>, firstBar = true) {
    const len = high.length;
    const r = nan(len);
    for (let i = 0; i < len; i++) {
        const hl = high[i] - low[i];
        if (i === 0) {
            r[i] = firstBar ? hl : NaN;
            continue;
        }
        const pc = close[i - 1];
        r[i] = pc === pc ? Math.max(hl, Math.abs(high[i] - pc), Math.abs(low[i] - pc)) : hl;
    }
    return r;
}

/** x[i] - x[i - k]. */
export function changeK(x: ArrayLike<number>, k = 1): Float64Array {
    const r = nan(x.length);
    for (let i = k; i < x.length; i++) {
        r[i] = x[i] - x[i - k];
    }
    return r;
}

/** Default bar time: `d.date ?? d.time` (Date or epoch ms). */
export const defaultTime = (d: any): any => d?.date ?? d?.time;
