import { alignTime, DAY, nextBarTime, SECOND, type Resolution } from "./resolution";
import type { Bar, Datafeed, GetBarsResult, SymbolInfo } from "./types";

/** Options of `createRandomDatafeed`. */
export interface RandomDatafeedOptions {
    /** Symbols listed by `searchSymbols` (any other symbol still works). Default `["DEMO"]`. */
    readonly symbols?: ReadonlyArray<string | SymbolInfo>;
    /** Random seed: same seed + symbol = same prices, on every resolution. Default 1. */
    readonly seed?: number;
    /** Price level the walk oscillates around. Number or per-symbol function. Default 100. */
    readonly startPrice?: number | ((symbol: string) => number);
    /** Approximate daily volatility (std of daily log returns). Default 0.02. */
    readonly volatility?: number;
    /** Average daily volume. Default 1 000 000. */
    readonly volume?: number;
    /** Realtime update period in ms; 0 disables realtime. Default 1000. */
    readonly realtimeIntervalMs?: number;
    /** Simulated clock speed (60 = one minute of market time per second). Default 1. */
    readonly speed?: number;
    /** Clock source (ms epoch). Pass a constant for fully reproducible output. Default `Date.now`. */
    readonly now?: () => number;
    /** Oldest bar time served; earlier requests return `noData`. Default 2000-01-01 UTC. */
    readonly historyStart?: number;
    /** Simulated latency of `getBars` in ms. Default 0. */
    readonly latency?: number;
}

/** A demo `Datafeed` with deterministic history and a simulated realtime ticker. */
export interface RandomDatafeed extends Datafeed {
    /** Current simulated time (ms). */
    now(): number;
    /** Deterministic price of a symbol at a time. */
    priceAt(symbol: string, time: number): number;
    /** Bar starting at `time` (aligned), partial when it contains the current time. */
    barAt(symbol: string, resolution: Resolution, time: number): Bar;
}

// ---------------------------------------------------------------- deterministic fractal noise

const fmix = (h: number) => {
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
};

/** Uniform value in [-1, 1] for an integer lattice point. */
const lattice = (seed: number, octave: number, k: number) => {
    const lo = k >>> 0;
    const hi = Math.floor(k / 4294967296) | 0;
    const h = fmix(fmix(fmix(seed ^ Math.imul(octave + 1, 0x9e3779b1)) ^ lo) ^ hi);
    return (h / 4294967296) * 2 - 1;
};

const hashString = (s: string) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    }
    return h >>> 0;
};

const OCTAVES = 27; // 1 second … ~2 years
const SCALES = Array.from({ length: OCTAVES }, (_, k) => SECOND * 2 ** k);

/** Sum of value-noise octaves with amplitude ∝ √scale: a smooth, seekable Brownian-like path. */
const fractal = (seed: number, time: number, amplitudes: readonly number[]) => {
    let sum = 0;
    for (let o = 0; o < OCTAVES; o++) {
        const x = time / SCALES[o];
        const k = Math.floor(x);
        const f = x - k;
        const s = f * f * (3 - 2 * f);
        const a = lattice(seed, o, k);
        sum += amplitudes[o] * (a + (lattice(seed, o, k + 1) - a) * s);
    }
    return sum;
};

const SAMPLES = 12;

/**
 * A browser-only demo / test feed: deterministic random-walk prices for any symbol and resolution
 * (open / close consistent across resolutions and pages) plus a realtime ticker that updates the last bar and rolls new ones.
 */
