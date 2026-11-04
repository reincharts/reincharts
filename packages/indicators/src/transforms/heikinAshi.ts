import { readOHLCV, type OHLCVOptions } from "../calculators/core";

/** A source bar with its OHLC replaced by Heikin Ashi values (every other field, e.g. date / volume, is kept). */
export type HeikinAshiBar<T> = Omit<T, "open" | "high" | "low" | "close"> & {
    open: number;
    high: number;
    low: number;
    close: number;
};

/**
 * Heikin Ashi bars: close = (O+H+L+C)/4, open = (prev open + prev close)/2
 * (first bar: (O+C)/2), high = max(H, open, close), low = min(L, open, close). Returns NEW bars, 1:1 with data.
 */
export function heikinAshi<T>(data: readonly T[], o: OHLCVOptions<T> = {}): HeikinAshiBar<T>[] {
    const f = readOHLCV(data, o);
    const open = f.open();
    const high = f.high();
    const low = f.low();
    const close = f.close();
    const bars: HeikinAshiBar<T>[] = new Array(data.length);
    let po = NaN;
    let pc = NaN;
    for (let i = 0; i < data.length; i++) {
        const c = (open[i] + high[i] + low[i] + close[i]) / 4;
        const op = po === po && pc === pc ? (po + pc) / 2 : (open[i] + close[i]) / 2;
        bars[i] = { ...data[i], open: op, high: Math.max(high[i], op, c), low: Math.min(low[i], op, c), close: c };
        if (c === c && op === op) {
            po = op;
            pc = c;
        }
    }
    return bars;
}
