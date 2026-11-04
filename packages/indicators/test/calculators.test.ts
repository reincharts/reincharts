import { generateBars } from "@reincharts/testing";
import {
    adx,
    aroon,
    atr,
    bollinger,
    cci,
    change,
    compare,
    dmi,
    donchian,
    elderImpulse,
    elderRay,
    ema,
    envelope,
    fastStochastic,
    forceIndex,
    hma,
    ichimoku,
    keltner,
    macd,
    mfi,
    momentum,
    movingAverage,
    obv,
    rma,
    roc,
    rsi,
    sar,
    slowStochastic,
    sma,
    smoothedForceIndex,
    stddev,
    stochastic,
    supertrend,
    tma,
    trueRange,
    volume,
    vwap,
    vwma,
    williamsR,
    wma,
} from "../src";

type Bar = { open: number; high: number; low: number; close: number; volume: number; date?: Date };

const closes = (values: number[]): Bar[] => values.map((c) => ({ open: c, high: c, low: c, close: c, volume: 1 }));
const bars = generateBars(300, { seed: 3 });
const close = bars.map((b) => b.close);

const near = (actual: (number | undefined)[], expected: (number | undefined)[], digits = 8) => {
    expect(actual).toHaveLength(expected.length);
    actual.forEach((v, i) => {
        if (expected[i] === undefined) {
            expect(v, `index ${i}`).toBeUndefined();
        } else {
            expect(v, `index ${i}`).toBeCloseTo(expected[i]!, digits);
        }
    });
};

const firstDefined = (values: (number | undefined)[]) => values.findIndex((v) => v !== undefined);

// -------------------------------------------------------------- naive reference implementations
const naiveSma = (x: number[], n: number) =>
    x.map((_, i) => (i < n - 1 ? undefined : x.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n));
const naiveWma = (x: (number | undefined)[], n: number) =>
    x.map((_, i) => {
        if (i < n - 1) {
            return undefined;
        }
        const w = x.slice(i - n + 1, i + 1);
        if (w.some((v) => v === undefined)) {
            return undefined;
        }
        return w.reduce((a: number, v, k) => a + v! * (k + 1), 0) / ((n * (n + 1)) / 2);
    });
const naiveEma = (x: (number | undefined)[], n: number, alpha = 2 / (n + 1)) => {
    const out: (number | undefined)[] = [];
    let prev: number | undefined;
    const seed: number[] = [];
    for (const v of x) {
        if (v === undefined) {
            out.push(undefined);
            continue;
        }
        if (prev === undefined) {
            seed.push(v);
            if (seed.length === n) {
                prev = seed.reduce((a, b) => a + b, 0) / n;
                out.push(prev);
            } else {
                out.push(undefined);
            }
            continue;
        }
        prev = alpha * v + (1 - alpha) * prev;
        out.push(prev);
    }
    return out;
};
const naiveStd = (x: number[], n: number) =>
    x.map((_, i) => {
        if (i < n - 1) {
            return undefined;
        }
        const w = x.slice(i - n + 1, i + 1);
        const m = w.reduce((a, b) => a + b, 0) / n;
        return Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / n);
    });

