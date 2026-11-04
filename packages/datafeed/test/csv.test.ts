import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv, parseTimeValue } from "../src";

const docsData = (name: string) => readFileSync(resolve(__dirname, "../../docs/data", name), "utf8");
const utc = Date.UTC;

describe("parseTimeValue", () => {
    it.each([
        ["2010-01-04", utc(2010, 0, 4)],
        ["2010-01-04 09:30", utc(2010, 0, 4, 9, 30)],
        ["2010-01-04T09:30:15", utc(2010, 0, 4, 9, 30, 15)],
        ["2010-01-04 09:30:15.5", utc(2010, 0, 4, 9, 30, 15, 500)],
        ["2010-01-04T09:30:00Z", utc(2010, 0, 4, 9, 30)],
        ["2010-01-04T09:30:00-05:00", utc(2010, 0, 4, 14, 30)],
        ["1460727000000", 1460727000000],
        ["1460727000", 1460727000000],
        ["  1460727000  ", 1460727000000],
    ])("%j → %d", (input, expected) => {
        expect(parseTimeValue(input)).toBe(expected);
    });

    it("returns NaN for garbage", () => {
        expect(parseTimeValue("not a date")).toBeNaN();
    });
});

describe("parseCsv", () => {
    it("parses CSV with a date column, sorted", () => {
        const bars = parseCsv("Date,Open,High,Low,Close,Volume\n2024-01-03,2,3,1,2.5,100\n2024-01-02,1,2,0.5,1.5,50\n");
        expect(bars).toEqual([
            { time: utc(2024, 0, 2), open: 1, high: 2, low: 0.5, close: 1.5, volume: 50 },
            { time: utc(2024, 0, 3), open: 2, high: 3, low: 1, close: 2.5, volume: 100 },
        ]);
    });

    it("auto-detects tabs and semicolons, handles CRLF and a BOM", () => {
        const tsv = parseCsv("\uFEFFtime\tclose\r\n1700000000\t5\r\n");
        expect(tsv).toEqual([{ time: 1700000000000, open: 5, high: 5, low: 5, close: 5 }]);
        const ssv = parseCsv("date;close\n2024-01-01;1.5");
        expect(ssv[0].close).toBe(1.5);
    });

    it("keeps extra columns (numbers or strings) and skips empty cells", () => {
        const [row] = parseCsv(
            "date,open,high,low,close,volume,split,note,SP500Close\n2024-01-01,1,2,0,1,,,hello,1416.6",
        );
        expect(row).toEqual({
            time: utc(2024, 0, 1),
            open: 1,
            high: 2,
            low: 0,
            close: 1,
            note: "hello",
            SP500Close: 1416.6,
        });
    });

    it("supports quoted cells, column mapping, custom time column and parser", () => {
        const text = 'Day,"Adj Close","Comment"\n05/01/2024,"1,234.5","said ""hi"", twice"';
        const bars = parseCsv(text, {
            timeColumn: "Day",
            columns: { close: "Adj Close" },
            parseTime: (v) => {
                const [m, d, y] = v.split("/").map(Number);
                return utc(y, m - 1, d);
            },
        });
        // "1,234.5" is not numeric → kept as string, so the row has no close and is skipped
        expect(bars).toEqual([]);
        const ok = parseCsv('Day,"Adj Close",Comment\n05/01/2024,1234.5,"said ""hi"", twice"', {
            timeColumn: "day",
            columns: { close: "Adj Close" },
            parseTime: (v) => utc(+v.slice(6), +v.slice(0, 2) - 1, +v.slice(3, 5)),
        });
        expect(ok).toEqual([
            {
                time: utc(2024, 4, 1),
                open: 1234.5,
                high: 1234.5,
                low: 1234.5,
                close: 1234.5,
                Comment: 'said "hi", twice',
            },
        ]);
    });

    it("skips invalid rows and can keep file order", () => {
        const text = "date,close\nbad,1\n2024-01-02,2\n2024-01-01,\n2024-01-01,3\n";
        expect(parseCsv(text).map((b) => b.close)).toEqual([3, 2]);
        expect(parseCsv(text, { sort: false }).map((b) => b.close)).toEqual([2, 3]);
        expect(parseCsv("")).toEqual([]);
        expect(() => parseCsv("a,b\n1,2")).toThrow(/no time column/);
    });

    it("reads the docs DAILY.tsv (date strings)", () => {
        const bars = parseCsv(docsData("DAILY.tsv"));
        expect(bars.length).toBeGreaterThan(1000);
        expect(bars[0].time).toBe(utc(2010, 0, 4));
        expect(bars[0].close).toBeCloseTo(25.710416);
        expect(bars[0].volume).toBe(38409100);
        expect(bars.every((b, i) => i === 0 || b.time > bars[i - 1].time)).toBe(true);
        expect(bars.every((b) => b.high >= b.low)).toBe(true);
    });

    it("reads the docs MINUTES.tsv and SECONDS.tsv (epoch ms, any column order)", () => {
        const minutes = parseCsv(docsData("MINUTES.tsv"));
        expect(minutes[0]).toEqual({
            time: 1460727000000,
            open: 55.3,
            high: 55.3,
            low: 55.25,
            close: 55.25,
            volume: 3399547,
        });
        const seconds = parseCsv(docsData("SECONDS.tsv"));
        expect(seconds[0].time).toBe(1598521666000);
        expect(seconds[0].close).toBe(11424.555);
        expect(seconds[1].time - seconds[0].time).toBe(1000);
    });

    it("reads the docs comparison.tsv with compare columns", () => {
        const bars = parseCsv(docsData("comparison.tsv"));
        expect(bars[0].AAPLClose).toBe(11.97);
        expect(bars[0].SP500Close).toBe(1416.6);
    });
});
