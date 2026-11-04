import { generateBars } from "@reincharts/testing";
import {
    bollinger,
    defaultInputs,
    defineIndicator,
    indicatorName,
    indicators,
    ichimoku,
    macd,
    resolveInputs,
    rsi,
    sma,
    type IndicatorDefinition,
} from "../src";

const bars = generateBars(250, { seed: 11 });

const ids = [
    "sma",
    "ema",
    "wma",
    "tma",
    "hma",
    "vwma",
    "bollinger",
    "keltner",
    "donchian",
    "envelope",
    "vwap",
    "ichimoku",
    "supertrend",
    "sar",
    "dmi",
    "adx",
    "aroon",
    "macd",
    "rsi",
    "stochastic",
    "cci",
    "williamsR",
    "mfi",
    "roc",
    "momentum",
    "elderRay",
    "elderImpulse",
    "atr",
    "stddev",
    "volume",
    "obv",
    "forceIndex",
];

describe("indicator registry", () => {
    it("contains every built-in keyed by id", () => {
        expect(Object.keys(indicators).sort()).toEqual([...ids].sort());
        for (const [id, def] of Object.entries(indicators)) {
            expect(def.id).toBe(id);
        }
    });

    it.each(ids)("%s: well formed and calculate() returns aligned outputs", (id) => {
        const def = indicators[id] as IndicatorDefinition;
        expect(def.name).toBeTruthy();
        expect(def.shortName).toBeTruthy();
        expect(["trend", "momentum", "volatility", "volume", "other"]).toContain(def.category);
        for (const input of Object.values(def.inputs)) {
            expect(input.label).toBeTruthy();
            expect(input.default).not.toBeUndefined();
            if (input.type === "select" || input.type === "source") {
                expect(input.options).toContain(input.default);
            }
            if (input.type === "number") {
                expect(input.default as number).toBeGreaterThanOrEqual(input.min ?? -Infinity);
                expect(input.default as number).toBeLessThanOrEqual(input.max ?? Infinity);
            }
        }
        const out = def.calculate(bars, defaultInputs(def));
        for (const key of Object.keys(def.outputs)) {
            expect(out[key], key).toHaveLength(bars.length);
            expect(
                out[key].some((v) => v !== undefined),
                key,
            ).toBe(true);
            expect(
                out[key].every((v) => v === undefined || Number.isFinite(v)),
                key,
            ).toBe(true);
        }
        for (const fill of def.fills ?? []) {
            for (const side of fill.between) {
                if (typeof side === "string") {
                    expect(def.outputs).toHaveProperty(side);
                }
            }
        }
        expect(def.calculate([], defaultInputs(def))).toBeTypeOf("object");
        expect(indicatorName(def).startsWith(def.shortName)).toBe(true);
    });

    it("calculate() matches the calculators", () => {
        expect(indicators.rsi.calculate(bars, { period: 14, source: "close" }).rsi).toEqual(rsi(bars));
        expect(indicators.sma.calculate(bars, { period: 20, source: "hl2" }).ma).toEqual(
            sma(bars, { period: 20, source: "hl2" }),
        );
        expect(indicators.bollinger.calculate(bars, defaultInputs(indicators.bollinger))).toMatchObject(
            bollinger(bars),
        );
        expect(indicators.macd.calculate(bars, defaultInputs(indicators.macd))).toMatchObject(macd(bars));
        const ich = ichimoku(bars);
        expect(indicators.ichimoku.calculate(bars, defaultInputs(indicators.ichimoku)).spanB).toEqual(ich.spanB);
        // raw force index with length 1
        const efi = indicators.forceIndex.calculate(bars, { ...defaultInputs(indicators.forceIndex), period: 1 });
        expect(efi.force).toEqual(efi.raw);
    });

    it("names like TradingView", () => {
        expect(indicatorName(indicators.rsi)).toBe("RSI 14 close");
        expect(indicatorName(indicators.bollinger)).toBe("BB 20 close 2");
        expect(indicatorName(indicators.macd)).toBe("MACD 12 26 close 9");
        expect(indicatorName(indicators.ema, { period: 50 })).toBe("EMA 50 close");
        expect(indicatorName(indicators.bollinger, { maType: "ema" })).toBe("BB 20 close 2 ema");
        expect(indicatorName(indicators.rsi, { source: (d: any) => d.close } as any)).toBe("RSI 14");
    });

    it("resolves inputs over defaults", () => {
        expect(resolveInputs(indicators.rsi, { period: 7 })).toEqual({ period: 7, source: "close" });
        expect(resolveInputs(indicators.rsi, { period: undefined })).toEqual({ period: 14, source: "close" });
    });

    it("output metadata used by the renderer", () => {
        const hist = indicators.macd.outputs.histogram.colorFn!;
        const ctx = { data: [], outputs: {}, theme: {} as any };
        expect(hist(2, 1, 0, ctx)).toBe("#26a69a");
        expect(hist(1, 2, 0, ctx)).toBe("#b2dfdb");
        expect(hist(-2, -1, 0, ctx)).toBe("#ff5252");
        expect(hist(-1, -2, 0, ctx)).toBe("#ffcdd2");
        const offset = indicators.ichimoku.outputs.spanA.offset as (i: any) => number;
        expect(offset({ displacement: 26 })).toBe(25);
        expect(indicators.rsi.scale?.domain).toEqual([0, 100]);
        expect(indicators.rsi.levels?.map((l) => l.value)).toEqual([70, 50, 30]);
        expect(indicators.sma.overlay).toBe(true);
        expect(indicators.rsi.overlay).toBe(false);
    });

    it("defineIndicator types a custom definition", () => {
        const spread = defineIndicator<{ factor: number }>({
            id: "spread",
            name: "High-low spread",
            shortName: "Spread",
            category: "other",
            overlay: false,
            inputs: { factor: { type: "number", label: "Factor", default: 1 } },
            outputs: { spread: { type: "histogram", label: "Spread" } },
            calculate: (data, { factor }) => ({ spread: data.map((d) => (d.high - d.low) * factor) }),
        });
        expect(spread.calculate(bars.slice(0, 2), { factor: 2 }).spread[0]).toBeCloseTo(
            (bars[0].high - bars[0].low) * 2,
        );
        expect(indicatorName(spread)).toBe("Spread 1");
    });
});
