import {
    accessor,
    applyStroke,
    horizontalLine,
    isFiniteNumber,
    withAlpha,
    type Accessor,
    type LineDash,
} from "@reincharts/core";
import { PathBatch } from "./geometry";
import { useSeries, type SeriesProps } from "./useSeries";

export interface VolumeProfileSeriesProps<T = any> extends Omit<SeriesProps, "legend" | "format"> {
    /** Price each bar's whole volume is assigned to. When omitted, volume is spread evenly over each bar's low–high range. */
    readonly price?: Accessor<T>;
    /** High accessor (volume spreading). Default "high". */
    readonly high?: Accessor<T>;
    /** Low accessor (volume spreading). Default "low". */
    readonly low?: Accessor<T>;
    /** Volume accessor. Default "volume". */
    readonly volume?: Accessor<T>;
    /** Open accessor (bars with close >= open count as up volume). Default "open". */
    readonly open?: Accessor<T>;
    /** Close accessor. Default "close". */
    readonly close?: Accessor<T>;
    /** Number of price rows. Default 24. */
    readonly bins?: number;
    /** Edge of the pane (or session) the rows grow from. Default "right". */
    readonly side?: "left" | "right";
    /** Width of the longest row as a fraction of the pane (or session) width. Default 0.3. */
    readonly maxWidth?: number;
    /** Up volume color. Defaults to theme.up at 35% opacity. */
    readonly upColor?: string;
    /** Down volume color. Defaults to theme.down at 35% opacity. */
    readonly downColor?: string;
    /** Draw the point of control (row with the most volume) as a line. Default true. */
    readonly showPoc?: boolean;
    /** Point of control line color. Defaults to theme.textMuted. */
    readonly pocColor?: string;
    /** Point of control line dash. Default "dashed". */
    readonly pocDash?: LineDash;
    /** Starts a new profile at bar i (session profiles), e.g. `(d, i, prev) => d.date.getDate() !== prev.date.getDate()`. */
    readonly sessionStart?: (d: T, index: number, prev: T) => boolean;
}

export interface ProfileRow {
    /** Price range of the row. */
    readonly from: number;
    readonly to: number;
    readonly up: number;
    readonly down: number;
}

/**
 * Buckets the volume of bars start..end into `bins` price rows. Each bar's volume is spread evenly
 * over the rows its [low, high] price range overlaps (exported for tests and custom drawing).
 */
export const volumeProfile = <T,>(
    data: readonly T[],
    start: number,
    end: number,
    bins: number,
    range: (d: T, i: number) => readonly [number, number],
    volume: (d: T, i: number) => number,
    isUp: (d: T, i: number) => boolean,
): ProfileRow[] => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = start; i <= end; i++) {
        const [lo, hi] = range(data[i], i);
        if (isFiniteNumber(lo) && isFiniteNumber(hi)) {
            min = Math.min(min, lo);
            max = Math.max(max, hi);
        }
    }
    if (!(min <= max) || bins < 1) {
        return [];
    }
    const step = (max - min) / bins || 1;
    const rows = Array.from({ length: bins }, (_, k) => ({
        from: min + k * step,
        to: min + (k + 1) * step,
        up: 0,
        down: 0,
    }));
    const rowOf = (p: number) => Math.max(0, Math.min(bins - 1, Math.floor((p - min) / step)));
    for (let i = start; i <= end; i++) {
        const [lo, hi] = range(data[i], i);
        const v = volume(data[i], i);
        if (!isFiniteNumber(lo) || !isFiniteNumber(hi) || !isFiniteNumber(v)) {
            continue;
        }
        const up = isUp(data[i], i);
        const a = rowOf(lo);
        const b = rowOf(hi);
        for (let k = a; k <= b; k++) {
            // share proportional to the overlap of [lo, hi] with the row (whole volume for a single price)
            const overlap =
                hi > lo ? (Math.min(hi, rows[k].to) - Math.max(lo, rows[k].from)) / (hi - lo) : 1 / (b - a + 1);
            const share = v * Math.max(0, overlap);
            if (up) {
                rows[k].up += share;
            } else {
                rows[k].down += share;
            }
        }
    }
    return rows;
};

