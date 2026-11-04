import { aggregateBars, createMemoryDatafeed, createRandomDatafeed, nextBarTime, sliceBars, type Bar } from "../src";

const utc = Date.UTC;
const DAY = 86_400_000;
const daily = (count: number, start = utc(2024, 0, 1)): Bar[] =>
    Array.from({ length: count }, (_, i) => ({
        time: start + i * DAY,
        open: i,
        high: i + 1,
        low: i - 1,
        close: i + 0.5,
        volume: 10,
    }));

describe("sliceBars", () => {
    const bars = daily(10);
    const t = (i: number) => bars[i].time;

    it("returns the last countBack bars before `to` (exclusive)", () => {
        expect(
            sliceBars(bars, { symbol: "", resolution: "1D", to: t(5), countBack: 3 }).bars.map((b) => b.open),
        ).toEqual([2, 3, 4]);
        expect(
            sliceBars(bars, { symbol: "", resolution: "1D", to: t(5) + 1, countBack: 2 }).bars.map((b) => b.open),
        ).toEqual([4, 5]);
    });

    it("uses `from` when countBack is 0", () => {
        const r = sliceBars(bars, { symbol: "", resolution: "1D", from: t(2), to: t(4), countBack: 0 });
        expect(r.bars.map((b) => b.open)).toEqual([2, 3]);
    });

    it("flags noData when nothing is left", () => {
        expect(sliceBars(bars, { symbol: "", resolution: "1D", to: t(0), countBack: 5 })).toEqual({
            bars: [],
            noData: true,
        });
    });

    it("serves the latest bars on the first request regardless of `to`", () => {
        const r = sliceBars(bars, { symbol: "", resolution: "1D", to: 0, countBack: 2, firstDataRequest: true });
        expect(r.bars.map((b) => b.open)).toEqual([8, 9]);
    });
});

