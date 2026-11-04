import type { Resolution } from "./resolution";

/** One OHLCV bar. `time` is the bar open time in milliseconds since the Unix epoch (UTC). */
export interface Bar {
    /** Bar open time, ms epoch (UTC). */
    time: number;
    /** Open price. */
    open: number;
    /** High price. */
    high: number;
    /** Low price. */
    low: number;
    /** Close (last) price. */
    close: number;
    /** Traded volume. */
    volume?: number;
}

/** A bar ready for `<ChartCanvas data>`: `date` makes the chart detect a time axis automatically. */
export interface ChartBar extends Bar {
    /** `new Date(time)` — read by ChartCanvas' default x accessor. */
    date: Date;
}

/** A single trade / price update. */
export interface Tick {
    /** Trade time, ms epoch. */
    time: number;
    /** Trade price. */
    price: number;
    /** Trade size. */
    volume?: number;
}

/** Instrument metadata . */
export interface SymbolInfo {
    /** Ticker used in requests, e.g. "AAPL" or "BINANCE:BTCUSDT". */
    symbol: string;
    /** Display name. */
    name: string;
    /** Long description, e.g. "Apple Inc.". */
    description?: string;
    /** Exchange / venue, e.g. "NASDAQ". */
    exchange?: string;
    /** Instrument type: "stock", "crypto", "forex", "futures", "index"... */
    type?: string;
    /** Exchange IANA time zone, e.g. "America/New_York". */
    timezone?: string;
    /** Trading session ("24x7", "0930-1600"). */
    session?: string;
    /** Decimals shown for prices. */
    pricePrecision?: number;
    /** Decimals shown for volume. */
    volumePrecision?: number;
    /** Resolutions the feed can serve (all when omitted). */
    resolutions?: Resolution[];
}

/** History request: bars with `from <= time < to`, at least the `countBack` most recent ones before `to`. */
export interface GetBarsRequest {
    /** Symbol to load. */
    symbol: string;
    /** Bar interval. */
    resolution: Resolution;
    /** Inclusive lower bound (ms). Optional: `countBack` has priority. */
    from?: number;
    /** Exclusive upper bound (ms). */
    to: number;
    /** Number of bars wanted before `to`. */
    countBack: number;
    /** True for the first request of a symbol / resolution (feeds with their own clock may ignore `to`). */
    firstDataRequest?: boolean;
    /** Aborted when the request became stale (symbol changed, unmounted). Pass it to `fetch`. */
    signal?: AbortSignal;
}

/** History response. */
export interface GetBarsResult {
    /** Bars sorted by time ascending (unsorted / duplicated input is tolerated by `useDatafeed`). */
    bars: Bar[];
    /** True when there is no more history before `to` (stops pagination). */
    noData?: boolean;
}

/**
 * The adapter between your backend and the chart: history requests, realtime updates and symbol search.
 * Only `getBars` is required.
 */
export interface Datafeed {
    /** Loads historical bars. */
    getBars(request: GetBarsRequest): Promise<GetBarsResult>;
    /** Streams realtime bars (same `time` as the last bar = update, newer = new bar). Returns an unsubscribe function. */
    subscribeBars?(symbol: string, resolution: Resolution, onBar: (bar: Bar) => void): () => void;
    /** Symbol search for pickers. */
    searchSymbols?(query: string): Promise<SymbolInfo[]>;
    /** Resolves symbol metadata (precision, time zone...). */
    resolveSymbol?(symbol: string): Promise<SymbolInfo>;
}
