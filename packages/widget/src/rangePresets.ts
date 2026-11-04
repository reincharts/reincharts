import type { ChartEngine } from "@reincharts/core";

/** Bottom bar range buttons. */
export type RangePreset = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "All";

/** Range buttons of the bottom bar, in display order ("All" fits every loaded bar). */
export const RANGE_PRESETS: readonly RangePreset[] = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"];

const DAY = 86_400_000;

const monthsBack = (time: number, months: number) => {
    const d = new Date(time);
    const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    return Date.UTC(
        target.getUTCFullYear(),
        target.getUTCMonth(),
        Math.min(d.getUTCDate(), lastDay),
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds(),
        d.getUTCMilliseconds(),
    );
};

/**
 * Start time (ms) of a range preset ending at `last` (the last bar time), in UTC calendar terms.
 * Returns undefined for "All" (fit everything).
 */
export function presetStart(preset: RangePreset, last: number): number | undefined {
    switch (preset) {
        case "1D":
            return last - DAY;
        case "5D":
            return last - 5 * DAY;
        case "1M":
            return monthsBack(last, 1);
        case "3M":
            return monthsBack(last, 3);
        case "6M":
            return monthsBack(last, 6);
        case "YTD":
            return Date.UTC(new Date(last).getUTCFullYear(), 0, 1);
        case "1Y":
            return monthsBack(last, 12);
        case "5Y":
            return monthsBack(last, 60);
        default:
            return undefined;
    }
}

/**
 * Shows a range preset: from the preset start to the last bar (plus the usual right margin).
 * Returns the preset start time when the data does not reach back that far (load more history and retry).
 */
export function applyPreset(engine: ChartEngine, preset: RangePreset): number | undefined {
    const n = engine.data.length;
    if (n === 0) {
        return undefined;
    }
    const first = engine.times[0];
    const last = engine.times[n - 1];
    const start = presetStart(preset, last);
    if (start === undefined) {
        engine.fitContent();
        return undefined;
    }
    // first bar at or after the start, at least a few bars, never before the first bar
    const firstBar = Math.ceil(engine.logicalOfTime(start) - 1e-9);
    const from = Math.max(-0.5, Math.min(firstBar - 0.5, n - 4.5));
    engine.setLogicalRange(from, n - 0.5 + 3);
    return start < first ? start : undefined;
}
