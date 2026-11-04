import { read } from "../calculators/core";
import { timeFn, type TransformOptions } from "./shared";

export interface LineBreakOptions<T = any> extends TransformOptions<T> {
    /** Number of lines a reversal must break. Default 3 ("three line break"). */
    readonly lines?: number;
}

/** A line break bar (draw like a candle body from open to close). */
export interface LineBreakBar {
    /** Time of the bar that formed the line. */
    date: any;
    fromDate: any;
    toDate: any;
    from: number;
    to: number;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    /** 1 = up line, −1 = down line. */
    direction: 1 | -1;
}

/**
 * Line break (three line break by default): a new line in the trend direction for every new close beyond
 * the last line; a reversal line only when the close breaks the extreme of the last `lines` lines.
 */
export function lineBreak<T>(data: readonly T[], o: LineBreakOptions<T> = {}): LineBreakBar[] {
    const n = Math.max(1, Math.floor(o.lines ?? 3));
    const close = read(data, o.close, "close");
    const vol = read(data, o.volume, "volume");
    const time = timeFn(o);
    const bars: LineBreakBar[] = [];
    let base = NaN;
    let from = 0;
    let volume = 0;
    const push = (open: number, c: number, i: number) => {
        const t = time(data[i], i);
        bars.push({
            date: t,
            fromDate: time(data[from], from),
            toDate: t,
            from,
            to: i,
            open,
            close: c,
            high: Math.max(open, c),
            low: Math.min(open, c),
            volume,
            direction: c > open ? 1 : -1,
        });
        volume = 0;
        from = Math.min(i + 1, data.length - 1);
    };
    for (let i = 0; i < data.length; i++) {
        const c = close[i];
        if (vol[i] === vol[i]) {
            volume += vol[i];
        }
        if (c !== c) {
            continue;
        }
        const last = bars.at(-1);
        if (!last) {
            if (base !== base) {
                base = c;
                from = i;
            } else if (c !== base) {
                push(base, c, i);
            }
            continue;
        }
        const recent = bars.slice(-n);
        if (last.direction > 0) {
            if (c > last.close) {
                push(last.close, c, i);
            } else if (c < Math.min(...recent.map((b) => b.low))) {
                push(last.open, c, i);
            }
        } else if (c < last.close) {
            push(last.close, c, i);
        } else if (c > Math.max(...recent.map((b) => b.high))) {
            push(last.open, c, i);
        }
    }
    return bars;
}
