import { isFiniteNumber } from "./math";

export interface TimeParts {
    year: number;
    month: number; // 0-11
    day: number;
    weekday: number; // 0 = Sunday
    hour: number;
    minute: number;
    second: number;
}

export interface TimeTick {
    /** Data index the tick sits on. */
    index: number;
    /** Pixel x within the plot. */
    x: number;
    label: string;
    /** Higher = more significant boundary (year > month > day > hour ...). */
    weight: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export interface TimeFormatterOptions {
    /** IANA time zone such as "America/New_York". Defaults to the user's local zone; "UTC" is supported. */
    timeZone?: string;
    /** Override tick labels per level. */
    tickFormatter?: (time: number, level: "year" | "month" | "day" | "time" | "seconds") => string;
    /** Override the crosshair / tooltip time label. */
    crosshairFormatter?: (time: number) => string;
}

/** Time zone aware date utilities with a per-instance cache. */
export class TimeFormatter {
    private readonly cache = new Map<number, TimeParts>();
    private readonly intl?: Intl.DateTimeFormat;

    public constructor(private readonly options: TimeFormatterOptions = {}) {
        const tz = options.timeZone;
        if (tz && tz !== "UTC") {
            this.intl = new Intl.DateTimeFormat("en-US", {
                timeZone: tz,
                hourCycle: "h23",
                year: "numeric",
                month: "numeric",
                day: "numeric",
                weekday: "short",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
            });
        }
    }

    public parts(time: number): TimeParts {
        let p = this.cache.get(time);
        if (p) {
            return p;
        }
        const d = new Date(time);
        if (this.options.timeZone === "UTC") {
            p = {
                year: d.getUTCFullYear(),
                month: d.getUTCMonth(),
                day: d.getUTCDate(),
                weekday: d.getUTCDay(),
                hour: d.getUTCHours(),
                minute: d.getUTCMinutes(),
                second: d.getUTCSeconds(),
            };
        } else if (this.intl) {
            const r: Record<string, string> = {};
            for (const { type, value } of this.intl.formatToParts(d)) {
                r[type] = value;
            }
            p = {
                year: +r.year,
                month: +r.month - 1,
                day: +r.day,
                weekday: DAYS.indexOf(r.weekday),
                hour: +r.hour,
                minute: +r.minute,
                second: +r.second,
            };
        } else {
            p = {
                year: d.getFullYear(),
                month: d.getMonth(),
                day: d.getDate(),
                weekday: d.getDay(),
                hour: d.getHours(),
                minute: d.getMinutes(),
                second: d.getSeconds(),
            };
        }
        if (this.cache.size > 50_000) {
            this.cache.clear();
        }
        this.cache.set(time, p);
        return p;
    }

    /** Significance of the boundary between two consecutive bars. */
    public weight(time: number, prev: number | undefined) {
        const a = this.parts(time);
        if (prev === undefined) {
            return 100;
        }
        const b = this.parts(prev);
        if (a.year !== b.year) {
            return 100;
        }
        if (a.month !== b.month) {
            return 90;
        }
        if (a.day !== b.day) {
            return 70;
        }
        if (a.hour !== b.hour) {
            return 50 + (a.hour % 12 === 0 ? 6 : a.hour % 6 === 0 ? 4 : a.hour % 3 === 0 ? 2 : 0);
        }
        if (a.minute !== b.minute) {
            return 30 + (a.minute % 30 === 0 ? 6 : a.minute % 15 === 0 ? 4 : a.minute % 5 === 0 ? 2 : 0);
        }
        return 10 + (a.second % 30 === 0 ? 6 : a.second % 15 === 0 ? 4 : a.second % 5 === 0 ? 2 : 0);
    }

    public tickLabel(time: number, weight: number) {
        const level =
            weight >= 100 ? "year" : weight >= 90 ? "month" : weight >= 70 ? "day" : weight >= 30 ? "time" : "seconds";
        if (this.options.tickFormatter) {
            return this.options.tickFormatter(time, level);
        }
        const p = this.parts(time);
        switch (level) {
            case "year":
                return `${p.year}`;
            case "month":
                return MONTHS[p.month];
            case "day":
                return `${p.day}`;
            case "time":
                return `${pad(p.hour)}:${pad(p.minute)}`;
            default:
                return `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
        }
    }

    /** Full label used by the crosshair, e.g. "Tue 12 Mar '24 14:05". */
    public format(time: number, intraday: boolean) {
        if (this.options.crosshairFormatter) {
            return this.options.crosshairFormatter(time);
        }
        const p = this.parts(time);
        const date = `${DAYS[p.weekday]} ${p.day} ${MONTHS[p.month]} '${pad(p.year % 100)}`;
        if (!intraday) {
            return date;
        }
        const seconds = p.second !== 0 ? `:${pad(p.second)}` : "";
        return `${date}  ${pad(p.hour)}:${pad(p.minute)}${seconds}`;
    }
}

/**
 * Picks time axis ticks among visible bars: most significant boundaries first,
 * skipping any that would sit closer than `minSpacing` pixels to an accepted tick.
 */
export const computeTimeTicks = (
    times: ArrayLike<number>,
    start: number,
    end: number,
    x: (index: number) => number,
    formatter: TimeFormatter,
    minSpacing: number,
): TimeTick[] => {
    if (end < start) {
        return [];
    }
    const candidates: { index: number; weight: number; x: number }[] = [];
    // at most ~one candidate per pixel: with many bars per pixel, sample bars and compare each sample with the
    // previous one (a boundary between them is still detected). Aligned to absolute indices so labels don't
    // jitter while panning.
    const stride = Math.max(1, Math.floor((end - start + 1) / Math.max(1, Math.abs(x(end) - x(start)))));
    for (let i = Math.ceil(start / stride) * stride; i <= end; i += stride) {
        const t = times[i];
        if (!isFiniteNumber(t)) {
            continue;
        }
        const prev = i - stride >= 0 ? times[i - stride] : undefined;
        candidates.push({ index: i, weight: formatter.weight(t, prev), x: x(i) });
    }
    candidates.sort((a, b) => b.weight - a.weight || a.index - b.index);
    const accepted: number[] = []; // sorted xs
    const ticks: TimeTick[] = [];
    for (const c of candidates) {
        let lo = 0;
        let hi = accepted.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (accepted[mid] < c.x) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        const near =
            (lo > 0 && c.x - accepted[lo - 1] < minSpacing) ||
            (lo < accepted.length && accepted[lo] - c.x < minSpacing);
        if (!near) {
            accepted.splice(lo, 0, c.x);
            ticks.push({
                index: c.index,
                x: c.x,
                weight: c.weight,
                label: formatter.tickLabel(times[c.index], c.weight),
            });
        }
    }
    return ticks.sort((a, b) => a.x - b.x);
};