describe("moving averages", () => {
    it("sma: hand computed and sliding sum matches brute force", () => {
        near(sma(closes([1, 2, 3, 4, 5, 6]), { period: 3 }), [undefined, undefined, 2, 3, 4, 5]);
        near(sma(bars, { period: 20 }), naiveSma(close, 20));
        expect(sma(bars)[7]).toBeUndefined(); // default period 9
        expect(sma(bars)[8]).toBeDefined();
    });

    it("ema: SMA seed then alpha = 2 / (n + 1)", () => {
        near(ema(closes([1, 2, 3, 4, 5]), { period: 3 }), [undefined, undefined, 2, 3, 4]);
        near(ema(closes([2, 4, 6, 8, 4]), { period: 3 }), [undefined, undefined, 4, 6, 5]);
        near(ema(bars, { period: 12 }), naiveEma(close, 12));
    });

    it("wma: weights 1..n", () => {
        near(wma(closes([1, 2, 3, 4]), { period: 3 }), [undefined, undefined, 14 / 6, 20 / 6]);
        near(wma(bars, { period: 10 }), naiveWma(close, 10));
    });

    it("tma: triangular weights (even and odd periods)", () => {
        const x = [3, 1, 4, 1, 5, 9, 2, 6];
        const even = tma(closes(x), { period: 4 });
        expect(firstDefined(even)).toBe(3);
        expect(even[3]).toBeCloseTo((3 + 2 * 1 + 2 * 4 + 1) / 6);
        expect(even[7]).toBeCloseTo((5 + 2 * 9 + 2 * 2 + 6) / 6);
        const odd = tma(closes(x), { period: 5 });
        expect(firstDefined(odd)).toBe(4);
        expect(odd[4]).toBeCloseTo((3 + 2 * 1 + 3 * 4 + 2 * 1 + 5) / 9);
    });

    it("rma: Wilder smoothing (alpha 1/n)", () => {
        near(rma(closes([1, 2, 3, 4]), { period: 2 }), [undefined, 1.5, 2.25, 3.125]);
    });

    it("hma: WMA(2 WMA(n/2) − WMA(n), √n)", () => {
        const n = 16;
        const half = naiveWma(close, 8);
        const full = naiveWma(close, n);
        const diff = half.map((h, i) => (h === undefined || full[i] === undefined ? undefined : 2 * h - full[i]!));
        near(hma(bars, { period: n }), naiveWma(diff, 4), 6);
        expect(firstDefined(hma(bars, { period: n }))).toBe(n + 4 - 2);
    });

    it("vwma: Σ(price × volume) / Σ volume", () => {
        const data = [
            { close: 10, volume: 1 },
            { close: 20, volume: 3 },
            { close: 30, volume: 1 },
        ];
        near(vwma(data, { period: 2 }), [undefined, 17.5, 22.5]);
    });

    it("movingAverage dispatches by type and accepts sources / accessors", () => {
        expect(movingAverage(bars, { type: "ema", period: 5 })).toEqual(ema(bars, { period: 5 }));
        expect(movingAverage(bars, { type: "wma", period: 5, source: "hl2" })).toEqual(
            wma(bars, { period: 5, source: (d) => (d.high + d.low) / 2 }),
        );
        expect(sma(bars, { period: 3, source: "hlc3" })[2]).toBeCloseTo(
            [0, 1, 2].reduce((a, i) => a + (bars[i].high + bars[i].low + bars[i].close) / 3, 0) / 3,
        );
        expect(sma(bars, { period: 2, source: "ohlc4" })[1]).toBeCloseTo(
            [0, 1].reduce((a, i) => a + (bars[i].open + bars[i].high + bars[i].low + bars[i].close) / 4, 0) / 2,
        );
    });
});

