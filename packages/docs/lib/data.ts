// Sample data for live examples (MSFT daily bars 2010-2016 and a comparison set).
// The JSON files are generated from data/*.tsv by scripts/generate.mjs.
import comparisonJson from "@/data/json/comparison.json";
import dailyJson from "@/data/json/daily.json";

export interface Bar {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface ComparisonBar extends Bar {
    /** S&P 500 close. */
    sp500: number;
    aapl: number;
    ge: number;
}

/** Parses "YYYY-MM-DD" as local midnight, so daily bars land on their calendar day in every time zone. */
const day = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
};

type Row = (string | number | null)[];
const num = (v: string | number | null) => (typeof v === "number" ? v : NaN);

/** ~1,700 daily OHLCV bars. */
export const daily: Bar[] = (dailyJson.rows as Row[]).map((r) => ({
    date: day(r[0] as string),
    open: num(r[1]),
    high: num(r[2]),
    low: num(r[3]),
    close: num(r[4]),
    volume: num(r[5]),
}));

/** ~2,100 daily bars with closes of the S&P 500, AAPL and GE for compare examples. */
export const comparison: ComparisonBar[] = (comparisonJson.rows as Row[]).map((r) => ({
    date: day(r[0] as string),
    open: num(r[1]),
    high: num(r[2]),
    low: num(r[3]),
    close: num(r[4]),
    volume: num(r[5]),
    sp500: num(r[6]),
    aapl: num(r[7]),
    ge: num(r[8]),
}));
