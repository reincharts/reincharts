import { createRandomDatafeed } from "@reincharts/datafeed";

/** Seeded random-walk feed with a few demo symbols, ticking in (simulated) realtime. */
export const createDemoFeed = (speed = 30) =>
    createRandomDatafeed({
        symbols: [
            { symbol: "REIN", name: "REIN", description: "Reincharts Demo Inc." },
            { symbol: "ACME", name: "ACME", description: "Acme Corp." },
            { symbol: "GLOBX", name: "GLOBX", description: "Globex Industries" },
            { symbol: "BTCD", name: "BTCD", description: "Demo Coin / Dollar" },
        ],
        seed: 7,
        startPrice: (symbol) => ({ REIN: 182, ACME: 64, GLOBX: 420, BTCD: 68000 })[symbol] ?? 100,
        volatility: 0.025,
        realtimeIntervalMs: 1000,
        speed,
    });
