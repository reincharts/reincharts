import { alignTime, nextBarTime, type AlignOptions, type Resolution } from "./resolution";
import type { Bar, ChartBar, Tick } from "./types";

/** Adds `date` so the bar can be passed straight to `<ChartCanvas data>`. Returns the bar itself when already done. */
export function toChartBar<T extends Bar>(bar: T): T & ChartBar {
    const d = (bar as Partial<ChartBar>).date;
    return d instanceof Date && d.getTime() === bar.time ? (bar as T & ChartBar) : { ...bar, date: new Date(bar.time) };
}

/** Sorts by time and removes duplicates (the last occurrence wins). Returns the input when already clean. */
export function sortBars<T extends Bar>(bars: readonly T[]): T[] {
    let clean = true;
    for (let i = 1; i < bars.length; i++) {
        if (!(bars[i].time > bars[i - 1].time)) {
            clean = false;
            break;
        }
    }
    if (clean) {
        return bars as T[];
    }
    const sorted = bars.map((bar, i) => [bar, i] as const).sort((a, b) => a[0].time - b[0].time || a[1] - b[1]);
    const out: T[] = [];
    for (const [bar] of sorted) {
        if (out.length > 0 && out[out.length - 1].time === bar.time) {
            out[out.length - 1] = bar;
        } else {
            out.push(bar);
        }
    }
    return out;
}

/**
 * Realtime merge (pure): replaces the last bar when `bar.time` equals it, appends when newer,
 * and ignores older bars (returns `data` unchanged).
 */
export function mergeBar<T extends Bar>(data: readonly T[], bar: T): T[] {
    const n = data.length;
    const last = n > 0 ? data[n - 1] : undefined;
    if (!last || bar.time > last.time) {
        const out = data.slice();
        out.push(bar);
        return out;
    }
    if (bar.time === last.time) {
        const out = data.slice();
        out[n - 1] = bar;
        return out;
    }
    return data as T[];
}

/**
 * Merges two sorted series (e.g. an older history page into loaded data). On equal times `newer` wins.
 * Existing objects are reused, so React / chart identity checks stay cheap.
 */
export function mergeBars<T extends Bar>(older: readonly T[], newer: readonly T[]): T[] {
    if (older.length === 0) {
        return newer as T[];
    }
    if (newer.length === 0) {
        return older as T[];
    }
    if (older[older.length - 1].time < newer[0].time) {
        return older.concat(newer);
    }
    const out: T[] = [];
    let i = 0;
    let j = 0;
    while (i < older.length || j < newer.length) {
        const a = older[i];
        const b = newer[j];
        if (b === undefined || (a !== undefined && a.time < b.time)) {
            out.push(a);
            i++;
        } else {
            if (a !== undefined && a.time === b.time) {
                i++;
            }
            out.push(b);
            j++;
        }
    }
    return out;
}

const fold = (into: Bar, bar: Bar) => {
    into.high = Math.max(into.high, bar.high);
    into.low = Math.min(into.low, bar.low);
    into.close = bar.close;
    if (bar.volume !== undefined) {
        into.volume = (into.volume ?? 0) + bar.volume;
    }
};

/**
 * Builds higher timeframe bars (e.g. 1-minute → 1h, daily → weekly / monthly) from sorted bars.
 * Weeks start on Monday and months on the 1st, in `options.timeZone` (default UTC).
 * The last bar may be partial (still forming).
 */
export function aggregateBars(bars: readonly Bar[], resolution: Resolution, options: AlignOptions = {}): Bar[] {
    const out: Bar[] = [];
    let current: Bar | undefined;
    let currentEnd = -Infinity;
    for (const bar of bars) {
        // fast path: consecutive bars of the same bucket skip the (possibly time zone aware) alignment
        if (current && bar.time >= current.time && bar.time < currentEnd) {
            fold(current, bar);
            continue;
        }
        const time = alignTime(bar.time, resolution, options);
        if (current && current.time === time) {
            fold(current, bar);
            continue;
        }
        current = { time, open: bar.open, high: bar.high, low: bar.low, close: bar.close };
        if (bar.volume !== undefined) {
            current.volume = bar.volume;
        }
        currentEnd = nextBarTime(time, resolution, options);
        out.push(current);
    }
    return out;
}

/** Updates (or starts) the bar for `tick`. `bar` is returned untouched when the tick is older. */
export function tickToBar(bar: Bar | undefined, tick: Tick, resolution: Resolution, options: AlignOptions = {}): Bar {
    const time = alignTime(tick.time, resolution, options);
    if (bar && bar.time === time) {
        return {
            time,
            open: bar.open,
            high: Math.max(bar.high, tick.price),
            low: Math.min(bar.low, tick.price),
            close: tick.price,
            volume: tick.volume === undefined ? bar.volume : (bar.volume ?? 0) + tick.volume,
        };
    }
    if (bar && bar.time > time) {
        return bar;
    }
    const next: Bar = { time, open: tick.price, high: tick.price, low: tick.price, close: tick.price };
    if (tick.volume !== undefined) {
        next.volume = tick.volume;
    }
    return next;
}

/**
 * Builds bars from trades (seconds or minute bars from ticks).
 * Ticks must be sorted by time; out-of-order ticks older than the current bar are ignored.
 */
export function ticksToBars(ticks: readonly Tick[], resolution: Resolution, options: AlignOptions = {}): Bar[] {
    const out: Bar[] = [];
    for (const tick of ticks) {
        const last = out[out.length - 1];
        const bar = tickToBar(last, tick, resolution, options);
        if (bar === last) {
            continue;
        }
        if (last && bar.time === last.time) {
            out[out.length - 1] = bar;
        } else {
            out.push(bar);
        }
    }
    return out;
}

/** Realtime tick merge (pure): folds `tick` into the last bar or appends a new bar. */
export function applyTick(data: readonly Bar[], tick: Tick, resolution: Resolution, options: AlignOptions = {}): Bar[] {
    const last = data[data.length - 1];
    const bar = tickToBar(last, tick, resolution, options);
    return bar === last ? (data as Bar[]) : mergeBar(data, bar);
}

/** Options of `alignSeries`. */
export interface AlignSeriesOptions {
    /** "none" (default): `undefined` where `other` has no bar at that time. "previous": carry the last known bar forward. */
    readonly fill?: "none" | "previous";
}

/**
 * Aligns a second series (compare symbol) to `base` by time: each base item gets `[key]` set to
 * the `other` bar with the same time. Plot it with e.g. `<LineSeries y={(d) => d.AAPL?.close} />`
 * on a percent-mode price scale to compare symbols.
 */
export function alignSeries<T extends { time: number }, O extends { time: number }, K extends string>(
    base: readonly T[],
    other: readonly O[],
    key: K,
    options: AlignSeriesOptions = {},
): Array<T & { [P in K]: O | undefined }> {
    const carry = options.fill === "previous";
    const out = new Array<T & { [P in K]: O | undefined }>(base.length);
    let j = 0;
    let previous: O | undefined;
    for (let i = 0; i < base.length; i++) {
        const t = base[i].time;
        while (j < other.length && other[j].time < t) {
            previous = other[j++];
        }
        let match: O | undefined;
        if (j < other.length && other[j].time === t) {
            match = other[j];
        } else if (carry) {
            match = previous;
        }
        out[i] = { ...base[i], [key]: match } as T & { [P in K]: O | undefined };
    }
    return out;
}
