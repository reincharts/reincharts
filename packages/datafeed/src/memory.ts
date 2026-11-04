import { aggregateBars, mergeBar, sortBars } from "./bars";
import { normalizeResolution, resolutionToMs, type AlignOptions, type Resolution } from "./resolution";
import type { Bar, Datafeed, GetBarsRequest, GetBarsResult, SymbolInfo } from "./types";

/** Options of `createMemoryDatafeed`. */
export interface MemoryDatafeedOptions extends AlignOptions {
    /** Resolution of the provided bars. Higher resolutions are aggregated on demand. Default "1D". */
    readonly resolution?: Resolution;
    /** Extra metadata per symbol (merged into the resolved `SymbolInfo`). */
    readonly symbols?: Record<string, Partial<SymbolInfo>>;
    /** Simulated latency of `getBars` in ms (handy to demo loading states). Default 0. */
    readonly latency?: number;
}

/** A `Datafeed` over in-memory arrays, with `pushBar` to simulate realtime updates. */
export interface MemoryDatafeed extends Datafeed {
    /** Merges a realtime bar (base resolution) into the stored data and notifies subscribers. */
    pushBar(symbol: string, bar: Bar): void;
    /** Replaces the stored bars of a symbol (base resolution). */
    setBars(symbol: string, bars: readonly Bar[]): void;
    /** Stored bars of a symbol at its base resolution. */
    getAllBars(symbol: string): readonly Bar[];
}

/** Returns bars with `time < to`: the last `countBack` ones, or those `>= from` when `countBack` is 0. */
export function sliceBars(
    bars: readonly Bar[],
    { from, to, countBack, firstDataRequest }: GetBarsRequest,
): GetBarsResult {
    let end = bars.length;
    if (!firstDataRequest) {
        let lo = 0;
        while (lo < end) {
            const mid = (lo + end) >> 1;
            if (bars[mid].time < to) {
                lo = mid + 1;
            } else {
                end = mid;
            }
        }
    }
    let begin = countBack > 0 ? Math.max(0, end - countBack) : 0;
    if (countBack <= 0 && from !== undefined) {
        while (begin < end && bars[begin].time < from) {
            begin++;
        }
    }
    const out = bars.slice(begin, end);
    return out.length === 0 ? { bars: out, noData: true } : { bars: out };
}

/**
 * A datafeed serving in-memory bars, e.g. `parseCsv(text)` output. Requests for a higher resolution than
 * `options.resolution` are aggregated (weekly / monthly aligned); lower resolutions return no data.
 */
export function createMemoryDatafeed(
    barsBySymbol: Record<string, readonly Bar[]>,
    options: MemoryDatafeedOptions = {},
): MemoryDatafeed {
    const base = normalizeResolution(options.resolution ?? "1D");
    const baseMs = resolutionToMs(base);
    const store = new Map<string, readonly Bar[]>();
    const aggregated = new Map<string, readonly Bar[]>();
    const listeners = new Map<string, Set<{ resolution: Resolution; onBar: (bar: Bar) => void }>>();
    for (const [symbol, bars] of Object.entries(barsBySymbol)) {
        store.set(symbol, sortBars(bars));
    }

    const barsFor = (symbol: string, resolution: Resolution): readonly Bar[] | undefined => {
        const bars = store.get(symbol);
        const res = normalizeResolution(resolution);
        if (!bars || res === base) {
            return bars;
        }
        if (resolutionToMs(res) < baseMs) {
            return [];
        }
        const key = `${symbol}|${res}`;
        let out = aggregated.get(key);
        if (!out) {
            out = aggregateBars(bars, res, options);
            aggregated.set(key, out);
        }
        return out;
    };

    const info = (symbol: string): SymbolInfo => ({
        symbol,
        name: symbol,
        session: "24x7",
        timezone: options.timeZone ?? "UTC",
        ...options.symbols?.[symbol],
    });

    const delay = () => (options.latency ? new Promise((r) => setTimeout(r, options.latency)) : Promise.resolve());

    const invalidate = (symbol: string) => {
        for (const key of [...aggregated.keys()]) {
            if (key.startsWith(`${symbol}|`)) {
                aggregated.delete(key);
            }
        }
    };

    return {
        async getBars(request) {
            await delay();
            const bars = barsFor(request.symbol, request.resolution);
            if (!bars) {
                throw new Error(`Unknown symbol "${request.symbol}"`);
            }
            return sliceBars(bars, request);
        },
        subscribeBars(symbol, resolution, onBar) {
            let set = listeners.get(symbol);
            if (!set) {
                set = new Set();
                listeners.set(symbol, set);
            }
            const entry = { resolution, onBar };
            set.add(entry);
            return () => {
                set.delete(entry);
            };
        },
        async searchSymbols(query) {
            const q = query.trim().toLowerCase();
            return [...store.keys()]
                .map(info)
                .filter((s) => !q || `${s.symbol} ${s.name} ${s.description ?? ""}`.toLowerCase().includes(q));
        },
        async resolveSymbol(symbol) {
            if (!store.has(symbol)) {
                throw new Error(`Unknown symbol "${symbol}"`);
            }
            return info(symbol);
        },
        pushBar(symbol, bar) {
            store.set(symbol, mergeBar(store.get(symbol) ?? [], bar));
            invalidate(symbol);
            for (const { resolution, onBar } of listeners.get(symbol) ?? []) {
                const bars = barsFor(symbol, resolution);
                const last = bars?.[bars.length - 1];
                if (last) {
                    onBar(last);
                }
            }
        },
        setBars(symbol, bars) {
            store.set(symbol, sortBars(bars));
            invalidate(symbol);
        },
        getAllBars(symbol) {
            return store.get(symbol) ?? [];
        },
    };
}