export function createRandomDatafeed(options: RandomDatafeedOptions = {}): RandomDatafeed {
    const {
        seed = 1,
        startPrice = 100,
        volatility = 0.02,
        volume = 1_000_000,
        realtimeIntervalMs = 1000,
        speed = 1,
        historyStart = Date.UTC(2000, 0, 1),
        latency = 0,
    } = options;
    const clock = options.now ?? Date.now;
    const origin = clock();
    const now = () => (speed === 1 ? clock() : origin + (clock() - origin) * speed);
    const amplitudes = SCALES.map((scale) => volatility * 0.7 * Math.sqrt(scale / DAY));
    const infos = (options.symbols ?? ["DEMO"]).map((s) => (typeof s === "string" ? { symbol: s, name: s } : s));

    const info = (symbol: string): SymbolInfo => ({
        name: symbol,
        description: `${symbol} (random walk)`,
        exchange: "DEMO",
        type: "crypto",
        timezone: "UTC",
        session: "24x7",
        pricePrecision: 2,
        volumePrecision: 0,
        ...infos.find((s) => s.symbol === symbol),
        symbol,
    });

    const seeds = new Map<string, { seed: number; base: number; factor: number }>();
    const symbolState = (symbol: string) => {
        let s = seeds.get(symbol);
        if (!s) {
            const precision = info(symbol).pricePrecision ?? 2;
            s = {
                seed: fmix(seed ^ hashString(symbol)),
                base: typeof startPrice === "function" ? startPrice(symbol) : startPrice,
                factor: 10 ** precision,
            };
            seeds.set(symbol, s);
        }
        return s;
    };

    const priceAt = (symbol: string, time: number) => {
        const s = symbolState(symbol);
        return Math.round(s.base * Math.exp(fractal(s.seed, time, amplitudes)) * s.factor) / s.factor;
    };

    const barAt = (symbol: string, resolution: Resolution, time: number, current = now()): Bar => {
        const start = alignTime(time, resolution);
        const end = nextBarTime(start, resolution);
        const last = Math.min(end, Math.max(start, current));
        const open = priceAt(symbol, start);
        const close = priceAt(symbol, last);
        let high = Math.max(open, close);
        let low = Math.min(open, close);
        const step = (end - start) / SAMPLES;
        for (let j = 1; j < SAMPLES && start + j * step < last; j++) {
            const p = priceAt(symbol, start + j * step);
            high = Math.max(high, p);
            low = Math.min(low, p);
        }
        const s = symbolState(symbol);
        const k = Math.floor(start / SECOND);
        const u = (lattice(s.seed, 99, k) + 1) / 2;
        const elapsed = (last - start) / (end - start);
        // intrabar spikes the smooth path misses; they only grow while the bar forms
        const wick = volatility * Math.sqrt((end - start) / DAY) * Math.sqrt(elapsed) * 0.5;
        high = Math.round(high * (1 + wick * Math.abs(lattice(s.seed, 97, k))) * s.factor) / s.factor;
        low = Math.round(low * (1 - wick * Math.abs(lattice(s.seed, 98, k))) * s.factor) / s.factor;
        const move = Math.abs(Math.log(close / open)) / Math.max(volatility, 1e-9);
        const full = volume * ((end - start) / DAY) * (0.4 + 1.2 * u) * (1 + 0.8 * Math.min(move, 4));
        return { time: start, open, high, low, close, volume: Math.round(full * elapsed) };
    };

    const delay = () => (latency ? new Promise((r) => setTimeout(r, latency)) : Promise.resolve());

    return {
        now,
        priceAt,
        barAt: (symbol, resolution, time) => barAt(symbol, resolution, time),
        async getBars({ symbol, resolution, from, to, countBack, firstDataRequest }): Promise<GetBarsResult> {
            await delay();
            const current = now();
            const newest = alignTime(current, resolution);
            let t = firstDataRequest ? newest : Math.min(newest, alignTime(to - 1, resolution));
            const bars: Bar[] = [];
            const limit = countBack > 0 ? countBack : 100_000;
            while (bars.length < limit && t >= historyStart && (countBack > 0 || from === undefined || t >= from)) {
                bars.push(barAt(symbol, resolution, t, current));
                t = alignTime(t - 1, resolution);
            }
            bars.reverse();
            return bars.length === 0 ? { bars, noData: true } : { bars };
        },
        subscribeBars(symbol, resolution, onBar) {
            if (!(realtimeIntervalMs > 0)) {
                return () => {};
            }
            let lastTime = alignTime(now(), resolution);
            const timer = setInterval(() => {
                const current = now();
                const time = alignTime(current, resolution);
                // finish the previous bar and emit any bar skipped between two updates
                for (let t = lastTime, i = 0; t < time && i < 1000; t = nextBarTime(t, resolution), i++) {
                    onBar(barAt(symbol, resolution, t, current));
                }
                lastTime = time;
                onBar(barAt(symbol, resolution, time, current));
            }, realtimeIntervalMs);
            return () => clearInterval(timer);
        },
        async searchSymbols(query) {
            const q = query.trim().toLowerCase();
            return infos
                .map((s) => info(s.symbol))
                .filter((s) => !q || `${s.symbol} ${s.name} ${s.description ?? ""}`.toLowerCase().includes(q));
        },
        async resolveSymbol(symbol) {
            return info(symbol);
        },
    };
}
