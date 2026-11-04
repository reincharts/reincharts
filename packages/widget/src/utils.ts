import { darkTheme, lightTheme, type ChartEngine } from "@reincharts/core";
import { formatResolution, RESOLUTIONS, resolutionToMs } from "@reincharts/datafeed";
import { type StateAction, type TradingChartState } from "./state";

/** Bar time in ms (`time` or `date`). */
export const timeOf = (d: any): number => (typeof d?.time === "number" ? d.time : +(d?.date ?? NaN));

/**
 * Gives a new indicator fixed palette colors for its colorless outputs (colors don't shift
 * when other indicators are removed, and the style tab shows the real color). The first palette color, used by
 * line / area chart types, is skipped.
 */
export function applyIndicatorColors(
    action: StateAction,
    state: TradingChartState,
    themeName: "light" | "dark",
): StateAction {
    if (action.type !== "addIndicator") {
        return action;
    }
    const palette = (themeName === "dark" ? darkTheme : lightTheme).palette;
    const styles = { ...action.styles };
    // palette[0] is the color of line / area main series: start after it
    let k = state.indicators.length;
    for (const [key, output] of Object.entries(action.definition.outputs)) {
        if (!output.color && !styles[key]?.color && !output.colorFn) {
            styles[key] = { ...styles[key], color: palette[1 + (k++ % (palette.length - 1))] };
        }
    }
    return { ...action, styles };
}

/** Pane weights of an engine layout, scaled so the price pane defaults to 3 and indicator panes to 1. */
export function measurePaneSizes(engine: ChartEngine): Record<string, number> | undefined {
    const panes = engine.layout.panes.filter((p) => p.height > 0 && !p.collapsed);
    const total = panes.reduce((s, p) => s + p.height, 0);
    if (!total || panes.length < 2) {
        return undefined;
    }
    const weight = 3 + (panes.length - 1);
    const out: Record<string, number> = {};
    for (const p of panes) {
        out[p.id] = Math.round((p.height / total) * weight * 1000) / 1000;
    }
    return out;
}

/** Guesses the resolution of bars from their median spacing (data mode label). */
export function inferResolution(data: readonly any[]): string | undefined {
    const n = data.length;
    if (n < 2) {
        return undefined;
    }
    const diffs: number[] = [];
    for (let i = Math.max(1, n - 50); i < n; i++) {
        const d = timeOf(data[i]) - timeOf(data[i - 1]);
        if (d > 0) {
            diffs.push(d);
        }
    }
    if (!diffs.length) {
        return undefined;
    }
    diffs.sort((a, b) => a - b);
    const step = diffs[diffs.length >> 1];
    let best: string | undefined;
    let bestErr = Infinity;
    for (const r of RESOLUTIONS) {
        const err = Math.abs(Math.log(resolutionToMs(r) / step));
        if (err < bestErr) {
            bestErr = err;
            best = r;
        }
    }
    // daily bars skip weekends: anything between 1 and 3 days is "1D"
    return step >= 86_400_000 && step < 4 * 86_400_000 ? "1D" : best;
}

/** Short interval label ("1m", "4h", "1D"), or the raw string when it is not a valid resolution. */
export const intervalLabel = (resolution: string) => {
    try {
        return formatResolution(resolution);
    } catch {
        return resolution;
    }
};

/** Short interval text in the toolbar: minutes as "5m", hours "1h", days "D", weeks "W"... */
export const intervalShort = (resolution: string) => {
    const label = intervalLabel(resolution);
    return /^1[DWMY]$/.test(label) ? label.slice(1) : label;
};

/** Time zones offered by the settings dialog and the bottom bar (plus the browser and the current one). */
const TIME_ZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Berlin",
    "Europe/Moscow",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Hong_Kong",
    "Asia/Tokyo",
    "Australia/Sydney",
];

/** IANA time zone of the browser. */
export const localZone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
        return "UTC";
    }
};

/** "America/New_York" → "New York", "Etc/UTC" → "UTC". */
export const zoneLabel = (zone: string) =>
    zone === "Etc/UTC" ? "UTC" : (zone.split("/").pop() ?? zone).replace(/_/g, " ");

/** Zones to list: the browser zone first, the common ones, then `current` when it is another one. */
export const zoneOptions = (current: string | undefined) =>
    Array.from(new Set([localZone(), ...TIME_ZONES, ...(current ? [current] : [])]));

/** Closes a popup on outside pointerdown / Escape (`close` receives which one). */
export function onOutside(el: HTMLElement | null, close: (reason: "outside" | "escape") => void) {
    const down = (e: PointerEvent) => {
        if (el && !el.contains(e.target as Node)) {
            close("outside");
        }
    };
    const key = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            close("escape");
        }
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("keydown", key, true);
    return () => {
        document.removeEventListener("pointerdown", down, true);
        document.removeEventListener("keydown", key, true);
    };
}
