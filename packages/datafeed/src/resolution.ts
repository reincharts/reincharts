/**
 * Bar interval in the common charting notation: "1S"/"5S" seconds, "1"/"5"/"15"/"60"/"240" minutes,
 * "1D" days, "1W" weeks, "1M" months. Friendly aliases are accepted too: "1s", "1m", "1h", "4h", "1d", "1w", "1y".
 */
export type Resolution =
    | "1S"
    | "5S"
    | "15S"
    | "30S"
    | "1"
    | "3"
    | "5"
    | "15"
    | "30"
    | "45"
    | "60"
    | "120"
    | "180"
    | "240"
    | "1D"
    | "1W"
    | "1M"
    | "3M"
    | "6M"
    | "12M"
    | (string & {});

export type ResolutionUnit = "second" | "minute" | "day" | "week" | "month";

/** A parsed resolution: `count` × `unit` (hours are expressed as minutes, years as months). */
export interface ParsedResolution {
    /** Base unit. */
    readonly unit: ResolutionUnit;
    /** Number of units per bar (≥ 1). */
    readonly count: number;
}

/** Common resolutions, in increasing order (handy for interval pickers). */
export const RESOLUTIONS: readonly Resolution[] = [
    "1S",
    "5S",
    "15S",
    "30S",
    "1",
    "3",
    "5",
    "15",
    "30",
    "60",
    "120",
    "240",
    "1D",
    "1W",
    "1M",
];

/** One second in milliseconds. */
export const SECOND = 1000;
/** One minute in milliseconds. */
export const MINUTE = 60 * SECOND;
/** One hour in milliseconds. */
export const HOUR = 60 * MINUTE;
/** One day in milliseconds. */
export const DAY = 24 * HOUR;
/** One week in milliseconds. */
export const WEEK = 7 * DAY;

const UNIT_MS: Record<ResolutionUnit, number> = {
    second: SECOND,
    minute: MINUTE,
    day: DAY,
    week: WEEK,
    month: 30 * DAY,
};

const cache = new Map<string, ParsedResolution>();

/**
 * Parses a resolution string. Throws on invalid input.
 * Case matters only for "m" (minute) vs "M" (month), like most exchanges.
 */
export function parseResolution(resolution: Resolution): ParsedResolution {
    const cached = cache.get(resolution);
    if (cached) {
        return cached;
    }
    const match = /^\s*(\d*)\s*([a-zA-Z]*)\s*$/.exec(resolution);
    const count = match && match[1] !== "" ? Number(match[1]) : 1;
    const suffix = match?.[2] ?? "";
    let parsed: ParsedResolution | undefined;
    if (match && count >= 1 && Number.isSafeInteger(count) && (match[1] !== "" || suffix !== "")) {
        switch (suffix) {
            case "":
            case "m":
            case "min":
                parsed = { unit: "minute", count };
                break;
            case "S":
            case "s":
                parsed = { unit: "second", count };
                break;
            case "H":
            case "h":
                parsed = { unit: "minute", count: count * 60 };
                break;
            case "D":
            case "d":
                parsed = { unit: "day", count };
                break;
            case "W":
            case "w":
                parsed = { unit: "week", count };
                break;
            case "M":
                parsed = { unit: "month", count };
                break;
            case "Y":
            case "y":
                parsed = { unit: "month", count: count * 12 };
                break;
        }
    }
    if (!parsed) {
        throw new Error(`Invalid resolution "${resolution}"`);
    }
    cache.set(resolution, parsed);
    return parsed;
}

/** Returns true when the string is a valid resolution. */
export function isResolution(value: string): value is Resolution {
    try {
        parseResolution(value);
        return true;
    } catch {
        return false;
    }
}

/** Nominal bar duration in milliseconds (months count as 30 days). */
export function resolutionToMs(resolution: Resolution): number {
    const { unit, count } = parseResolution(resolution);
    return UNIT_MS[unit] * count;
}

/** Canonical resolution string: "1h" → "60", "1d" → "1D", "1y" → "12M", "1s" → "1S". */
export function normalizeResolution(resolution: Resolution): Resolution {
    const { unit, count } = parseResolution(resolution);
    switch (unit) {
        case "second":
            return `${count}S`;
        case "minute":
            return `${count}`;
        case "day":
            return `${count}D`;
        case "week":
            return `${count}W`;
        default:
            return `${count}M`;
    }
}

const LONG: Record<string, string> = {
    s: "second",
    m: "minute",
    h: "hour",
    D: "day",
    W: "week",
    M: "month",
    Y: "year",
};

/**
 * Human label: "1s", "5m", "1h", "4h", "1D", "1W", "1M", "1Y" (`style: "short"`, default)
 * or "5 minutes", "1 hour" (`style: "long"`).
 */
