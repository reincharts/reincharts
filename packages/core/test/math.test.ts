import {
    decimalsFor,
    formatCompact,
    formatNumber,
    formatPercent,
    lowerBound,
    nearestIndex,
    niceStep,
    niceTicks,
    upperBound,
} from "../src";

describe("math", () => {
    it("binary searches ascending arrays", () => {
        const v = [1, 3, 3, 5, 9];
        expect(lowerBound(v, 3)).toBe(1);
        expect(upperBound(v, 3)).toBe(3);
        expect(lowerBound(v, 10)).toBe(5);
        expect(nearestIndex(v, 4.1)).toBe(3);
        expect(nearestIndex(v, -5)).toBe(0);
        expect(nearestIndex(v, 50)).toBe(4);
    });

    it("produces nice ticks", () => {
        expect(niceStep(100, 5)).toBe(20);
        expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
        expect(niceTicks(0.1, 0.35, 5)).toEqual([0.1, 0.15, 0.2, 0.25, 0.3, 0.35]);
        expect(niceTicks(5, 5, 4)).toEqual([5]);
    });

    it("formats numbers", () => {
        expect(decimalsFor(0.05)).toBe(2);
        expect(decimalsFor(10)).toBe(0);
        expect(decimalsFor(200000)).toBe(0);
        expect(decimalsFor(0.25)).toBe(2);
        expect(formatNumber(1234.5, 2)).toBe("1,234.50");
        expect(formatCompact(1_250_000)).toBe("1.25M");
        expect(formatPercent(1.234)).toBe("+1.23%");
        expect(formatNumber(NaN)).toBe("");
    });
});
