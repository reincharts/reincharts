import { act, renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryDatafeed, mergeBars, useBarReplay, useDatafeed, type Bar } from "../src";

const bars = (count: number, offset = 0): Bar[] =>
    Array.from({ length: count }, (_, i) => ({
        time: (i + offset) * 1000,
        open: 1,
        high: 2,
        low: 0,
        close: i + offset,
    }));

describe("useBarReplay", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("shows data up to the start index (default: middle, negative from the end)", () => {
        const data = bars(10);
        expect(renderHook(() => useBarReplay(data)).result.current.index).toBe(4);
        expect(renderHook(() => useBarReplay(data, { startIndex: 2 })).result.current.data).toEqual(data.slice(0, 3));
        expect(renderHook(() => useBarReplay(data, { startIndex: -3 })).result.current.index).toBe(7);
        expect(renderHook(() => useBarReplay(data, { startIndex: 99 })).result.current.atEnd).toBe(true);
    });

    it("steps forward / back within bounds", () => {
        const data = bars(5);
        const { result } = renderHook(() => useBarReplay(data, { startIndex: 1 }));
        act(() => result.current.step());
        expect(result.current.index).toBe(2);
        act(() => result.current.step(10));
        expect(result.current.index).toBe(4);
        expect(result.current.atEnd).toBe(true);
        act(() => result.current.stepBack(2));
        expect(result.current.index).toBe(2);
        expect(result.current.data).toHaveLength(3);
        act(() => result.current.stepBack(10));
        expect(result.current.index).toBe(0);
    });

    it("plays at `speed` bars per second and stops at the end", () => {
        const data = bars(6);
        const { result } = renderHook(() => useBarReplay(data, { startIndex: 0, speed: 2 }));
        act(() => result.current.play());
        expect(result.current.playing).toBe(true);
        act(() => vi.advanceTimersByTime(1000));
        expect(result.current.index).toBe(2);
        act(() => result.current.setSpeed(4));
        act(() => vi.advanceTimersByTime(500));
        expect(result.current.index).toBe(4);
        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.index).toBe(5);
        expect(result.current.playing).toBe(false);
        // play at the end restarts from the start index
        act(() => result.current.play());
        expect(result.current.index).toBe(0);
        expect(result.current.playing).toBe(true);
    });

    it("pause / toggle / setStart / reset", () => {
        const data = bars(10);
        const { result } = renderHook(() => useBarReplay(data, { startIndex: 3, autoPlay: true }));
        expect(result.current.playing).toBe(true);
        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.index).toBe(5);
        act(() => result.current.toggle());
        expect(result.current.playing).toBe(false);
        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.index).toBe(5);
        act(() => result.current.toggle());
        expect(result.current.playing).toBe(true);
        act(() => result.current.pause());
        act(() => result.current.reset());
        expect(result.current.index).toBe(3);
        act(() => result.current.setStart(-2));
        expect(result.current.index).toBe(8);
        act(() => result.current.step());
        act(() => result.current.reset());
        expect(result.current.index).toBe(8);
    });

    it("keeps the cursor on the same bar when history is prepended and follows appends", () => {
        const initial = bars(10, 10);
        const { result, rerender } = renderHook(({ data }) => useBarReplay(data, { startIndex: 4 }), {
            initialProps: { data: initial },
        });
        expect(result.current.data[result.current.index].close).toBe(14);
        const more = mergeBars(bars(10), initial);
        rerender({ data: more });
        expect(result.current.index).toBe(14);
        expect(result.current.data[result.current.index].close).toBe(14);
        act(() => result.current.reset());
        expect(result.current.index).toBe(14);
        rerender({ data: [...more, ...bars(1, 20)] });
        expect(result.current.index).toBe(14);
        act(() => result.current.step(100));
        expect(result.current.index).toBe(20);
    });

    it("resolves the start index once async data arrives", () => {
        const { result, rerender } = renderHook(({ data }) => useBarReplay(data, { startIndex: -5 }), {
            initialProps: { data: [] as Bar[] },
        });
        expect(result.current.data).toEqual([]);
        expect(result.current.index).toBe(-1);
        rerender({ data: bars(20) });
        expect(result.current.index).toBe(15);
        expect(result.current.data).toHaveLength(16);
    });
});

describe("useDatafeed under StrictMode", () => {
    it("loads once into a consistent state", async () => {
        const feed = createMemoryDatafeed(
            { A: bars(5).map((b) => ({ ...b, time: b.time + Date.UTC(2024, 0, 1) })) },
            { resolution: "1S" },
        );
        const { result } = renderHook(() => useDatafeed(feed, { symbol: "A", resolution: "1S" }), {
            wrapper: StrictMode,
        });
        await waitFor(() => expect(result.current.data).toHaveLength(5));
        expect(result.current.loading).toBe(false);
    });
});
