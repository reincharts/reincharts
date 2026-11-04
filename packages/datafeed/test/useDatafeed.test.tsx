import { act, renderHook, waitFor } from "@testing-library/react";
import {
    createMemoryDatafeed,
    useDatafeed,
    type Bar,
    type Datafeed,
    type GetBarsRequest,
    type GetBarsResult,
} from "../src";

const DAY = 86_400_000;
const START = Date.UTC(2024, 0, 1);
const daily = (count: number, price = 10): Bar[] =>
    Array.from({ length: count }, (_, i) => ({
        time: START + i * DAY,
        open: price,
        high: price + 1,
        low: price - 1,
        close: price + i,
    }));

/** A feed whose getBars calls resolve only when the test says so. */
function controlledFeed() {
    const calls: Array<{ request: GetBarsRequest; resolve: (r: GetBarsResult) => void; reject: (e: unknown) => void }> =
        [];
    const listeners = new Set<(bar: Bar) => void>();
    const unsubscribed = vi.fn();
    const feed: Datafeed = {
        getBars: (request) => new Promise((resolve, reject) => calls.push({ request, resolve, reject })),
        subscribeBars: (_symbol, _resolution, onBar) => {
            listeners.add(onBar);
            return () => {
                listeners.delete(onBar);
                unsubscribed();
            };
        },
    };
    const push = (bar: Bar) => listeners.forEach((l) => l(bar));
    return { feed, calls, push, listeners, unsubscribed };
}