describe("volatility", () => {
    it("trueRange / atr (Wilder)", () => {
        const data: Bar[] = [
            { open: 10, high: 12, low: 9, close: 11, volume: 1 },
            { open: 11, high: 13, low: 10, close: 12, volume: 1 },
            { open: 12, high: 12.5, low: 8, close: 9, volume: 1 },
            { open: 9, high: 10, low: 9, close: 10, volume: 1 },
        ];
        near(trueRange(data), [3, 3, 4.5, 1]);
        near(atr(data, { period: 2 }), [undefined, 3, 3.75, 2.375]);
    });

    it("stddev is the population standard deviation", () => {
        near(stddev(closes([2, 4, 4, 4, 5, 5, 7, 9]), { period: 8 }), [...Array(7).fill(undefined), 2]);
        near(stddev(bars, { period: 20 }), naiveStd(close, 20), 6);
    });

    it("bollinger = SMA ± k σ", () => {
        const bb = bollinger(bars, { period: 20, multiplier: 2 });
        const mid = naiveSma(close, 20);
        const sd = naiveStd(close, 20);
        near(bb.middle, mid, 6);
        near(
            bb.upper,
            mid.map((m, i) => (m === undefined ? undefined : m + 2 * sd[i]!)),
            6,
        );
        near(
            bb.lower,
            mid.map((m, i) => (m === undefined ? undefined : m - 2 * sd[i]!)),
            6,
        );
        expect(bollinger(bars, { maType: "ema" }).middle).toEqual(ema(bars, { period: 20 }));
    });

    it("keltner = EMA ± k ATR", () => {
        const kc = keltner(bars, { period: 20, multiplier: 2, atrPeriod: 10 });
        const a = atr(bars, { period: 10 });
        const e = ema(bars, { period: 20 });
        for (const i of [30, 100, 299]) {
            expect(kc.middle[i]).toBeCloseTo(e[i]!);
            expect(kc.upper[i]).toBeCloseTo(e[i]! + 2 * a[i]!);
            expect(kc.lower[i]).toBeCloseTo(e[i]! - 2 * a[i]!);
        }
        expect(keltner(bars, { bandsStyle: "tr" }).upper[50]).toBeCloseTo(
            e[50]! * 0 + ema(bars, { period: 20 })[50]! + 2 * trueRange(bars)[50]!,
        );
        expect(keltner(bars, { bandsStyle: "range" }).upper[50]).toBeDefined();
    });

    it("donchian / envelope", () => {
        const data: Bar[] = [5, 7, 3, 6, 8].map((c, i) => ({ open: c, high: c + 1, low: c - 1, close: c, volume: i }));
        const dc = donchian(data, { period: 3 });
        near(dc.upper, [undefined, undefined, 8, 8, 9]);
        near(dc.lower, [undefined, undefined, 2, 2, 2]);
        near(dc.middle, [undefined, undefined, 5, 5, 5.5]);
        const env = envelope(closes([10, 20, 30]), { period: 2, percent: 10 });
        near(env.middle, [undefined, 15, 25]);
        near(env.upper, [undefined, 16.5, 27.5]);
        near(env.lower, [undefined, 13.5, 22.5]);
    });
});