/** Volume profile: a horizontal histogram of traded volume by price over the visible bars (or per session), split up / down. */
export function VolumeProfileSeries<T = any>({
    price,
    high = "high" as Accessor<T>,
    low = "low" as Accessor<T>,
    volume = "volume" as Accessor<T>,
    open = "open" as Accessor<T>,
    close = "close" as Accessor<T>,
    bins = 24,
    side = "right",
    maxWidth = 0.3,
    upColor,
    downColor,
    showPoc = true,
    pocColor,
    pocDash = "dashed",
    sessionStart,
    zIndex = -1,
    ...rest
}: VolumeProfileSeriesProps<T>) {
    const p = accessor(price);
    const h = accessor(high);
    const l = accessor(low);
    const range = (d: T, i: number): [number, number] => (p ? [p(d, i), p(d, i)] : [l(d, i), h(d, i)]);
    const v = accessor(volume);
    const o = accessor(open);
    const c = accessor(close);
    const isUp = (d: T, i: number) => c(d, i) >= o(d, i);
    useSeries<T>({
        ...rest,
        zIndex,
        legend: false,
        lastValue: false,
        autoscale: false,
        values: () => undefined,
        color: (_d, _i, theme) => theme.neutral,
        draw(ctx, { data, start, end, x, y, barSpacing, theme, pane }) {
            const plotWidth = pane?.width ?? 0;
            const sessions: [number, number][] = [];
            let from = Math.max(0, start);
            for (let i = from + 1; i <= end && sessionStart; i++) {
                if (sessionStart(data[i], i, data[i - 1])) {
                    sessions.push([from, i - 1]);
                    from = i;
                }
            }
            if (from <= end) {
                sessions.push([from, end]);
            }
            const fills = new PathBatch();
            const pocs: [number, number, number][] = [];
            const up = upColor ?? withAlpha(theme.up, 0.35);
            const down = downColor ?? withAlpha(theme.down, 0.35);
            for (const [a, b] of sessions) {
                const rows = volumeProfile(data, a, b, bins, range, v, isUp);
                const most = rows.reduce((m, r) => Math.max(m, r.up + r.down), 0);
                if (!most) {
                    continue;
                }
                const left = sessionStart ? Math.max(0, x(a) - barSpacing / 2) : 0;
                const right = sessionStart ? Math.min(plotWidth, x(b) + barSpacing / 2) : plotWidth;
                const scale = ((right - left) * maxWidth) / most;
                const dir = side === "right" ? -1 : 1;
                const edge = side === "right" ? right : left;
                let poc = rows[0];
                for (const row of rows) {
                    if (row.up + row.down > poc.up + poc.down) {
                        poc = row;
                    }
                    const y0 = Math.round(y(row.to));
                    const y1 = Math.round(y(row.from));
                    const h = Math.max(1, y1 - y0 - 1);
                    const wu = Math.round(row.up * scale);
                    const wd = Math.round(row.down * scale);
                    if (wu > 0) {
                        fills.get(up).rect(dir > 0 ? edge : edge - wu, y0, wu, h);
                    }
                    if (wd > 0) {
                        fills.get(down).rect(dir > 0 ? edge + wu : edge - wu - wd, y0, wd, h);
                    }
                }
                pocs.push([y((poc.from + poc.to) / 2), left, right]);
            }
            fills.fill(ctx);
            if (showPoc) {
                applyStroke(ctx, { color: pocColor ?? theme.textMuted, width: 1, dash: pocDash });
                for (const [py, l, r] of pocs) {
                    horizontalLine(ctx, py, l, r);
                }
            }
        },
    });
    return null;
}
