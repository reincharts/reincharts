export interface TestBar {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/** Deterministic pseudo random generator (mulberry32). */
export const seededRandom = (seed = 1) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

/** Generates a deterministic random-walk OHLCV series. */
export const generateBars = (
    count = 200,
    { seed = 42, start = Date.UTC(2024, 0, 1), interval = 86_400_000, price = 100 } = {},
): TestBar[] => {
    const random = seededRandom(seed);
    const bars: TestBar[] = [];
    let close = price;
    for (let i = 0; i < count; i++) {
        const open = close;
        close = Math.max(1, open + (random() - 0.5) * open * 0.04);
        const high = Math.max(open, close) * (1 + random() * 0.01);
        const low = Math.min(open, close) * (1 - random() * 0.01);
        bars.push({
            date: new Date(start + i * interval),
            open,
            high,
            low,
            close,
            volume: Math.round(1e5 + random() * 1e6),
        });
    }
    return bars;
};

/** Runs all pending requestAnimationFrame callbacks (render loop) synchronously. */
export const flushFrames = async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    await new Promise((resolve) => setTimeout(resolve, 0));
};

/** Returns the mocked 2D context draw calls recorded by vitest-canvas-mock. */
export const drawCalls = (canvas: HTMLCanvasElement) => (canvas.getContext("2d") as any).__getDrawCalls() as any[];
