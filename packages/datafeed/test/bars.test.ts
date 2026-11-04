import {
    aggregateBars,
    alignSeries,
    applyTick,
    mergeBar,
    mergeBars,
    sortBars,
    ticksToBars,
    tickToBar,
    toChartBar,
    type Bar,
    type Tick,
} from "../src";

const utc = Date.UTC;
const MIN = 60_000;
const bar = (time: number, close = 10, extra: Partial<Bar> = {}): Bar => ({
    time,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 100,
    ...extra,
});

describe("toChartBar / sortBars", () => {
    it("adds a date once", () => {
        const b = toChartBar(bar(1000));
        expect(b.date).toEqual(new Date(1000));
        expect(toChartBar(b)).toBe(b);
        expect(toChartBar({ ...b, time: 2000 }).date).toEqual(new Date(2000));
    });

    it("returns clean input untouched", () => {
        const bars = [bar(1), bar(2), bar(3)];
        expect(sortBars(bars)).toBe(bars);
        expect(sortBars([])).toEqual([]);
    });

    it("sorts and de-duplicates (last occurrence wins)", () => {
        const a = bar(2, 1);
        const b = bar(2, 2);
        expect(sortBars([bar(3), a, bar(1), b]).map((x) => [x.time, x.close])).toEqual([
            [1, 10],
            [2, 2],
            [3, 10],
        ]);
    });
});

describe("mergeBar", () => {
    const data = [bar(1000), bar(2000)];

    it("appends newer bars without mutating", () => {
        const next = mergeBar(data, bar(3000, 11));
        expect(next.map((b) => b.time)).toEqual([1000, 2000, 3000]);
        expect(data).toHaveLength(2);
        expect(next[0]).toBe(data[0]);
    });

    it("replaces the last bar on the same time", () => {
        const update = bar(2000, 12);
        const next = mergeBar(data, update);
        expect(next).not.toBe(data);
        expect(next).toHaveLength(2);
        expect(next[1]).toBe(update);
        expect(data[1].close).toBe(10);
    });

    it("ignores older bars (same reference)", () => {
        expect(mergeBar(data, bar(1000, 99))).toBe(data);
        expect(mergeBar(data, bar(500))).toBe(data);
    });

    it("starts an empty series", () => {
        expect(mergeBar([], bar(1))).toEqual([bar(1)]);
    });
});

describe("mergeBars", () => {
    it("concatenates disjoint pages, reusing objects", () => {
        const older = [bar(1), bar(2)];
        const newer = [bar(3), bar(4)];
        const out = mergeBars(older, newer);
        expect(out.map((b) => b.time)).toEqual([1, 2, 3, 4]);
        expect(out[2]).toBe(newer[0]);
    });

    it("merges overlaps, the newer series wins", () => {
        const out = mergeBars([bar(1), bar(3, 1), bar(5)], [bar(2), bar(3, 2), bar(4)]);
        expect(out.map((b) => [b.time, b.close])).toEqual([
            [1, 10],
            [2, 10],
            [3, 2],
            [4, 10],
            [5, 10],
        ]);
    });

    it("handles empty sides", () => {
        const a = [bar(1)];
        expect(mergeBars([], a)).toBe(a);
        expect(mergeBars(a, [])).toBe(a);
    });
});

describe("aggregateBars", () => {
    const minutes = Array.from({ length: 180 }, (_, i) =>
        bar(utc(2024, 0, 2, 9) + i * MIN, 100 + i, {
            open: 100 + i - 0.5,
            high: 100 + i + 2,
            low: 100 + i - 2,
            volume: i,
        }),
    );

    it("builds hourly bars from minutes", () => {
        const hours = aggregateBars(minutes, "60");
        expect(hours).toHaveLength(3);
        expect(hours[0]).toEqual({
            time: utc(2024, 0, 2, 9),
            open: 99.5,
            high: 161,
            low: 98,
            close: 159,
            volume: (59 * 60) / 2,
        });
        expect(hours[2].time).toBe(utc(2024, 0, 2, 11));
        expect(hours[2].close).toBe(279);
    });

    it("aggregates the total volume and keeps volume undefined when absent", () => {
        expect(aggregateBars(minutes, "1D")[0].volume).toBe((179 * 180) / 2);
        const noVolume = aggregateBars([{ time: 0, open: 1, high: 2, low: 0, close: 1 }], "1D");
        expect(noVolume[0]).not.toHaveProperty("volume");
    });

    it("keeps a partial last bar and handles gaps", () => {
        const bars = [bar(utc(2024, 0, 1, 0, 0)), bar(utc(2024, 0, 1, 0, 3)), bar(utc(2024, 0, 1, 0, 11))];
        expect(aggregateBars(bars, "5").map((b) => b.time)).toEqual([utc(2024, 0, 1, 0, 0), utc(2024, 0, 1, 0, 10)]);
    });

    it("builds weekly bars starting on Monday, across a year boundary", () => {
        // daily bars Fri 2023-12-29 … Wed 2024-01-10
        const days = Array.from({ length: 13 }, (_, i) => bar(utc(2023, 11, 29) + i * 86_400_000, 10 + i));
        const weeks = aggregateBars(days, "1W");
        expect(weeks.map((w) => new Date(w.time).toISOString().slice(0, 10))).toEqual([
            "2023-12-25",
            "2024-01-01",
            "2024-01-08",
        ]);
        expect(weeks.map((w) => [w.open, w.close])).toEqual([
            [10, 12],
            [13, 19],
            [20, 22],
        ]);
        expect(aggregateBars(days, "1W", { weekStart: 0 }).map((w) => new Date(w.time).getUTCDay())).toEqual([0, 0, 0]);
    });

    it("builds monthly bars on calendar months (leap February)", () => {
        const days = Array.from({ length: 70 }, (_, i) => bar(utc(2024, 0, 20) + i * 86_400_000, i));
        const months = aggregateBars(days, "1M");
        expect(months.map((m) => new Date(m.time).toISOString().slice(0, 10))).toEqual([
            "2024-01-01",
            "2024-02-01",
            "2024-03-01",
        ]);
        expect(months[0].close).toBe(11); // Jan 31
        expect(months[1].open).toBe(12); // Feb 1
        expect(months[1].close).toBe(40); // Feb 29
        expect(months[2].open).toBe(41);
        const quarters = aggregateBars(days, "3M");
        expect(quarters).toHaveLength(1);
        expect(quarters[0].time).toBe(utc(2024, 0, 1));
    });

    it("aggregates in the exchange time zone", () => {
        // hourly bars around New York midnight (05:00 UTC in winter)
        const hours = Array.from({ length: 6 }, (_, i) => bar(utc(2024, 0, 15, 2) + i * 3_600_000, i));
        const days = aggregateBars(hours, "1D", { timeZone: "America/New_York" });
        expect(days.map((d) => d.time)).toEqual([utc(2024, 0, 14, 5), utc(2024, 0, 15, 5)]);
        expect(days.map((d) => [d.open, d.close])).toEqual([
            [0, 2],
            [3, 5],
        ]);
    });

    it("re-aggregation is consistent (1m → 5m → 15m equals 1m → 15m)", () => {
        expect(aggregateBars(aggregateBars(minutes, "5"), "15")).toEqual(aggregateBars(minutes, "15"));
    });

    it("returns [] for no input", () => {
        expect(aggregateBars([], "1D")).toEqual([]);
    });
});