describe("useDatafeed", () => {
    it("loads history, resolves the symbol and returns chart-ready bars", async () => {
        const feed = createMemoryDatafeed({ AAA: daily(30) }, { symbols: { AAA: { description: "Triple A" } } });
        const { result } = renderHook(() => useDatafeed(feed, { symbol: "AAA", resolution: "1D", initialBars: 10 }));
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toEqual([]);
        expect(result.current.symbolInfo).toEqual({ symbol: "AAA", name: "AAA" });
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toHaveLength(10);
        expect(result.current.data[0].time).toBe(START + 20 * DAY);
        expect(result.current.data[0].date).toEqual(new Date(START + 20 * DAY));
        expect(result.current.hasMore).toBe(true);
        expect(result.current.error).toBeUndefined();
        await waitFor(() => expect(result.current.symbolInfo?.description).toBe("Triple A"));
    });

    it("sorts and de-duplicates unsorted feed output", async () => {
        const bars = daily(3);
        const feed: Datafeed = {
            getBars: async () => ({ bars: [bars[2], bars[0], bars[1], { ...bars[0], close: 99 }] }),
        };
        const { result } = renderHook(() => useDatafeed(feed, { symbol: "X", resolution: "1D" }));
        await waitFor(() => expect(result.current.data).toHaveLength(3));
        expect(result.current.data.map((b) => b.close)).toEqual([99, 11, 12]);
    });

    it("merges realtime bars: update last, append newer, ignore older", async () => {
        const { feed, calls, push } = controlledFeed();
        const { result } = renderHook(() => useDatafeed(feed, { symbol: "X", resolution: "1D" }));
        // a bar arriving before history is buffered, then merged
        act(() => push({ ...daily(4)[3], close: 50 }));
        await act(async () => calls[0].resolve({ bars: daily(3) }));
        expect(result.current.data.map((b) => b.close)).toEqual([10, 11, 12, 50]);

        act(() => push({ ...daily(4)[3], close: 51 }));
        expect(result.current.data.map((b) => b.close)).toEqual([10, 11, 12, 51]);
        expect(result.current.data[3].date).toBeInstanceOf(Date);

        const before = result.current.data;
        act(() => push(daily(2)[1]));
        expect(result.current.data).toBe(before);

        act(() => push({ ...daily(5)[4], close: 60 }));
        expect(result.current.data.map((b) => b.close)).toEqual([10, 11, 12, 51, 60]);
    });

    it("paginates backwards with loadMore until noData", async () => {
        const feed = createMemoryDatafeed({ AAA: daily(25) });
        const spy = vi.spyOn(feed, "getBars");
        const { result } = renderHook(() =>
            useDatafeed(feed, { symbol: "AAA", resolution: "1D", initialBars: 10, pageSize: 10 }),
        );
        await waitFor(() => expect(result.current.data).toHaveLength(10));
        const loadMore = result.current.loadMore;

        await act(() => result.current.loadMore());
        expect(result.current.data).toHaveLength(20);
        expect(result.current.data[0].time).toBe(START + 5 * DAY);
        expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ to: START + 15 * DAY, countBack: 10 }));
        expect(result.current.hasMore).toBe(true);
        expect(result.current.loadMore).toBe(loadMore); // stable identity for onReachStart

        await act(() => result.current.loadMore());
        expect(result.current.data).toHaveLength(25);
        await act(() => result.current.loadMore());
        expect(result.current.hasMore).toBe(false);
        expect(result.current.data).toHaveLength(25);

        const count = spy.mock.calls.length;
        await act(() => result.current.loadMore());
        expect(spy).toHaveBeenCalledTimes(count); // no request once exhausted
        expect(result.current.data.every((b, i, a) => i === 0 || b.time > a[i - 1].time)).toBe(true);
    });

    it("ignores concurrent loadMore calls and overlapping pages", async () => {
        const { feed, calls } = controlledFeed();
        const { result } = renderHook(() => useDatafeed(feed, { symbol: "X", resolution: "1D" }));
        await act(async () => calls[0].resolve({ bars: daily(10).slice(5) }));
        let p1!: Promise<void>;
        act(() => {
            p1 = result.current.loadMore();
            void result.current.loadMore();
        });
        expect(calls).toHaveLength(2);
        expect(result.current.loadingMore).toBe(true);
        // the page overlaps loaded data: duplicates are dropped
        await act(async () => {
            calls[1].resolve({ bars: daily(7) });
            await p1;
        });
        expect(result.current.loadingMore).toBe(false);
        expect(result.current.data.map((b) => b.time)).toEqual(daily(10).map((b) => b.time));
    });

    it("stops paginating when a page brings nothing older", async () => {
        const { feed, calls } = controlledFeed();
        const { result } = renderHook(() => useDatafeed(feed, { symbol: "X", resolution: "1D" }));
        await act(async () => calls[0].resolve({ bars: daily(3) }));
        let p!: Promise<void>;
        act(() => {
            p = result.current.loadMore();
        });
        await act(async () => {
            calls[1].resolve({ bars: daily(3) });
            await p;
        });
        expect(result.current.hasMore).toBe(false);
    });

    it("resets on symbol / resolution change and ignores stale responses", async () => {
        const { feed, calls, unsubscribed } = controlledFeed();
        const { result, rerender } = renderHook(
            (props: { symbol: string; resolution: string }) => useDatafeed(feed, props),
            {
                initialProps: { symbol: "A", resolution: "1D" },
            },
        );
        expect(calls[0].request).toMatchObject({
            symbol: "A",
            resolution: "1D",
            firstDataRequest: true,
            countBack: 500,
        });

        rerender({ symbol: "B", resolution: "1D" });
        expect(result.current.loading).toBe(true);
        expect(result.current.symbolInfo?.symbol).toBe("B");
        expect(calls[0].request.signal?.aborted).toBe(true);
        expect(unsubscribed).toHaveBeenCalledTimes(1);

        // the stale response for A arrives late: ignored
        await act(async () => calls[0].resolve({ bars: daily(3, 1) }));
        expect(result.current.data).toEqual([]);
        expect(result.current.loading).toBe(true);

        await act(async () => calls[1].resolve({ bars: daily(2, 2) }));
        expect(result.current.data.map((b) => b.open)).toEqual([2, 2]);

        // a loaded symbol is cleared immediately (same render) when the resolution changes
        rerender({ symbol: "B", resolution: "60" });
        expect(result.current.data).toEqual([]);
        expect(calls[2].request.resolution).toBe("60");
        expect(calls[1].request.signal?.aborted).toBe(true);
    });

    it("ignores a stale loadMore page after a symbol change", async () => {
        const { feed, calls } = controlledFeed();
        const { result, rerender } = renderHook(({ symbol }) => useDatafeed(feed, { symbol, resolution: "1D" }), {
            initialProps: { symbol: "A" },
        });
        await act(async () => calls[0].resolve({ bars: daily(10).slice(5) }));
        let p!: Promise<void>;
        act(() => {
            p = result.current.loadMore();
        });
        rerender({ symbol: "B" });
        await act(async () => calls[2].resolve({ bars: daily(2, 7) }));
        await act(async () => {
            calls[1].resolve({ bars: daily(5) });
            await p;
        });
        expect(result.current.data.map((b) => b.open)).toEqual([7, 7]);
        // and the new symbol can paginate (busy flag was reset)
        act(() => {
            void result.current.loadMore();
        });
        expect(calls[3].request).toMatchObject({ symbol: "B", to: START });
    });

    it("reports errors (history, loadMore, resolveSymbol) and recovers with reset", async () => {
        let fail = true;
        const feed: Datafeed = {
            getBars: async ({ firstDataRequest }) => {
                if (fail) {
                    throw new Error("boom");
                }
                if (!firstDataRequest) {
                    throw new Error("page");
                }
                return { bars: daily(3) };
            },
            resolveSymbol: async () => {
                throw new Error("unknown");
            },
        };
        const { result } = renderHook(() => useDatafeed(feed, { symbol: "X", resolution: "1D" }));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect((result.current.error as Error).message).toMatch(/boom|unknown/);
        expect(result.current.data).toEqual([]);
        expect(result.current.hasMore).toBe(false);

        fail = false;
        act(() => result.current.reset());
        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.data).toHaveLength(3));
        await waitFor(() => expect((result.current.error as Error)?.message).toBe("unknown"));
        await act(() => result.current.loadMore());
        await waitFor(() => expect((result.current.error as Error)?.message).toBe("page"));
        expect(result.current.data).toHaveLength(3);
        expect(result.current.loadingMore).toBe(false);
    });

    it("unsubscribes and aborts on unmount, and supports enabled / realtime flags", async () => {
        const { feed, calls, listeners, unsubscribed } = controlledFeed();
        const { unmount } = renderHook(() => useDatafeed(feed, { symbol: "X", resolution: "1D" }));
        expect(listeners.size).toBe(1);
        unmount();
        expect(unsubscribed).toHaveBeenCalledTimes(1);
        expect(listeners.size).toBe(0);
        expect(calls[0].request.signal?.aborted).toBe(true);

        const off = renderHook(() => useDatafeed(feed, { symbol: "X", resolution: "1D", enabled: false }));
        expect(off.result.current.loading).toBe(false);
        expect(calls).toHaveLength(1);
        off.unmount();

        renderHook(() => useDatafeed(feed, { symbol: "X", resolution: "1D", realtime: false }));
        expect(listeners.size).toBe(0);
        expect(calls).toHaveLength(2);
    });

    it("streams the random feed end to end", async () => {
        vi.useFakeTimers();
        try {
            vi.setSystemTime(Date.UTC(2024, 5, 14, 15, 30, 20));
            const { createRandomDatafeed } = await import("../src");
            const feed = createRandomDatafeed({ realtimeIntervalMs: 1000 });
            const { result } = renderHook(() =>
                useDatafeed(feed, { symbol: "DEMO", resolution: "1", initialBars: 100 }),
            );
            await act(() => vi.advanceTimersByTimeAsync(0));
            expect(result.current.data).toHaveLength(100);
            const last = result.current.data[99];
            await act(() => vi.advanceTimersByTimeAsync(45_000));
            expect(result.current.data).toHaveLength(101);
            expect(result.current.data[99].time).toBe(last.time);
            expect(result.current.data[100].time).toBe(last.time + 60_000);
        } finally {
            vi.useRealTimers();
        }
    });
});
