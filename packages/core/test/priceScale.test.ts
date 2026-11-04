import { PriceScale } from "../src";

const scale = (options = {}) => {
    const s = new PriceScale("right");
    s.options = options;
    s.height = 100;
    return s;
};

describe("PriceScale", () => {
    it("maps linear values with margins", () => {
        const s = scale({ margins: { top: 0, bottom: 0 } });
        s.fit(0, 10);
        expect(s.toY(10)).toBe(0);
        expect(s.toY(0)).toBe(100);
        expect(s.fromY(50)).toBe(5);
    });

    it("applies margins", () => {
        const s = scale({ margins: { top: 0.1, bottom: 0.1 } });
        s.fit(20, 100);
        expect(s.toY(100)).toBeCloseTo(10);
        expect(s.toY(20)).toBeCloseTo(90);
    });

    it("does not pad non-negative data below zero", () => {
        const s = scale();
        s.fit(0, 100);
        expect(s.min).toBe(0);
        expect(s.toY(0)).toBe(100);
        s.fit(50, 100);
        expect(s.min).toBeLessThan(50);
    });

    it("supports log, percent and indexed modes", () => {
        const log = scale({ mode: "log", margins: { top: 0, bottom: 0 } });
        log.fit(log.transform(1), log.transform(100));
        expect(log.toY(10)).toBeCloseTo(50);
        expect(log.ticks().map((t) => t.value)).toContain(10);
        expect(log.format(58.12345)).toBe("58.12"); // price precision, not the log-space step

        const pct = scale({ mode: "percent" });
        expect(pct.transform(110, 100)).toBeCloseTo(10);
        expect(pct.untransform(10, 100)).toBeCloseTo(110);
        expect(pct.format(110, 100)).toBe("+10.00%");

        const idx = scale({ mode: "indexed" });
        expect(idx.transform(50, 200)).toBe(25);
    });

    it("keeps log ticks apart on narrow ranges", () => {
        const s = scale({ mode: "log", margins: { top: 0, bottom: 0 } });
        s.height = 300;
        s.fit(s.transform(100), s.transform(600));
        const ys = s.ticks(40).map((t) => t.y);
        for (let i = 1; i < ys.length; i++) {
            expect(Math.abs(ys[i] - ys[i - 1])).toBeGreaterThanOrEqual(20);
        }
    });

    it("inverts and scales manually", () => {
        const s = scale({ invert: true, margins: { top: 0, bottom: 0 } });
        s.fit(0, 10);
        expect(s.toY(10)).toBe(100);
        s.scaleBy(2);
        expect(s.isAuto).toBe(false);
        expect(s.max - s.min).toBe(20);
        s.resetAuto();
        expect(s.isAuto).toBe(true);
    });

    it("pans by pixels", () => {
        const s = scale({ margins: { top: 0, bottom: 0 } });
        s.fit(0, 100);
        s.panBy(10);
        expect(s.min).toBeCloseTo(10);
    });

    it("category scales put the first category on top", () => {
        const s = scale({ categories: ["a", "b", "c"] });
        s.min = -0.5;
        s.max = 2.5;
        expect(s.toY(0)).toBeLessThan(s.toY(2));
        expect(s.ticks(10).map((t) => t.label)).toEqual(["a", "b", "c"]);
        expect(s.format(1)).toBe("b");
    });
});
