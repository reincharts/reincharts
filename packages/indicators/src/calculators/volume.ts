import { accessor, type Accessor } from "@reincharts/core";
import {
    changeK,
    emaK,
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

/** When a VWAP period starts: every day ("session"), week (Monday), month, year, never, or a custom predicate. */
export type VWAPAnchor =
    "session" | "week" | "month" | "year" | "none" | ((d: any, index: number, prev: any) => boolean);

export interface VWAPOptions<T = any> extends SourceOptions<T>, OHLCVOptions<T> {
    /** Reset period. Default `"session"` (calendar day). */
    readonly anchor?: VWAPAnchor;
    /** Bar time accessor (Date or epoch ms). Default `d.date ?? d.time`. */
    readonly time?: Accessor<T, Date | number | undefined>;
    /** IANA time zone used to find day / week / month boundaries. Default "UTC". */
    readonly timeZone?: string;
    /** Standard deviation multiplier of the bands. Default 1. */
    readonly bandMultiplier?: number;
}

export interface VWAPResult {
    readonly vwap: Values;
    /** vwap + bandMultiplier × volume weighted standard deviation. */
    readonly upper: Values;
    /** vwap − bandMultiplier × volume weighted standard deviation. */
    readonly lower: Values;
}

const DAY = 86_400_000;
const partsCache = new Map<string, Intl.DateTimeFormat>();

/** [year, month (1-12), day] of an epoch-ms time in a time zone. */
const ymd = (t: number, timeZone: string): [number, number, number] => {
    if (timeZone === "UTC") {
        const d = new Date(t);
        return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
    }
    let f = partsCache.get(timeZone);
    if (!f) {
        f = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" });
        partsCache.set(timeZone, f);
    }
    const p = f.formatToParts(t);
    const get = (type: string) => Number(p.find((x) => x.type === type)?.value);
    return [get("year"), get("month"), get("day")];
};

const periodKey = (t: number, anchor: string, timeZone: string) => {
    if (!Number.isFinite(t)) {
        return NaN;
    }
    const [y, m, d] = ymd(t, timeZone);
    switch (anchor) {
        case "year":
            return y;
        case "month":
            return y * 12 + m;
        case "week":
            // days since epoch of the local date; 1970-01-01 was a Thursday -> +3 makes Monday the first day
            return Math.floor((Date.UTC(y, m - 1, d) / DAY + 3) / 7);
        default:
            return y * 10_000 + m * 100 + d;
    }
};

const timeOf = (d: any): number => {
    const v = d?.date ?? d?.time;
    return v instanceof Date ? v.getTime() : typeof v === "number" ? v : NaN;
};

/** Anchored volume weighted average price with standard deviation bands. Default source `hlc3`. */
export const vwap = <T>(data: readonly T[], o: VWAPOptions<T> = {}): VWAPResult => {
    const x = read(data, o.source, "hlc3");
    const vol = read(data, o.volume, "volume");
    const anchor = o.anchor ?? "session";
    const tz = o.timeZone ?? "UTC";
    const timeFn: (d: T, i: number) => unknown = o.time === undefined ? timeOf : accessor(o.time);
    const mult = o.bandMultiplier ?? 1;
    const n = x.length;
    const v = nan(n);
    const up = nan(n);
    const lo = nan(n);
    let key = NaN;
    let sv = 0;
    let spv = 0;
    let sp2v = 0;
    let p0 = NaN;
    for (let i = 0; i < n; i++) {
        let reset = i === 0;
        if (typeof anchor === "function") {
            reset ||= anchor(data[i], i, data[i - 1]);
        } else if (anchor !== "none") {
            const t = timeFn(data[i], i);
            const k = periodKey(t instanceof Date ? t.getTime() : typeof t === "number" ? t : NaN, anchor, tz);
            if (k === k) {
                reset ||= k !== key;
                key = k;
            }
        }
        if (reset) {
            sv = spv = sp2v = 0;
            p0 = NaN;
        }
        const p = x[i];
        const w = vol[i];
        if (p === p && w === w) {
            if (p0 !== p0) {
                p0 = p;
            }
            const dp = p - p0;
            sv += w;
            spv += w * dp;
            sp2v += w * dp * dp;
        }
        if (sv > 0) {
            const mean = spv / sv;
            const sd = Math.sqrt(Math.max(0, sp2v / sv - mean * mean));
            v[i] = p0 + mean;
            up[i] = v[i] + mult * sd;
            lo[i] = v[i] - mult * sd;
        }
    }
    return { vwap: out(v), upper: out(up), lower: out(lo) };
};

/** On-balance volume: cumulative volume signed by the direction of the source. Starts at 0. */
export const obv = <T>(data: readonly T[], o: SourceOptions<T> & OHLCVOptions<T> = {}): Values => {
    const x = read(data, o.source);
    const vol = read(data, o.volume, "volume");
    const r = nan(x.length);
    let total = 0;
    for (let i = 0; i < x.length; i++) {
        if (i > 0) {
            const ch = x[i] - x[i - 1];
            const w = vol[i];
            if (ch === ch && w === w) {
                total += ch > 0 ? w : ch < 0 ? -w : 0;
            }
        }
        r[i] = total;
    }
    return out(r);
};

export interface VolumeOptions<T = any> extends OHLCVOptions<T> {
    /** Volume MA length. Default 20. */
    readonly period?: number;
    /** Volume MA type. Default `"sma"`. */
    readonly maType?: MovingAverageType;
}

export interface VolumeResult {
    readonly volume: Values;
    /** Moving average of volume. */
    readonly ma: Values;
    /** 1 when close >= open, −1 otherwise (bar coloring). */
    readonly direction: Values;
}

/** Volume, its moving average and the bar direction used to color volume bars. */
export const volume = <T>(data: readonly T[], o: VolumeOptions<T> = {}): VolumeResult => {
    const f = readOHLCV(data, o);
    const vol = f.volume();
    const open = f.open();
    const close = f.close();
    return {
        volume: out(vol),
        ma: out(maK(o.maType, vol, period(o.period, 20))),
        direction: out(close.map((c, i) => (c !== c || open[i] !== open[i] ? NaN : c >= open[i] ? 1 : -1))),
    };
};

/** Raw force index: (src − src[1]) × volume. First value at index 1. */
export const forceIndex = <T>(data: readonly T[], o: SourceOptions<T> & OHLCVOptions<T> = {}): Values =>
    out(forceK(data, o));

const forceK = <T>(data: readonly T[], o: SourceOptions<T> & OHLCVOptions<T>) => {
    const vol = read(data, o.volume, "volume");
    return changeK(read(data, o.source)).map((c, i) => c * vol[i]);
};

export interface SmoothedForceIndexOptions<T = any> extends SourceOptions<T>, OHLCVOptions<T> {
    /** Smoothing length. Default 13. */
    readonly period?: number;
    /** Smoothing type. Default `"ema"`. */
    readonly maType?: MovingAverageType;
}

/** Elder's force index smoothed by a moving average ("Elder Force Index"). */
export const smoothedForceIndex = <T>(data: readonly T[], o: SmoothedForceIndexOptions<T> = {}) => {
    const force = forceK(data, o);
    const n = period(o.period, 13);
    return { force: out(force), smoothed: out(o.maType ? maK(o.maType, force, n) : emaK(force, n)) };
};