describe("oscillators", () => {
    it("rsi: Wilder smoothing, bounds and extremes", () => {
        // gains 1,0,2,0 losses 0,1,0,1 -> avg gain (1+0)/2=.5, loss .5 -> 50; then gain (.5*1+2)/2=1.25, loss .25
        near(rsi(closes([10, 11, 10, 12, 11]), { period: 2 }), [
            undefined,
            undefined,
            50,
            100 - 100 / (1 + 1.25 / 0.25),
            100 - 100 / (1 + 0.625 / 0.625),
        ]);
        expect(rsi(closes([1, 2, 3, 4, 5]), { period: 2 }).at(-1)).toBe(100);
        expect(rsi(closes([5, 4, 3, 2, 1]), { period: 2 }).at(-1)).toBe(0);
        const r = rsi(bars);
        expect(firstDefined(r)).toBe(14);
        expect(r.every((v) => v === undefined || (v >= 0 && v <= 100))).toBe(true);
    });

    it("macd = EMA(12) − EMA(26), signal = EMA(9) of macd", () => {
        const m = macd(bars);
        const fast = naiveEma(close, 12);
        const slow = naiveEma(close, 26);
        const line = fast.map((f, i) => (f === undefined || slow[i] === undefined ? undefined : f - slow[i]!));
        near(m.macd, line, 8);
        near(m.signal, naiveEma(line, 9), 8);
        expect(firstDefined(m.macd)).toBe(25);
        expect(firstDefined(m.signal)).toBe(33);
        m.histogram.forEach((h, i) => h !== undefined && expect(h).toBeCloseTo(m.macd[i]! - m.signal[i]!));
    });

    it("stochastic %K / %D (fast, slow, full)", () => {
        const data: Bar[] = [
            { open: 0, high: 10, low: 0, close: 5, volume: 1 },
            { open: 0, high: 12, low: 2, close: 12, volume: 1 },
            { open: 0, high: 8, low: 4, close: 4, volume: 1 },
            { open: 0, high: 9, low: 5, close: 9, volume: 1 },
        ];
        const fast = stochastic(data, { period: 2, kSmoothing: 1, dSmoothing: 2 });
        // window [0..1]: HH 12 LL 0 -> 100; [1..2]: HH 12 LL 2 -> 20; [2..3]: HH 9 LL 4 -> 100
        near(fast.k, [undefined, 100, 20, 100]);
        near(fast.d, [undefined, undefined, 60, 60]);
        near(stochastic(data, { period: 2, kSmoothing: 2, dSmoothing: 1 }).k, [undefined, undefined, 60, 60]);
        expect(fastStochastic(bars).k).toEqual(stochastic(bars, { kSmoothing: 1 }).k);
        expect(slowStochastic(bars).k).toEqual(stochastic(bars, { kSmoothing: 3 }).k);
        expect(stochastic(closes([5, 5, 5]), { period: 2 }).k).toEqual([undefined, 50, 50]);
    });

    it("cci", () => {
        const c = cci(closes([1, 2, 3]), { period: 3 });
        // mean 2, mean deviation 2/3 -> (3 - 2) / (0.015 * 2/3) = 100
        near(c, [undefined, undefined, 100]);
        expect(cci(closes([4, 4, 4]), { period: 3 })[2]).toBe(0);
    });

    it("williams %R / roc / momentum", () => {
        const data: Bar[] = [
            { open: 0, high: 10, low: 0, close: 5, volume: 1 },
            { open: 0, high: 12, low: 2, close: 3, volume: 1 },
        ];
        near(williamsR(data, { period: 2 }), [undefined, -75]);
        near(roc(closes([10, 11, 12, 15]), { period: 2 }), [undefined, undefined, 20, (100 * 4) / 11]);
        near(momentum(closes([10, 11, 12, 15]), { period: 2 }), [undefined, undefined, 2, 4]);
    });

    it("mfi", () => {
        const data = [
            { high: 10, low: 10, close: 10, volume: 1 },
            { high: 12, low: 12, close: 12, volume: 2 },
            { high: 11, low: 11, close: 11, volume: 1 },
            { high: 13, low: 13, close: 13, volume: 1 },
        ];
        // flows: +24, -11, +13
        near(mfi(data, { period: 2 }), [undefined, undefined, 100 - 100 / (1 + 24 / 11), 100 - 100 / (1 + 13 / 11)]);
        expect(mfi(closes([1, 2, 3, 4]), { period: 2 }).at(-1)).toBe(100);
    });

    it("aroon", () => {
        const data: Bar[] = [1, 5, 2, 3, 4].map((c) => ({ open: c, high: c, low: c, close: c, volume: 1 }));
        const a = aroon(data, { period: 3 });
        // window [1..4]: highest at 1 (3 bars ago) -> 0; lowest at 2 (2 bars ago) -> 33.3
        near(a.up, [undefined, undefined, undefined, (100 * (3 - 2)) / 3, 0]);
        near(a.down, [undefined, undefined, undefined, 0, (100 * 1) / 3]);
        near(a.oscillator, [undefined, undefined, undefined, 100 / 3, -100 / 3]);
    });
});

