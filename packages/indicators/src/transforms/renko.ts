import { read } from "../calculators/core";
import { priceRange, resolveBoxSize, timeFn, type BoxSize, type TransformOptions } from "./shared";

export interface RenkoOptions<T = any> extends TransformOptions<T> {
    /** Brick size: a price amount or `"atr"` (default; ATR at the last bar). */
    readonly boxSize?: BoxSize;
    /** ATR length when `boxSize` is "atr". Default 14. */
    readonly atrPeriod?: number;
    /** Price used to form bricks: `"close"` (default) or `"hl"` (high for up moves, low for down moves). */
    readonly source?: "close" | "hl";
    /** Append a not yet complete brick for the last price (`fullyFormed: false`). Default true. */
    readonly partial?: boolean;
}

/** A renko brick. Use as chart data: x = `date`, candle = open/high/low/close. */
export interface RenkoBrick {
    /** Time of the bar that completed the brick (= `toDate`). */
    date: any;
    fromDate: any;
    toDate: any;
    /** Index of the first source bar of the brick. */
    from: number;
    /** Index of the source bar that completed the brick. */
    to: number;
    open: number;
    close: number;
    /** max(open, close). */
    high: number;
    /** min(open, close). */
    low: number;
    /** Volume traded while the brick formed. */
    volume: number;
    /** 1 = up brick, −1 = down brick. */
    direction: 1 | -1;
    /** False for the trailing brick still in progress. */
    fullyFormed: boolean;
}

/**
 * Traditional renko: a new brick each time the price moves one box beyond the last brick's top (up)
 * or bottom (down) — reversals therefore need two boxes from the last close. Returns NEW bars.
 */
export function renko<T>(data: readonly T[], o: RenkoOptions<T> = {}): RenkoBrick[] {
    const box = resolveBoxSize(data, o.boxSize ?? "atr", o.atrPeriod, o);
    const bricks: RenkoBrick[] = [];
    if (!(box > 0)) {
        return bricks;
    }
    const { up, down, close } = priceRange(data, o, o.source === "hl");
    const vol = read(data, o.volume, "volume");
    const time = timeFn(o);
    let hi = NaN;
    let lo = NaN;
    let from = 0;
    let volume = 0;
    const push = (open: number, closeAt: number, i: number, fullyFormed = true) => {
        const t = time(data[i], i);
        bricks.push({
            date: t,
            fromDate: time(data[from], from),
            toDate: t,
            from,
            to: i,
            open,
            close: closeAt,
            high: Math.max(open, closeAt),
            low: Math.min(open, closeAt),
            volume,
            direction: closeAt > open ? 1 : -1,
            fullyFormed,
        });
        volume = 0;
        from = i;
        hi = Math.max(open, closeAt);
        lo = Math.min(open, closeAt);
    };
    for (let i = 0; i < data.length; i++) {
        if (vol[i] === vol[i]) {
            volume += vol[i];
        }
        if (hi !== hi) {
            if (close[i] === close[i]) {
                hi = lo = close[i];
                from = i;
            }
            continue;
        }
        let formed = false;
        while (up[i] >= hi + box) {
            push(hi, hi + box, i);
            formed = true;
        }
        while (!formed && down[i] <= lo - box) {
            push(lo, lo - box, i);
        }
        if (bricks.at(-1)?.to === i) {
            from = Math.min(i + 1, data.length - 1);
        }
    }
    const last = data.length - 1;
    if (o.partial !== false && last >= 0 && hi === hi && bricks.at(-1)?.to !== last) {
        const p = close[last];
        if (p > hi) {
            push(hi, p, last, false);
        } else if (p < lo) {
            push(lo, p, last, false);
        }
    }
    return bricks;
}
