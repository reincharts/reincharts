import * as React from "react";
import { mergeBar, mergeBars, sortBars, toChartBar } from "./bars";
import type { Resolution } from "./resolution";
import type { Bar, ChartBar, Datafeed, SymbolInfo } from "./types";

/** Options of `useDatafeed`. */
export interface UseDatafeedOptions {
    /** Symbol to load. */
    readonly symbol: string;
    /** Bar interval, e.g. "1", "60", "1D". */
    readonly resolution: Resolution;
    /** Bars requested by the first history call. Default 500. */
    readonly initialBars?: number;
    /** Bars requested per `loadMore()` page. Default 500. */
    readonly pageSize?: number;
    /** Subscribe to realtime bars when the feed supports it. Default true. */
    readonly realtime?: boolean;
    /** Set to false to pause loading (e.g. until a symbol is picked). Default true. */
    readonly enabled?: boolean;
}

/** State returned by `useDatafeed`. */
export interface UseDatafeedResult {
    /** Sorted, de-duplicated bars with `date` — pass straight to `<ChartCanvas data>`. */
    readonly data: readonly ChartBar[];
    /** Resolved symbol metadata (a minimal `{ symbol, name }` until / unless `resolveSymbol` answers). */
    readonly symbolInfo: SymbolInfo | undefined;
    /** True while the first history page loads. */
    readonly loading: boolean;
    /** True while an older page loads. */
    readonly loadingMore: boolean;
    /** Last error thrown by the feed. */
    readonly error: unknown;
    /** False once the feed returned `noData` (or nothing new) for older history. */
    readonly hasMore: boolean;
    /** Loads the previous page of history. Wire it to `<ChartCanvas onReachStart={loadMore}>`. Stable identity. */
    readonly loadMore: () => Promise<void>;
    /** Reloads everything from scratch (re-subscribes too). Stable identity. */
    readonly reset: () => void;
}

interface State {
    key: string;
    data: ChartBar[];
    symbolInfo: SymbolInfo | undefined;
    loading: boolean;
    loadingMore: boolean;
    error: unknown;
    hasMore: boolean;
}

const EMPTY: ChartBar[] = [];

const initial = (key: string, loading: boolean, symbol: string): State => ({
    key,
    data: EMPTY,
    symbolInfo: { symbol, name: symbol },
    loading,
    loadingMore: false,
    error: undefined,
    hasMore: false,
});

const prepare = (bars: readonly Bar[]) => sortBars(bars).map(toChartBar);

/**
 * Connects a `Datafeed` to a chart: loads history, merges realtime bars, paginates backwards,
 * resets on symbol / resolution change and ignores stale responses.
 *
 * ```tsx
 * const { data, loadMore } = useDatafeed(feed, { symbol: "AAPL", resolution: "1D" });
 * <ChartCanvas data={data} onReachStart={loadMore} resetKey={symbol + resolution}>…</ChartCanvas>
 * ```
 */
export function useDatafeed(datafeed: Datafeed, options: UseDatafeedOptions): UseDatafeedResult {
    const { symbol, resolution, initialBars = 500, pageSize = 500, realtime = true, enabled = true } = options;
    const [generation, setGeneration] = React.useState(0);
    const key = `${symbol}\u0000${resolution}\u0000${generation}`;
    const [state, setState] = React.useState<State>(() => initial(key, enabled, symbol));

    // everything loadMore needs, read through a ref so its identity stays stable
    const live = React.useRef({
        key,
        state,
        datafeed,
        symbol,
        resolution,
        pageSize,
        signal: undefined as AbortSignal | undefined,
        busy: false,
    });
    live.current.state = state;
    live.current.pageSize = pageSize;

    React.useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        Object.assign(live.current, { key, datafeed, symbol, resolution, signal, busy: false });
        const update = (fn: (s: State) => State) => {
            if (!signal.aborted) {
                setState((s) => (s.key === key ? fn(s) : s));
            }
        };
        setState((s) =>
            s.key === key && s.data === EMPTY && s.loading === enabled ? s : initial(key, enabled, symbol),
        );
        if (!enabled) {
            return () => controller.abort();
        }

        // realtime bars that arrive before history are buffered, then merged
        let pending: Bar[] | null = [];
        const onBar = (bar: Bar) => {
            if (pending) {
                pending.push(bar);
            } else {
                const next = toChartBar(bar);
                update((s) => {
                    const data = mergeBar(s.data, next);
                    return data === s.data ? s : { ...s, data };
                });
            }
        };
        const unsubscribe = realtime ? datafeed.subscribeBars?.(symbol, resolution, onBar) : undefined;

        datafeed
            .resolveSymbol?.(symbol)
            .then((symbolInfo) => update((s) => ({ ...s, symbolInfo })))
            .catch((error: unknown) => update((s) => ({ ...s, error })));

        datafeed
            .getBars({ symbol, resolution, to: Date.now(), countBack: initialBars, firstDataRequest: true, signal })
            .then(({ bars, noData }) => {
                let data = prepare(bars);
                for (const bar of pending ?? []) {
                    data = mergeBar(data, toChartBar(bar));
                }
                pending = null;
                update((s) => ({ ...s, data, loading: false, hasMore: !noData && data.length > 0 }));
            })
            .catch((error: unknown) => {
                pending = null;
                update((s) => ({ ...s, loading: false, error }));
            });

        return () => {
            controller.abort();
            unsubscribe?.();
        };
    }, [datafeed, symbol, resolution, initialBars, realtime, enabled, key]);

    const loadMore = React.useCallback(async () => {
        const ctx = live.current;
        const { state: s, key: k, signal } = ctx;
        if (ctx.busy || !signal || signal.aborted || s.key !== k || s.loading || !s.hasMore || s.data.length === 0) {
            return;
        }
        ctx.busy = true;
        const first = s.data[0].time;
        const update = (fn: (s: State) => State) => {
            if (!signal.aborted) {
                setState((prev) => (prev.key === k ? fn(prev) : prev));
            }
        };
        update((prev) => ({ ...prev, loadingMore: true }));
        try {
            const { bars, noData } = await ctx.datafeed.getBars({
                symbol: ctx.symbol,
                resolution: ctx.resolution,
                to: first,
                countBack: ctx.pageSize,
                signal,
            });
            const older = prepare(bars).filter((b) => b.time < first);
            update((prev) => ({
                ...prev,
                data: older.length > 0 ? mergeBars(older, prev.data) : prev.data,
                loadingMore: false,
                hasMore: !noData && older.length > 0,
            }));
        } catch (error) {
            update((prev) => ({ ...prev, loadingMore: false, error }));
        } finally {
            if (ctx.key === k) {
                ctx.busy = false;
            }
        }
    }, []);

    const reset = React.useCallback(() => setGeneration((g) => g + 1), []);

    const fallback = React.useMemo(() => initial(key, enabled, symbol), [key, enabled, symbol]);
    const current = state.key === key ? state : fallback;
    return {
        data: current.data,
        symbolInfo: current.symbolInfo,
        loading: current.loading,
        loadingMore: current.loadingMore,
        error: current.error,
        hasMore: current.hasMore,
        loadMore,
        reset,
    };
}