describe("trend", () => {
    it("sar trails below an uptrend and flips on a reversal", () => {
        const up: Bar[] = Array.from({ length: 20 }, (_, i) => ({
            open: 10 + i,
            high: 11 + i,
            low: 9 + i,
            close: 10.5 + i,
            volume: 1,
        }));
        const down: Bar[] = Array.from({ length: 10 }, (_, i) => ({
            open: 25 - 2 * i,
            high: 26 - 2 * i,
            low: 22 - 2 * i,
            close: 23 - 2 * i,
            volume: 1,
        }));
        const s = sar([...up, ...down]);
        expect(s[0]).toBeUndefined();
        expect(s[1]).toBe(9); // previous low
        for (let i = 1; i < 20; i++) {
            expect(s[i]!).toBeLessThanOrEqual(up[i].low);
        }
        // increasing while trending up
        expect(s[19]!).toBeGreaterThan(s[10]!);
        const flipped = s.slice(20).some((v, k) => v! > down[k].high);
        expect(flipped).toBe(true);
        // first two bars of the hand computed recursion: af .02, ep = high[1] = 12
        expect(s[2]).toBeCloseTo(Math.min(9 + 0.02 * (12 - 9), 9, 10));
    });

    it("supertrend direction and bands", () => {
        const st = supertrend(bars);
        expect(firstDefined(st.supertrend)).toBe(9);
        st.supertrend.forEach((v, i) => {
            if (v !== undefined) {
                expect(st.direction[i] === 1 ? st.up[i] : st.down[i]).toBe(v);
                // up trend line below the close, down trend line above it
                if (st.direction[i] === 1) {
                    expect(v).toBeLessThanOrEqual(bars[i].close);
                } else {
                    expect(v).toBeGreaterThanOrEqual(bars[i].close);
                }
            }
        });
        expect(new Set(st.direction.filter((d) => d !== undefined))).toEqual(new Set([1, -1]));
    });

    it("dmi / adx warm-up and range", () => {
        const d = dmi(bars, { period: 14, adxSmoothing: 14 });
        expect(firstDefined(d.plusDI)).toBe(14);
        expect(firstDefined(d.adx)).toBe(27);
        for (const arr of [d.plusDI, d.minusDI, d.adx]) {
            expect(arr.every((v) => v === undefined || (v >= 0 && v <= 100))).toBe(true);
        }
        expect(adx(bars)).toEqual(d.adx);
        // a pure uptrend has no -DM
        const up: Bar[] = Array.from({ length: 10 }, (_, i) => ({
            open: i,
            high: i + 1,
            low: i,
            close: i + 1,
            volume: 1,
        }));
        const u = dmi(up, { period: 3, adxSmoothing: 3 });
        expect(u.minusDI[5]).toBe(0);
        expect(u.adx[9]).toBeCloseTo(100);
    });

    it("ichimoku lines are Donchian midpoints, spans unshifted", () => {
        const ich = ichimoku(bars);
        const mid = (n: number, i: number) => {
            const w = bars.slice(i - n + 1, i + 1);
            return (Math.max(...w.map((b) => b.high)) + Math.min(...w.map((b) => b.low))) / 2;
        };
        expect(ich.conversion[100]).toBeCloseTo(mid(9, 100));
        expect(ich.base[100]).toBeCloseTo(mid(26, 100));
        expect(ich.spanA[100]).toBeCloseTo((mid(9, 100) + mid(26, 100)) / 2);
        expect(ich.spanB[100]).toBeCloseTo(mid(52, 100));
        expect(firstDefined(ich.spanB)).toBe(51);
        expect(ich.lagging).toEqual(close);
        expect(ich.plotOffset).toBe(25);
    });
});

