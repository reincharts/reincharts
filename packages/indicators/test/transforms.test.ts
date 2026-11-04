import { generateBars } from "@reincharts/testing";
import { heikinAshi, kagi, lineBreak, pointAndFigure, renko } from "../src";

const bars = generateBars(300, { seed: 5 });
const at = (i: number) => new Date(Date.UTC(2024, 0, 1 + i));
const series = (values: number[]) =>
    values.map((c, i) => ({ date: at(i), open: c, high: c, low: c, close: c, volume: 10 }));

describe("heikinAshi", () => {
    it("computes HA bars and keeps the other fields", () => {
        const data = [
            { date: at(0), open: 10, high: 14, low: 8, close: 12, volume: 5 },
            { date: at(1), open: 12, high: 15, low: 11, close: 14, volume: 6 },
        ];
        const ha = heikinAshi(data);
        expect(ha[0]).toEqual({ date: at(0), volume: 5, open: 11, close: 11, high: 14, low: 8 });
        expect(ha[1].close).toBe(13);
        expect(ha[1].open).toBe(11);
        expect(ha[1].high).toBe(15);
        expect(ha[1].low).toBe(11);
        expect(data[0].open).toBe(10); // not mutated
        expect(heikinAshi([])).toEqual([]);
        const all = heikinAshi(bars);
        expect(all).toHaveLength(bars.length);
        all.forEach((b) => {
            expect(b.high).toBeGreaterThanOrEqual(Math.max(b.open, b.close));
            expect(b.low).toBeLessThanOrEqual(Math.min(b.open, b.close));
        });
    });
});

describe("renko", () => {
    it("forms bricks of a fixed size; reversals need two boxes", () => {
        const r = renko(series([10, 11, 12.5, 13, 12, 10.9, 9.5]), { boxSize: 1 });
        expect(r.map((b) => [b.open, b.close, b.direction, b.fullyFormed])).toEqual([
            [10, 11, 1, true],
            [11, 12, 1, true],
            [12, 13, 1, true],
            [12, 11, -1, true],
            [11, 10, -1, true],
        ]);
        expect(renko(series([10, 11, 11.6]), { boxSize: 1 }).at(-1)).toMatchObject({
            open: 11,
            close: 11.6,
            fullyFormed: false,
        });
        expect(r[0]).toMatchObject({ from: 0, to: 1, fromDate: at(0), toDate: at(1), date: at(1), high: 11, low: 10 });
        expect(r[1].volume + r[0].volume).toBe(30);
        expect(renko(series([10, 11, 12.5]), { boxSize: 1, partial: false })).toHaveLength(2);
    });

    it("supports high/low source, ATR box size and degenerate input", () => {
        const atrBricks = renko(bars);
        expect(atrBricks.length).toBeGreaterThan(5);
        const size = Math.abs(atrBricks[0].close - atrBricks[0].open);
        atrBricks.filter((b) => b.fullyFormed).forEach((b) => expect(Math.abs(b.close - b.open)).toBeCloseTo(size));
        expect(renko(bars, { source: "hl", boxSize: size }).length).toBeGreaterThanOrEqual(atrBricks.length);
        expect(renko([])).toEqual([]);
        expect(renko(series([1, 2]), { boxSize: 0 })).toEqual([]);
    });
});

describe("kagi", () => {
    it("reverses after the threshold and switches yin / yang at prior peaks / troughs", () => {
        const lines = kagi(series([10, 12, 15, 13, 14, 11, 9, 16]), { reversal: 1.5 });
        expect(lines.map((l) => [l.open, l.close])).toEqual([
            [10, 15],
            [15, 9],
            [9, 16],
        ]);
        // first line rises 10 -> 15 (yang), reverses down to 9 (breaks prior trough 10? first trough = open 10 -> yin)
        expect(lines[0]).toMatchObject({ open: 10, close: 15, startAs: "yang" });
        expect(lines[1]).toMatchObject({ open: 15, close: 9, changeTo: "yin", changePoint: 10 });
        expect(lines[2]).toMatchObject({ open: 9, close: 16, startAs: "yin", changeTo: "yang", changePoint: 15 });
        expect(lines[2].reverseAt).toBeCloseTo(16 - 1.5);
        expect(lines[0].from).toEqual(at(0));
        expect(lines.reduce((a, l) => a + l.volume, 0)).toBe(80);
    });

    it("percent and ATR reversal", () => {
        expect(kagi(bars).length).toBeGreaterThan(3);
        expect(kagi(bars, { reversal: 2, reversalType: "percent" }).length).toBeGreaterThan(3);
        expect(kagi([])).toEqual([]);
    });
});

describe("pointAndFigure", () => {
    it("builds X / O columns with box size and reversal", () => {
        const cols = pointAndFigure(series([10, 11, 13.2, 12.5, 9.8, 9, 12.4]), { boxSize: 1, reversal: 3 });
        expect(cols.map((c) => [c.direction, c.open, c.close, c.boxes.length])).toEqual([
            [1, 10, 13, 3],
            [-1, 12, 9, 3],
            [1, 10, 13, 3], // v1 semantics: reversal columns start one box away
        ]);
        expect(cols[0].boxes[0]).toMatchObject({ open: 10, close: 11 });
        expect(cols[1]).toMatchObject({ high: 12, low: 9, fromIndex: 4, toIndex: 4 });
    });

    it("works with ATR boxes and high/low source", () => {
        const cols = pointAndFigure(bars);
        expect(cols.length).toBeGreaterThan(2);
        cols.forEach((c, i) => i > 0 && expect(c.direction).toBe(-cols[i - 1].direction));
        expect(pointAndFigure([])).toEqual([]);
    });
});

describe("lineBreak", () => {
    it("three line break", () => {
        const lb = lineBreak(series([10, 11, 12, 13, 12.5, 9.5, 14]));
        expect(lb.map((b) => [b.open, b.close, b.direction])).toEqual([
            [10, 11, 1],
            [11, 12, 1],
            [12, 13, 1],
            [12, 9.5, -1], // breaks the lowest low of the last 3 lines (10); drawn from the last line's open
            [12, 14, 1], // breaks the high of the last 3 lines (13)
        ]);
        expect(lineBreak(series([10, 11, 12, 13, 12.5, 11.5]), { lines: 1 }).at(-1)).toMatchObject({
            open: 12,
            close: 11.5,
        });
        expect(lineBreak([])).toEqual([]);
    });
});
