// Intraday sample data (kept separate from lib/data.ts so daily examples don't ship it).
import minutesJson from "@/data/json/minutes.json";
import secondsJson from "@/data/json/seconds.json";
import type { Bar } from "./data";

type Row = (number | null)[];
const num = (v: number | null) => v ?? NaN;

/** ~8,200 one-minute OHLCV bars. */
export const minutes: Bar[] = (minutesJson.rows as Row[]).map((r) => ({
    date: new Date(num(r[0])),
    open: num(r[1]),
    high: num(r[2]),
    low: num(r[3]),
    close: num(r[4]),
    volume: num(r[5]),
}));

/** ~6,000 one-second bars (no volume). */
export const seconds: Omit<Bar, "volume">[] = (secondsJson.rows as Row[]).map((r) => ({
    date: new Date(num(r[0])),
    open: num(r[1]),
    high: num(r[2]),
    low: num(r[3]),
    close: num(r[4]),
}));