describe("volume", () => {
    it("obv", () => {
        const data = [10, 11, 11, 9].map((c, i) => ({ close: c, volume: (i + 1) * 10 }));
        near(obv(data), [0, 20, 20, -20]);
    });

    it("volume + MA + direction", () => {
        const v = volume(bars, { period: 3 });
        expect(v.volume).toEqual(bars.map((b) => b.volume));
        expect(v.ma[2]).toBeCloseTo((bars[0].volume + bars[1].volume + bars[2].volume) / 3);
        expect(v.direction[5]).toBe(bars[5].close >= bars[5].open ? 1 : -1);
    });

    it("vwap resets every session and computes bands", () => {
        const day = (d: number, h: number) => new Date(Date.UTC(2024, 0, d, h));
        const data = [
            { date: day(1, 10), high: 10, low: 10, close: 10, volume: 1 },
            { date: day(1, 11), high: 20, low: 20, close: 20, volume: 3 },
            { date: day(2, 10), high: 30, low: 30, close: 30, volume: 1 },
            { date: day(2, 11), high: 40, low: 40, close: 40, volume: 1 },
        ];
        const r = vwap(data);
        near(r.vwap, [10, 17.5, 30, 35]);
        // weighted σ of {10×1, 20×3} = sqrt(18.75)
        expect(r.upper[1]).toBeCloseTo(17.5 + Math.sqrt(18.75));
        expect(r.lower[3]).toBeCloseTo(30);
        near(vwap(data, { anchor: "none" }).vwap, [10, 17.5, 20, 140 / 6]);
        near(vwap(data, { anchor: "month" }).vwap, [10, 17.5, 20, 140 / 6]);
        near(vwap(data, { anchor: (_d, i) => i === 2 }).vwap, [10, 17.5, 30, 35]);
        near(vwap(data, { timeZone: "America/New_York" }).vwap, [10, 17.5, 30, 35]);
        // numeric times
        near(vwap(data.map((d) => ({ ...d, date: undefined, time: d.date.getTime() }))).vwap, [10, 17.5, 30, 35]);
    });

    it("force index (raw and smoothed)", () => {
        const data = [10, 12, 11].map((c, i) => ({ close: c, volume: i + 1 }));
        near(forceIndex(data), [undefined, 4, -3]);
        const s = smoothedForceIndex(data, { period: 2, maType: "sma" });
        near(s.force, [undefined, 4, -3]);
        near(s.smoothed, [undefined, undefined, 0.5]);
    });
});

describe("misc", () => {
    it("elder ray", () => {
        const er = elderRay(bars, { period: 13 });
        const e = ema(bars, { period: 13 });
        expect(er.bullPower[50]).toBeCloseTo(bars[50].high - e[50]!);
        expect(er.bearPower[50]).toBeCloseTo(bars[50].low - e[50]!);
        expect(elderRay(bars, { maType: "sma" }).bullPower[50]).toBeCloseTo(
            bars[50].high - sma(bars, { period: 13 })[50]!,
        );
    });

    it("elder impulse: 1 / −1 / 0 from EMA and MACD histogram slopes", () => {
        const imp = elderImpulse(bars);
        const e = ema(bars, { period: 13 });
        const h = macd(bars).histogram;
        expect(firstDefined(imp)).toBe(34);
        for (let i = 35; i < bars.length; i++) {
            const de = e[i]! - e[i - 1]!;
            const dh = h[i]! - h[i - 1]!;
            expect(imp[i]).toBe(de >= 0 && dh >= 0 ? 1 : de <= 0 && dh <= 0 ? -1 : 0);
        }
    });

    it("change and compare", () => {
        const c = change(closes([10, 12, 9]));
        near(c.absolute, [undefined, 2, -3]);
        near(c.percent, [undefined, 20, -25]);
        near(compare(closes([10, 12, 9])), [0, 20, -10]);
        near(compare([{ x: undefined }, { x: 5 }, { x: 10 }], { source: "x" as any }), [undefined, 0, 100]);
        near(compare(closes([10, 12, 9, 18]), { baseIndex: 2 }), [undefined, undefined, 0, 100]);
    });
});

