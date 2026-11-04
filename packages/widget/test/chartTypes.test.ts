import { generateBars } from "@reincharts/testing";
import { CHART_TYPES, chartData, chartTypeInfo, dataFamily } from "../src/chartTypes";
import { CHART_TYPE_IDS } from "../src/state";

const bars = generateBars(120);

describe("chart types", () => {
    it("covers every chart type id exactly once", () => {
        expect(CHART_TYPES.map((t) => t.id).sort()).toEqual([...CHART_TYPE_IDS].sort());
    });

    it("keeps the bars for plain types", () => {
        for (const id of [
            "candles",
            "hollowCandles",
            "bars",
            "line",
            "stepLine",
            "area",
            "baseline",
            "columns",
            "hlcArea",
        ] as const) {
            expect(chartData(id, bars)).toBe(bars);
            expect(chartTypeInfo(id).timeBased).toBe(true);
            expect(dataFamily(id)).toBe("bars");
        }
    });

    it("transforms Heikin Ashi 1:1 and keeps the view family", () => {
        const ha = chartData("heikinAshi", bars);
        expect(ha).toHaveLength(bars.length);
        expect(ha[5].close).toBeCloseTo((bars[5].open + bars[5].high + bars[5].low + bars[5].close) / 4);
        expect(ha[5].date).toBe(bars[5].date);
        expect(dataFamily("heikinAshi")).toBe("bars");
    });

    it("builds new bars for renko, kagi, point & figure and line break", () => {
        for (const id of ["renko", "kagi", "pointAndFigure", "lineBreak"] as const) {
            const out = chartData(id, bars);
            expect(out.length).toBeGreaterThan(0);
            expect(out.length).toBeLessThan(bars.length);
            expect(typeof out[0].open).toBe("number");
            expect(chartTypeInfo(id).timeBased).toBe(false);
            expect(dataFamily(id)).toBe(id);
        }
        expect(chartData("renko", [])).toEqual([]);
    });

    it("falls back to candles for unknown ids", () => {
        expect(chartTypeInfo("nope" as any).id).toBe("candles");
    });
});