export function formatResolution(resolution: Resolution, style: "short" | "long" = "short"): string {
    const { unit, count } = parseResolution(resolution);
    let n = count;
    let s: string;
    if (unit === "second") {
        s = "s";
    } else if (unit === "minute") {
        s = count % 60 === 0 ? "h" : "m";
        n = s === "h" ? count / 60 : count;
    } else if (unit === "day") {
        s = "D";
    } else if (unit === "week") {
        s = "W";
    } else {
        s = count % 12 === 0 ? "Y" : "M";
        n = s === "Y" ? count / 12 : count;
    }
    return style === "long" ? `${n} ${LONG[s]}${n === 1 ? "" : "s"}` : `${n}${s}`;
}

/** Compares resolutions by duration (for sorting). */
export const compareResolutions = (a: Resolution, b: Resolution) => resolutionToMs(a) - resolutionToMs(b);

// ---------------------------------------------------------------- time zones & bucket alignment

/** Options for calendar alignment of bars. */
export interface AlignOptions {
    /** IANA time zone used for day / week / month boundaries (exchange time). Default "UTC". */
    readonly timeZone?: string;
    /** First day of the week for weekly bars: 0 = Sunday, 1 = Monday (default). */
    readonly weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

const zoneFormats = new Map<string, Intl.DateTimeFormat>();

/** Offset (ms) of `timeZone` from UTC at `time`: local wall-clock = time + offset. */
export function timeZoneOffset(time: number, timeZone = "UTC"): number {
    if (timeZone === "UTC" || timeZone === "Etc/UTC") {
        return 0;
    }
    let format = zoneFormats.get(timeZone);
    if (!format) {
        format = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hourCycle: "h23",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        });
        zoneFormats.set(timeZone, format);
    }
    const p: Record<string, number> = {};
    for (const { type, value } of format.formatToParts(new Date(time))) {
        p[type] = Number(value);
    }
    const local = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return local - Math.floor(time / 1000) * 1000;
}

const toUtc = (local: number, timeZone: string) => {
    // two passes handle DST transitions
    const guess = local - timeZoneOffset(local, timeZone);
    return local - timeZoneOffset(guess, timeZone);
};

const floorDiv = (a: number, b: number) => Math.floor(a / b) * b;
const MONDAY_EPOCH = 4 * DAY; // 1970-01-05 was a Monday

/** Calendar alignment in UTC wall-clock time (`local` is a "fake UTC" timestamp). */
function alignLocal(local: number, { unit, count }: ParsedResolution, weekStart: number): number {
    switch (unit) {
        case "second":
            return floorDiv(local, count * SECOND);
        case "minute":
            return floorDiv(local, count * MINUTE);
        case "day":
            return floorDiv(local, count * DAY);
        case "week": {
            const origin = MONDAY_EPOCH + (weekStart - 1) * DAY;
            return origin + floorDiv(local - origin, count * WEEK);
        }
        default: {
            const d = new Date(local);
            const months = d.getUTCFullYear() * 12 + d.getUTCMonth();
            const start = floorDiv(months, count);
            return Date.UTC(Math.floor(start / 12), start % 12, 1);
        }
    }
}

/**
 * Start time of the bar containing `time` (ms epoch). Seconds / minutes align to the epoch,
 * days to midnight, weeks to `weekStart`, months to the 1st — in `timeZone` (default UTC).
 */
export function alignTime(time: number, resolution: Resolution, options: AlignOptions = {}): number {
    const parsed = parseResolution(resolution);
    const tz = options.timeZone ?? "UTC";
    const weekStart = options.weekStart ?? 1;
    const offset = tz === "UTC" ? 0 : timeZoneOffset(time, tz);
    // intraday buckets that divide the zone offset align in absolute time (stays correct across DST repeats)
    if (
        offset === 0 ||
        parsed.unit === "second" ||
        (parsed.unit === "minute" && offset % (parsed.count * MINUTE) === 0)
    ) {
        return alignLocal(time + offset, parsed, weekStart) - offset;
    }
    const local = time + offset;
    return toUtc(alignLocal(local, parsed, weekStart), tz);
}

/** Start time of the bar following the one that starts at (or contains) `time`. */
export function nextBarTime(time: number, resolution: Resolution, options: AlignOptions = {}): number {
    const parsed = parseResolution(resolution);
    const start = alignTime(time, resolution, options);
    if (parsed.unit !== "month" && parsed.unit !== "day" && parsed.unit !== "week") {
        return start + resolutionToMs(resolution);
    }
    const tz = options.timeZone ?? "UTC";
    const local = start + timeZoneOffset(start, tz);
    const d = new Date(local);
    let next: number;
    if (parsed.unit === "month") {
        next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + parsed.count, 1);
    } else {
        next = local + parsed.count * (parsed.unit === "day" ? DAY : WEEK);
    }
    return tz === "UTC" ? next : toUtc(next, tz);
}
