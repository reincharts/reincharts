import { computeTimeTicks, TimeFormatter } from "../src";

const DAY = 86_400_000;

describe("time", () => {
    const utc = new TimeFormatter({ timeZone: "UTC" });

    it("weights boundaries", () => {
        expect(utc.weight(Date.UTC(2024, 0, 1), Date.UTC(2023, 11, 31))).toBe(100);
        expect(utc.weight(Date.UTC(2024, 1, 1), Date.UTC(2024, 0, 31))).toBe(90);
        expect(utc.weight(Date.UTC(2024, 1, 2), Date.UTC(2024, 1, 1))).toBe(70);
        expect(utc.weight(Date.UTC(2024, 1, 2, 12), Date.UTC(2024, 1, 2, 11))).toBe(56);
    });

    it("formats labels in a time zone", () => {
        const t = Date.UTC(2024, 2, 12, 14, 5);
        expect(utc.format(t, true)).toBe("Tue 12 Mar '24  14:05");
        expect(utc.format(t, false)).toBe("Tue 12 Mar '24");
        const ny = new TimeFormatter({ timeZone: "America/New_York" });
        expect(ny.parts(t).hour).toBe(10);
    });

    it("picks well spaced, significant ticks", () => {
        const times = Array.from({ length: 120 }, (_, i) => Date.UTC(2024, 0, 1) + i * DAY);
        const ticks = computeTimeTicks(times, 0, 119, (i) => i * 10, utc, 80);
        expect(ticks[0].label).toBe("2024");
        expect(ticks.map((t) => t.label)).toEqual(expect.arrayContaining(["Feb", "Mar", "Apr"]));
        for (let i = 1; i < ticks.length; i++) {
            expect(ticks[i].x - ticks[i - 1].x).toBeGreaterThanOrEqual(80);
        }
    });
});