describe("ticks → bars", () => {
    const t0 = utc(2024, 0, 1, 12);
    const ticks: Tick[] = [
        { time: t0 + 100, price: 10, volume: 1 },
        { time: t0 + 400, price: 12, volume: 2 },
        { time: t0 + 900, price: 9, volume: 3 },
        { time: t0 + 1200, price: 11, volume: 1 },
        { time: t0 + 5100, price: 13 },
    ];

    it("builds 1-second bars with gaps", () => {
        expect(ticksToBars(ticks, "1S")).toEqual([
            { time: t0, open: 10, high: 12, low: 9, close: 9, volume: 6 },
            { time: t0 + 1000, open: 11, high: 11, low: 11, close: 11, volume: 1 },
            { time: t0 + 5000, open: 13, high: 13, low: 13, close: 13 },
        ]);
    });

    it("builds 5-second and minute bars", () => {
        expect(ticksToBars(ticks, "5S").map((b) => [b.time, b.open, b.close, b.volume])).toEqual([
            [t0, 10, 11, 7],
            [t0 + 5000, 13, 13, undefined],
        ]);
        expect(ticksToBars(ticks, "1")).toEqual([{ time: t0, open: 10, high: 13, low: 9, close: 13, volume: 7 }]);
    });

    it("ignores ticks older than the current bar", () => {
        const out = ticksToBars([ticks[3], ticks[0], ticks[4]], "1S");
        expect(out.map((b) => b.time)).toEqual([t0 + 1000, t0 + 5000]);
    });

    it("tickToBar updates, starts or ignores", () => {
        const b = tickToBar(undefined, ticks[0], "1S");
        expect(b).toEqual({ time: t0, open: 10, high: 10, low: 10, close: 10, volume: 1 });
        expect(tickToBar(b, { time: t0 + 10, price: 8 }, "1S")).toEqual({ ...b, low: 8, close: 8 });
        expect(tickToBar(b, { time: t0 - 10, price: 8 }, "1S")).toBe(b);
    });

    it("applyTick merges realtime ticks into a series", () => {
        let data: Bar[] = [];
        for (const tick of ticks) {
            data = applyTick(data, tick, "1S");
        }
        expect(data).toEqual(ticksToBars(ticks, "1S"));
        expect(applyTick(data, { time: t0, price: 1 }, "1S")).toBe(data);
    });
});

describe("alignSeries", () => {
    const base = [bar(1, 1), bar(2, 2), bar(3, 3), bar(5, 5)];
    const other = [bar(0, 100), bar(2, 200), bar(4, 400), bar(5, 500)];

    it("attaches the matching bar of the other series by time", () => {
        const out = alignSeries(base, other, "cmp");
        expect(out.map((d) => d.cmp?.close)).toEqual([undefined, 200, undefined, 500]);
        expect(out[1].close).toBe(2);
        expect(out[1].cmp).toBe(other[1]);
        expect(base[1]).not.toHaveProperty("cmp");
    });

    it("forward-fills with fill: previous", () => {
        const out = alignSeries(base, other, "cmp", { fill: "previous" });
        expect(out.map((d) => d.cmp?.close)).toEqual([100, 200, 200, 500]);
    });

    it("handles empty series", () => {
        expect(alignSeries([], other, "x")).toEqual([]);
        expect(alignSeries(base, [], "x").every((d) => d.x === undefined)).toBe(true);
    });
});
