import { ChartEngine } from "@reincharts/core";
import { generateBars } from "@reincharts/testing";
import { applyPreset, presetStart, RANGE_PRESETS } from "../src/rangePresets";

const t = (s: string) => Date.parse(s);
const DAY = 86_400_000;

describe("presetStart", () => {
    const last = t("2024-05-31T15:30:00Z");
    it("computes calendar starts", () => {
        expect(presetStart("1D", last)).toBe(last - DAY);
        expect(presetStart("5D", last)).toBe(last - 5 * DAY);
        expect(presetStart("1M", last)).toBe(t("2024-04-30T15:30:00Z")); // clamped to the month length
        expect(presetStart("3M", last)).toBe(t("2024-02-29T15:30:00Z"));
        expect(presetStart("6M", last)).toBe(t("2023-11-30T15:30:00Z"));
        expect(presetStart("YTD", last)).toBe(t("2024-01-01T00:00:00Z"));
        expect(presetStart("1Y", last)).toBe(t("2023-05-31T15:30:00Z"));
        expect(presetStart("5Y", last)).toBe(t("2019-05-31T15:30:00Z"));
        expect(presetStart("All", last)).toBeUndefined();
    });

    it("lists the TradingView presets in order", () => {
        expect(RANGE_PRESETS).toEqual(["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"]);
    });
});

describe("applyPreset", () => {
    const engine = () => {
        const e = new ChartEngine();
        e.setData(generateBars(400)); // daily bars from 2024-01-01
        e.setSize(800, 400, 1);
        e.render();
        return e;
    };

    it("shows the range up to the last bar plus the right margin", () => {
        const e = engine();
        expect(applyPreset(e, "1M")).toBeUndefined();
        const lastTime = e.times[399];
        const firstShown = Math.ceil(e.from);
        expect(e.times[firstShown]).toBeGreaterThanOrEqual(presetStart("1M", lastTime)!);
        expect(e.times[firstShown - 1]).toBeLessThan(presetStart("1M", lastTime)!);
        expect(e.to).toBeCloseTo(399.5 + 3);
    });

    it("clamps to the first bar and reports the missing start", () => {
        const e = engine();
        const missing = applyPreset(e, "5Y");
        expect(missing).toBe(presetStart("5Y", e.times[399]));
        expect(e.from).toBe(-0.5);
    });

    it("fits everything for All and ignores empty data", () => {
        const e = engine();
        applyPreset(e, "1M");
        applyPreset(e, "All");
        expect(e.from).toBe(-0.5);
        expect(applyPreset(new ChartEngine(), "1Y")).toBeUndefined();
    });
});