describe("createMemoryDatafeed", () => {
    it("pages through history and reports the end", async () => {
        const feed = createMemoryDatafeed({ AAA: daily(25) });
        const first = await feed.getBars({
            symbol: "AAA",
            resolution: "1D",
            to: Date.now(),
            countBack: 10,
            firstDataRequest: true,
        });
        expect(first.bars.map((b) => b.open)).toEqual([15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
        const second = await feed.getBars({ symbol: "AAA", resolution: "D", to: first.bars[0].time, countBack: 10 });
        expect(second.bars.map((b) => b.open)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
        const third = await feed.getBars({ symbol: "AAA", resolution: "1D", to: second.bars[0].time, countBack: 10 });
        expect(third.bars).toHaveLength(5);
        const fourth = await feed.getBars({ symbol: "AAA", resolution: "1D", to: third.bars[0].time, countBack: 10 });
        expect(fourth).toEqual({ bars: [], noData: true });
    });

    it("aggregates higher resolutions and refuses lower ones", async () => {
        const bars = daily(60);
        const feed = createMemoryDatafeed({ AAA: bars });
        const weeks = await feed.getBars({ symbol: "AAA", resolution: "1W", to: Infinity, countBack: 100 });
        expect(weeks.bars).toEqual(aggregateBars(bars, "1W"));
        expect(weeks.bars[0].time).toBe(utc(2024, 0, 1)); // a Monday
        const months = await feed.getBars({ symbol: "AAA", resolution: "1M", to: Infinity, countBack: 100 });
        expect(months.bars.map((b) => new Date(b.time).getUTCMonth())).toEqual([0, 1]);
        const minutes = await feed.getBars({ symbol: "AAA", resolution: "1", to: Infinity, countBack: 100 });
        expect(minutes.noData).toBe(true);
    });

    it("resolves and searches symbols, rejects unknown ones", async () => {
        const feed = createMemoryDatafeed(
            { AAPL: daily(2), MSFT: daily(2) },
            { symbols: { AAPL: { description: "Apple Inc.", exchange: "NASDAQ", pricePrecision: 2 } } },
        );
        expect(await feed.resolveSymbol!("AAPL")).toMatchObject({
            symbol: "AAPL",
            name: "AAPL",
            description: "Apple Inc.",
        });
        expect((await feed.searchSymbols!("apple")).map((s) => s.symbol)).toEqual(["AAPL"]);
        expect((await feed.searchSymbols!("")).map((s) => s.symbol)).toEqual(["AAPL", "MSFT"]);
        await expect(feed.resolveSymbol!("NOPE")).rejects.toThrow(/Unknown symbol/);
        await expect(feed.getBars({ symbol: "NOPE", resolution: "1D", to: 0, countBack: 1 })).rejects.toThrow(
            /Unknown/,
        );
    });

    it("pushBar merges and notifies subscribers per resolution", async () => {
        const feed = createMemoryDatafeed({ AAA: daily(3) });
        const onDaily = vi.fn();
        const onWeekly = vi.fn();
        const unsubscribe = feed.subscribeBars!("AAA", "1D", onDaily);
        feed.subscribeBars!("AAA", "1W", onWeekly);
        const update = { time: utc(2024, 0, 3), open: 2, high: 9, low: 1, close: 8, volume: 20 };
        feed.pushBar("AAA", update);
        expect(onDaily).toHaveBeenLastCalledWith(update);
        expect(onWeekly).toHaveBeenLastCalledWith({
            time: utc(2024, 0, 1),
            open: 0,
            high: 9,
            low: -1,
            close: 8,
            volume: 40,
        });
        expect(feed.getAllBars("AAA")).toHaveLength(3);
        feed.pushBar("AAA", { ...update, time: utc(2024, 0, 4) });
        expect(feed.getAllBars("AAA")).toHaveLength(4);
        unsubscribe();
        feed.pushBar("AAA", { ...update, time: utc(2024, 0, 5) });
        expect(onDaily).toHaveBeenCalledTimes(2);
        expect(onWeekly).toHaveBeenCalledTimes(3);
        feed.setBars("AAA", daily(1));
        expect(feed.getAllBars("AAA")).toHaveLength(1);
    });

    it("simulates latency", async () => {
        vi.useFakeTimers();
        try {
            const feed = createMemoryDatafeed({ AAA: daily(3) }, { latency: 200 });
            const done = vi.fn();
            feed.getBars({ symbol: "AAA", resolution: "1D", to: Infinity, countBack: 1 }).then(done);
            await vi.advanceTimersByTimeAsync(199);
            expect(done).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(1);
            expect(done).toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });
});

describe("createRandomDatafeed", () => {
    const NOW = utc(2024, 5, 14, 15, 30, 20);
    const make = (opts = {}) => createRandomDatafeed({ now: () => NOW, realtimeIntervalMs: 0, ...opts });

    it("is deterministic for a seed and differs across seeds / symbols", async () => {
        const req = { symbol: "DEMO", resolution: "60", to: NOW, countBack: 50, firstDataRequest: true };
        const a = await make().getBars(req);
        const b = await make().getBars(req);
        expect(a).toEqual(b);
        expect((await make({ seed: 2 }).getBars(req)).bars[0].close).not.toBe(a.bars[0].close);
        expect((await make().getBars({ ...req, symbol: "OTHER" })).bars[0].close).not.toBe(a.bars[0].close);
    });

    it("produces valid, contiguous OHLCV bars ending with the current (partial) bar", async () => {
        for (const resolution of ["1S", "1", "15", "60", "240", "1D", "1W", "1M"]) {
            const { bars } = await make().getBars({
                symbol: "DEMO",
                resolution,
                to: NOW,
                countBack: 120,
                firstDataRequest: true,
            });
            expect(bars).toHaveLength(120);
            for (let i = 0; i < bars.length; i++) {
                const b = bars[i];
                expect(b.high).toBeGreaterThanOrEqual(Math.max(b.open, b.close));
                expect(b.low).toBeLessThanOrEqual(Math.min(b.open, b.close));
                expect(b.low).toBeGreaterThan(0);
                expect(b.volume).toBeGreaterThanOrEqual(0);
                if (i > 0) {
                    expect(b.time).toBe(nextBarTime(bars[i - 1].time, resolution));
                    expect(b.open).toBe(bars[i - 1].close); // gapless walk
                }
            }
            expect(bars[bars.length - 1].time).toBeLessThanOrEqual(NOW);
            expect(nextBarTime(bars[bars.length - 1].time, resolution)).toBeGreaterThan(NOW);
        }
    });

    it("pages consistently (same bars whatever the page boundaries)", async () => {
        const feed = make();
        const all = await feed.getBars({
            symbol: "DEMO",
            resolution: "5",
            to: NOW,
            countBack: 300,
            firstDataRequest: true,
        });
        const page1 = await feed.getBars({
            symbol: "DEMO",
            resolution: "5",
            to: NOW,
            countBack: 100,
            firstDataRequest: true,
        });
        const page2 = await feed.getBars({ symbol: "DEMO", resolution: "5", to: page1.bars[0].time, countBack: 200 });
        expect([...page2.bars, ...page1.bars]).toEqual(all.bars);
    });

    it("is consistent across resolutions (same price at the same time)", async () => {
        const feed = make();
        const day = await feed.getBars({
            symbol: "DEMO",
            resolution: "1D",
            to: NOW,
            countBack: 2,
            firstDataRequest: true,
        });
        const hours = await feed.getBars({
            symbol: "DEMO",
            resolution: "60",
            to: NOW,
            countBack: 24,
            firstDataRequest: true,
        });
        const dayStart = day.bars[1].time;
        const firstHour = hours.bars.find((b) => b.time === dayStart)!;
        expect(firstHour.open).toBe(day.bars[1].open);
        expect(hours.bars[hours.bars.length - 1].close).toBe(day.bars[1].close);
        expect(feed.priceAt("DEMO", dayStart)).toBe(day.bars[1].open);
    });

    it("has roughly the requested daily volatility", async () => {
        const { bars } = await make({ volatility: 0.02 }).getBars({
            symbol: "DEMO",
            resolution: "1D",
            to: NOW,
            countBack: 2000,
            firstDataRequest: true,
        });
        const returns = bars.map((b) => Math.log(b.close / b.open));
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const std = Math.sqrt(returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length);
        expect(std).toBeGreaterThan(0.01);
        expect(std).toBeLessThan(0.04);
    });

    it("respects historyStart, `from` and startPrice", async () => {
        const feed = make({ historyStart: NOW - 10 * DAY, startPrice: (s: string) => (s === "BTC" ? 60_000 : 5) });
        const r = await feed.getBars({
            symbol: "BTC",
            resolution: "1D",
            to: NOW,
            countBack: 100,
            firstDataRequest: true,
        });
        expect(r.bars).toHaveLength(10);
        expect(r.bars[5].close).toBeGreaterThan(10_000);
        const end = await feed.getBars({ symbol: "BTC", resolution: "1D", to: r.bars[0].time, countBack: 100 });
        expect(end).toEqual({ bars: [], noData: true });
        const ranged = await feed.getBars({
            symbol: "X",
            resolution: "60",
            from: NOW - 5 * 3_600_000,
            to: NOW,
            countBack: 0,
        });
        expect(ranged.bars).toHaveLength(5);
        expect(ranged.bars[0].close).toBeLessThan(20);
    });

    it("never serves bars from the future", async () => {
        const r = await make().getBars({ symbol: "DEMO", resolution: "60", to: NOW + 10 * DAY, countBack: 5 });
        expect(r.bars[r.bars.length - 1].time).toBe(utc(2024, 5, 14, 15));
    });

    it("searches and resolves symbols", async () => {
        const feed = make({ symbols: ["AAA", { symbol: "BBB", name: "Bee", pricePrecision: 4 }] });
        expect((await feed.searchSymbols!("bee")).map((s) => s.symbol)).toEqual(["BBB"]);
        expect(await feed.searchSymbols!("")).toHaveLength(2);
        expect(await feed.resolveSymbol!("BBB")).toMatchObject({
            symbol: "BBB",
            name: "Bee",
            pricePrecision: 4,
            session: "24x7",
        });
        expect(await feed.resolveSymbol!("ZZZ")).toMatchObject({ symbol: "ZZZ", name: "ZZZ" });
        // prices are rounded to the symbol precision
        const price = feed.priceAt("BBB", NOW);
        expect(Math.round(price * 1e4) / 1e4).toBe(price);
        expect(Math.round(feed.priceAt("AAA", NOW) * 100) / 100).toBe(feed.priceAt("AAA", NOW));
    });

    describe("realtime ticker", () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(NOW);
        });
        afterEach(() => vi.useRealTimers());

        it("updates the last bar, then rolls a new one, matching history", async () => {
            const feed = createRandomDatafeed({ realtimeIntervalMs: 1000 });
            const onBar = vi.fn();
            const unsubscribe = feed.subscribeBars!("DEMO", "1", onBar);
            const start = utc(2024, 5, 14, 15, 30);
            await vi.advanceTimersByTimeAsync(1000);
            expect(onBar).toHaveBeenCalledTimes(1);
            const first: Bar = onBar.mock.calls[0][0];
            expect(first.time).toBe(start);
            await vi.advanceTimersByTimeAsync(5000);
            const bars: Bar[] = onBar.mock.calls.map((c) => c[0]);
            expect(bars.every((b) => b.time === start)).toBe(true);
            // the forming bar never loses its high / low and volume grows
            for (let i = 1; i < bars.length; i++) {
                expect(bars[i].high).toBeGreaterThanOrEqual(bars[i - 1].high);
                expect(bars[i].low).toBeLessThanOrEqual(bars[i - 1].low);
                expect(bars[i].volume!).toBeGreaterThanOrEqual(bars[i - 1].volume!);
            }
            onBar.mockClear();
            await vi.advanceTimersByTimeAsync(40_000); // crosses 15:31:00
            const times = [...new Set(onBar.mock.calls.map((c) => c[0].time))];
            expect(times).toEqual([start, start + 60_000]);
            // the finished bar equals what history serves for it
            const finished = onBar.mock.calls.filter((c) => c[0].time === start).pop()![0];
            const history = await feed.getBars({ symbol: "DEMO", resolution: "1", to: start + 60_000, countBack: 1 });
            expect(finished).toEqual(history.bars[0]);
            unsubscribe();
            onBar.mockClear();
            await vi.advanceTimersByTimeAsync(5000);
            expect(onBar).not.toHaveBeenCalled();
        });

        it("emits skipped bars when the clock runs faster than the updates", async () => {
            const feed = createRandomDatafeed({ realtimeIntervalMs: 1000, speed: 10 });
            const onBar = vi.fn();
            feed.subscribeBars!("DEMO", "1S", onBar);
            await vi.advanceTimersByTimeAsync(1000);
            const times = onBar.mock.calls.map((c) => c[0].time as number);
            expect(times).toEqual(Array.from({ length: 11 }, (_, i) => utc(2024, 5, 14, 15, 30, 20 + i)));
            expect(feed.now()).toBe(NOW + 10_000);
        });

        it("is disabled with realtimeIntervalMs: 0", async () => {
            const feed = createRandomDatafeed({ realtimeIntervalMs: 0 });
            const onBar = vi.fn();
            feed.subscribeBars!("DEMO", "1", onBar)();
            await vi.advanceTimersByTimeAsync(5000);
            expect(onBar).not.toHaveBeenCalled();
        });
    });
});