describe("edge cases", () => {
    const all: [string, (d: any[]) => unknown][] = [
        ["sma", (d) => sma(d, { period: 5 })],
        ["ema", (d) => ema(d, { period: 5 })],
        ["wma", (d) => wma(d, { period: 5 })],
        ["tma", (d) => tma(d, { period: 5 })],
        ["hma", (d) => hma(d, { period: 5 })],
        ["rma", (d) => rma(d, { period: 5 })],
        ["vwma", (d) => vwma(d, { period: 5 })],
        ["bollinger", (d) => bollinger(d, { period: 5 })],
        ["keltner", (d) => keltner(d, { period: 5 })],
        ["donchian", (d) => donchian(d, { period: 5 })],
        ["envelope", (d) => envelope(d, { period: 5 })],
        ["stddev", (d) => stddev(d, { period: 5 })],
        ["atr", (d) => atr(d, { period: 5 })],
        ["rsi", (d) => rsi(d, { period: 5 })],
        ["macd", (d) => macd(d, { fast: 2, slow: 4, signal: 2 })],
        ["stochastic", (d) => stochastic(d, { period: 5 })],
        ["cci", (d) => cci(d, { period: 5 })],
        ["williamsR", (d) => williamsR(d, { period: 5 })],
        ["roc", (d) => roc(d, { period: 5 })],
        ["momentum", (d) => momentum(d, { period: 5 })],
        ["mfi", (d) => mfi(d, { period: 5 })],
        ["aroon", (d) => aroon(d, { period: 5 })],
        ["sar", (d) => sar(d)],
        ["supertrend", (d) => supertrend(d, { period: 5 })],
        ["dmi", (d) => dmi(d, { period: 5, adxSmoothing: 5 })],
        ["ichimoku", (d) => ichimoku(d, { conversion: 2, base: 3, spanB: 5 })],
        ["vwap", (d) => vwap(d)],
        ["obv", (d) => obv(d)],
        ["volume", (d) => volume(d, { period: 5 })],
        ["forceIndex", (d) => forceIndex(d)],
        ["smoothedForceIndex", (d) => smoothedForceIndex(d, { period: 5 })],
        ["elderRay", (d) => elderRay(d, { period: 5 })],
        ["elderImpulse", (d) => elderImpulse(d, { period: 3, fast: 2, slow: 3, signal: 2 })],
        ["change", (d) => change(d)],
        ["compare", (d) => compare(d)],
    ];
    const arrays = (r: unknown): (number | undefined)[][] =>
        Array.isArray(r) ? [r] : Object.values(r as object).filter(Array.isArray);

    it.each(all)("%s: empty data, period > length, NaN inputs, alignment", (_name, fn) => {
        for (const arr of arrays(fn([]))) {
            expect(arr).toEqual([]);
        }
        const short = bars.slice(0, 3);
        for (const arr of arrays(fn(short))) {
            expect(arr).toHaveLength(3);
        }
        const withGaps = bars.slice(0, 60).map((b, i) => (i === 30 ? { ...b, close: NaN, high: undefined } : b));
        for (const arr of arrays(fn(withGaps))) {
            expect(arr).toHaveLength(60);
            expect(arr.every((v) => v === undefined || Number.isFinite(v))).toBe(true);
        }
        for (const arr of arrays(fn(bars))) {
            expect(arr).toHaveLength(bars.length);
        }
        expect(arrays(fn(bars)).some((arr) => arr.at(-1) !== undefined)).toBe(true);
    });

    it("period > length gives only undefined", () => {
        expect(sma(bars.slice(0, 3), { period: 5 })).toEqual([undefined, undefined, undefined]);
        expect(rsi(bars.slice(0, 5), { period: 5 })).toEqual(Array(5).fill(undefined));
        expect(bollinger(bars.slice(0, 3), { period: 5 }).upper).toEqual(Array(3).fill(undefined));
    });

    it("windows containing a missing value are undefined, then recover", () => {
        const x = closes([1, 2, 3, 4, 5, 6, 7]);
        x[2] = { ...x[2], close: NaN };
        near(sma(x, { period: 2 }), [undefined, 1.5, undefined, undefined, 4.5, 5.5, 6.5]);
        near(wma(x, { period: 2 }), [undefined, 5 / 3, undefined, undefined, 14 / 3, 17 / 3, 20 / 3]);
        // EMA keeps state across an interior gap
        const e = ema(x, { period: 2 });
        expect(e[2]).toBeUndefined();
        expect(e[3]).toBeCloseTo((2 / 3) * 4 + (1 / 3) * 1.5);
        // leading gaps are skipped (MACD signal style)
        near(ema([{ close: undefined }, { close: 2 }, { close: 4 }], { period: 2 }), [undefined, undefined, 3]);
    });

    it("invalid periods are clamped to 1", () => {
        expect(sma(closes([1, 2]), { period: 0 })).toEqual([1, 2]);
        expect(sma(closes([1, 2]), { period: NaN })).toEqual([1, 2]);
    });
});
