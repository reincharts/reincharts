import { read } from "../calculators/core";
import { resolveBoxSize, timeFn, type BoxSize, type TransformOptions } from "./shared";

export interface KagiOptions<T = any> extends TransformOptions<T> {
    /** Reversal amount: a price amount, `"atr"` (default; ATR at the last bar) — or a percent with `reversalType: "percent"`. */
    readonly reversal?: BoxSize;
    /** How `reversal` is read when it is a number: price amount (default) or percent of the price. */
    readonly reversalType?: "fixed" | "percent";
    /** ATR length when `reversal` is "atr". Default 14. */
    readonly atrPeriod?: number;
    /** Price the lines follow. Default `"close"`. */
    readonly source?: "close" | "open" | "high" | "low";
}

/** A kagi line segment between two reversals. */
export interface KagiLine {
    /** Time of the first bar of the line. */
    date: any;
    /** Time of the first bar. */
    from: any;
    /** Time of the last bar. */
    to: any;
    fromIndex: number;
    toIndex: number;
    /** Price where the line starts (the previous line's close). */
    open: number;
    /** Extreme reached by the line. */
    close: number;
    /** Highest / lowest source bar values while the line formed. */
    high: number;
    low: number;
    volume: number;
    /** Thickness at the start of the line: "yang" (thick, bullish) or "yin" (thin, bearish). */
    startAs: "yang" | "yin";
    /** Set when the line changes thickness midway: the new type... */
    changeTo?: "yang" | "yin";
    /** ...and the price where it changes (the prior peak / trough). */
    changePoint?: number;
    /** Latest source price (last line only meaningful). */
    current: number;
    /** Price at which the line would reverse. */
    reverseAt: number;
}

/** Kagi lines: the line extends while price keeps its direction and reverses after moving `reversal` against it. */
export function kagi<T>(data: readonly T[], o: KagiOptions<T> = {}): KagiLine[] {
    const lines: KagiLine[] = [];
    const src = read(data, o.source ?? "close");
    const open = read(data, o.open, "open");
    const high = read(data, o.high, "high");
    const low = read(data, o.low, "low");
    const vol = read(data, o.volume, "volume");
    const time = timeFn(o);
    const fixed = o.reversalType === "percent" ? NaN : resolveBoxSize(data, o.reversal ?? "atr", o.atrPeriod, o);
    const pct = o.reversalType === "percent" ? (typeof o.reversal === "number" ? o.reversal : 1) / 100 : 0;
    const threshold = (price: number) => (pct ? Math.abs(price) * pct : fixed);
    if (o.reversalType !== "percent" && !(fixed > 0)) {
        return lines;
    }
    let prevPeak: number | undefined;
    let prevTrough: number | undefined;
    let line: KagiLine | undefined;
    for (let i = 0; i < data.length; i++) {
        const p = src[i];
        if (p !== p) {
            continue;
        }
        const t = time(data[i], i);
        if (!line) {
            const op = open[i] === open[i] ? open[i] : p;
            line = {
                date: t,
                from: t,
                to: t,
                fromIndex: i,
                toIndex: i,
                open: op,
                close: p,
                high: high[i],
                low: low[i],
                volume: 0,
                startAs: undefined as any,
                current: p,
                reverseAt: NaN,
            };
        }
        line.volume += vol[i] === vol[i] ? vol[i] : 0;
        line.high = Math.max(line.high, high[i]);
        line.low = Math.min(line.low, low[i]);
        line.to = t;
        line.toIndex = i;
        const move = p - line.close;
        const rising = line.close >= line.open;
        if ((rising && move > 0) || (!rising && move < 0)) {
            line.close = p;
            if (prevTrough !== undefined && p < prevTrough) {
                line.changePoint = prevTrough;
                if (line.startAs !== "yin") {
                    line.changeTo = "yin";
                }
            }
            if (prevPeak !== undefined && p > prevPeak) {
                line.changePoint = prevPeak;
                if (line.startAs !== "yang") {
                    line.changeTo = "yang";
                }
            }
        } else if (((rising && move < 0) || (!rising && move > 0)) && Math.abs(move) > threshold(line.close)) {
            let nextChangePoint: number | undefined;
            let nextChangeTo: "yang" | "yin" | undefined;
            if (!rising) {
                prevPeak ??= line.open;
                prevTrough = line.close;
                if (p > prevPeak) {
                    nextChangePoint = prevPeak;
                    nextChangeTo = "yang";
                }
            } else {
                prevTrough ??= line.open;
                prevPeak = line.close;
                if (p < prevTrough) {
                    nextChangePoint = prevTrough;
                    nextChangeTo = "yin";
                }
            }
            line.startAs ??= rising ? "yang" : "yin";
            lines.push(line);
            line = {
                date: t,
                from: t,
                to: t,
                fromIndex: i,
                toIndex: i,
                open: line.close,
                close: p,
                high: high[i],
                low: low[i],
                volume: 0,
                startAs: line.changeTo ?? line.startAs,
                changePoint: nextChangePoint,
                changeTo: nextChangeTo,
                current: p,
                reverseAt: NaN,
            };
        }
        line.current = p;
        line.reverseAt =
            line.close >= line.open ? line.close - threshold(line.close) : line.close + threshold(line.close);
    }
    if (line) {
        line.startAs ??= line.close >= line.open ? "yang" : "yin";
        lines.push(line);
    }
    return lines;
}
