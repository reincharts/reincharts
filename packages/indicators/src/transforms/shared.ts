import { accessor, type Accessor } from "@reincharts/core";
import { atrK } from "../calculators/volatility";
import { defaultTime, read, readOHLCV, type OHLCVOptions } from "../calculators/core";

/** Options shared by the bar transforms (renko, kagi, point & figure, line break). */
export interface TransformOptions<T = any> extends OHLCVOptions<T> {
    /** Bar time accessor copied to `date` / `fromDate` / `toDate`. Default `d.date ?? d.time`. */
    readonly time?: Accessor<T, unknown>;
}

/** Box / reversal size: a fixed price amount or `"atr"` (ATR at the last bar). */
export type BoxSize = number | "atr";

export const timeFn = <T>(o: TransformOptions<T>): ((d: T, i: number) => any) =>
    o.time === undefined ? defaultTime : accessor(o.time);

/** Resolves a box size; `"atr"` uses the last defined ATR (or the mean true range on short data). */
export const resolveBoxSize = <T>(
    data: readonly T[],
    size: BoxSize | undefined,
    atrPeriod: number | undefined,
    o: OHLCVOptions<T>,
) => {
    if (typeof size === "number") {
        return size > 0 && Number.isFinite(size) ? size : NaN;
    }
    const a = atrK(data, { ...o, period: atrPeriod ?? 14 });
    for (let i = a.length - 1; i >= 0; i--) {
        if (a[i] === a[i]) {
            return a[i] > 0 ? a[i] : NaN;
        }
    }
    const h = read(data, o.high, "high");
    const l = read(data, o.low, "low");
    let sum = 0;
    let count = 0;
    for (let i = 0; i < h.length; i++) {
        if (h[i] - l[i] === h[i] - l[i]) {
            sum += h[i] - l[i];
            count++;
        }
    }
    return count > 0 && sum > 0 ? sum / count : NaN;
};

/** high / low readers that either use the bar range or the source (close) only. */
export const priceRange = <T>(data: readonly T[], o: OHLCVOptions<T>, useHighLow: boolean) => {
    const f = readOHLCV(data, o);
    const close = f.close();
    return useHighLow ? { up: f.high(), down: f.low(), close } : { up: close, down: close, close };
};
