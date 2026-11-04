import {
    alignTime,
    compareResolutions,
    DAY,
    formatResolution,
    HOUR,
    isResolution,
    MINUTE,
    nextBarTime,
    normalizeResolution,
    parseResolution,
    resolutionToMs,
    RESOLUTIONS,
    timeZoneOffset,
    WEEK,
} from "../src";

const utc = Date.UTC;

describe("parseResolution", () => {
    it.each([
        ["1S", "second", 1],
        ["5S", "second", 5],
        ["15s", "second", 15],
        ["1", "minute", 1],
        ["5", "minute", 5],
        ["15m", "minute", 15],
        ["60", "minute", 60],
        ["240", "minute", 240],
        ["1h", "minute", 60],
        ["4H", "minute", 240],
        ["D", "day", 1],
        ["1D", "day", 1],
        ["3d", "day", 3],
        ["W", "week", 1],
        ["1W", "week", 1],
        ["2w", "week", 2],
        ["M", "month", 1],
        ["1M", "month", 1],
        ["3M", "month", 3],
        ["12M", "month", 12],
        ["1y", "month", 12],
        ["2Y", "month", 24],
    ] as const)("%s → %s × %d", (input, unit, count) => {
        expect(parseResolution(input)).toEqual({ unit, count });
    });

    it.each(["", "0", "-1", "abc", "1X", "1.5", "5 minutes", "1Mo"])("rejects %j", (bad) => {
        expect(() => parseResolution(bad)).toThrow(/Invalid resolution/);
        expect(isResolution(bad)).toBe(false);
    });

    it("distinguishes minute (m) from month (M)", () => {
        expect(parseResolution("1m").unit).toBe("minute");
        expect(parseResolution("1M").unit).toBe("month");
    });

    it("accepts every listed resolution, sorted by duration", () => {
        for (const r of RESOLUTIONS) {
            expect(isResolution(r)).toBe(true);
        }
        expect([...RESOLUTIONS].sort(compareResolutions)).toEqual(RESOLUTIONS);
    });
});

describe("resolutionToMs / normalize / format", () => {
    it.each([
        ["1S", 1000],
        ["30S", 30_000],
        ["1", MINUTE],
        ["15", 15 * MINUTE],
        ["60", HOUR],
        ["4h", 4 * HOUR],
        ["1D", DAY],
        ["1W", WEEK],
        ["1M", 30 * DAY],
    ] as const)("%s = %d ms", (r, ms) => {
        expect(resolutionToMs(r)).toBe(ms);
    });

    it.each([
        ["1h", "60"],
        ["4h", "240"],
        ["15m", "15"],
        ["d", "1D"],
        ["1d", "1D"],
        ["w", "1W"],
        ["1y", "12M"],
        ["1s", "1S"],
        ["60", "60"],
    ] as const)("normalizes %s → %s", (r, out) => {
        expect(normalizeResolution(r)).toBe(out);
    });

    it.each([
        ["1S", "1s", "1 second"],
        ["5S", "5s", "5 seconds"],
        ["1", "1m", "1 minute"],
        ["45", "45m", "45 minutes"],
        ["60", "1h", "1 hour"],
        ["240", "4h", "4 hours"],
        ["90", "90m", "90 minutes"],
        ["1D", "1D", "1 day"],
        ["1W", "1W", "1 week"],
        ["3M", "3M", "3 months"],
        ["12M", "1Y", "1 year"],
    ] as const)("formats %s → %s / %s", (r, short, long) => {
        expect(formatResolution(r)).toBe(short);
        expect(formatResolution(r, "long")).toBe(long);
    });
});

describe("alignTime (UTC)", () => {
    const t = utc(2024, 4, 15, 13, 47, 23, 456); // Wednesday 2024-05-15

    it("aligns intraday buckets to the epoch", () => {
        expect(alignTime(t, "1S")).toBe(utc(2024, 4, 15, 13, 47, 23));
        expect(alignTime(t, "5S")).toBe(utc(2024, 4, 15, 13, 47, 20));
        expect(alignTime(t, "1")).toBe(utc(2024, 4, 15, 13, 47));
        expect(alignTime(t, "15")).toBe(utc(2024, 4, 15, 13, 45));
        expect(alignTime(t, "60")).toBe(utc(2024, 4, 15, 13));
        expect(alignTime(t, "240")).toBe(utc(2024, 4, 15, 12));
    });

    it("aligns days to midnight", () => {
        expect(alignTime(t, "1D")).toBe(utc(2024, 4, 15));
        expect(alignTime(utc(2024, 4, 15), "1D")).toBe(utc(2024, 4, 15));
        expect(alignTime(utc(2024, 4, 15) - 1, "1D")).toBe(utc(2024, 4, 14));
    });

    it("aligns weeks to Monday by default, Sunday optionally", () => {
        expect(alignTime(t, "1W")).toBe(utc(2024, 4, 13)); // Monday
        expect(alignTime(utc(2024, 4, 13), "1W")).toBe(utc(2024, 4, 13));
        expect(alignTime(utc(2024, 4, 19, 23, 59), "1W")).toBe(utc(2024, 4, 13)); // Sunday evening
        expect(alignTime(utc(2024, 4, 20), "1W")).toBe(utc(2024, 4, 20));
        expect(alignTime(t, "1W", { weekStart: 0 })).toBe(utc(2024, 4, 12)); // Sunday
        expect(new Date(alignTime(utc(1969, 11, 31), "1W")).getUTCDay()).toBe(1); // before the epoch
    });

    it("aligns months to the 1st, multi-month buckets to calendar quarters / halves / years", () => {
        expect(alignTime(t, "1M")).toBe(utc(2024, 4, 1));
        expect(alignTime(utc(2024, 1, 29, 23), "1M")).toBe(utc(2024, 1, 1)); // leap day
        expect(alignTime(t, "3M")).toBe(utc(2024, 3, 1));
        expect(alignTime(t, "6M")).toBe(utc(2024, 0, 1));
        expect(alignTime(t, "12M")).toBe(utc(2024, 0, 1));
        expect(alignTime(utc(2023, 11, 31, 23, 59), "1M")).toBe(utc(2023, 11, 1));
    });

    it("nextBarTime handles variable month lengths and fixed intervals", () => {
        expect(nextBarTime(utc(2024, 0, 15), "1M")).toBe(utc(2024, 1, 1));
        expect(nextBarTime(utc(2024, 1, 15), "1M")).toBe(utc(2024, 2, 1));
        expect(nextBarTime(utc(2024, 10, 15), "3M")).toBe(utc(2025, 0, 1));
        expect(nextBarTime(utc(2024, 4, 15, 13, 47), "15")).toBe(utc(2024, 4, 15, 14));
        expect(nextBarTime(utc(2024, 4, 15, 13), "1D")).toBe(utc(2024, 4, 16));
        expect(nextBarTime(utc(2024, 4, 15), "1W")).toBe(utc(2024, 4, 20));
    });
});

describe("alignTime (time zones)", () => {
    const NY = "America/New_York";

    it("computes zone offsets including DST", () => {
        expect(timeZoneOffset(utc(2024, 0, 15), NY)).toBe(-5 * HOUR);
        expect(timeZoneOffset(utc(2024, 6, 15), NY)).toBe(-4 * HOUR);
        expect(timeZoneOffset(utc(2024, 6, 15), "UTC")).toBe(0);
        expect(timeZoneOffset(utc(2024, 6, 15), "Asia/Kolkata")).toBe(5.5 * HOUR);
    });

    it("aligns days to exchange midnight", () => {
        // 2024-01-15 03:00 UTC is still Jan 14 in New York
        expect(alignTime(utc(2024, 0, 15, 3), "1D", { timeZone: NY })).toBe(utc(2024, 0, 14, 5));
        expect(alignTime(utc(2024, 6, 15, 12), "1D", { timeZone: NY })).toBe(utc(2024, 6, 15, 4));
    });

    it("aligns weeks and months in exchange time", () => {
        expect(alignTime(utc(2024, 4, 13, 2), "1W", { timeZone: NY })).toBe(utc(2024, 4, 6, 4)); // Sunday night NY
        expect(alignTime(utc(2024, 5, 1, 2), "1M", { timeZone: NY })).toBe(utc(2024, 4, 1, 4)); // still May in NY
        expect(alignTime(utc(2024, 2, 15), "1M", { timeZone: NY })).toBe(utc(2024, 2, 1, 5)); // before DST switch
    });

    it("keeps intraday buckets in absolute time and handles half-hour zones", () => {
        const t = utc(2024, 4, 15, 13, 47);
        expect(alignTime(t, "15", { timeZone: NY })).toBe(utc(2024, 4, 15, 13, 45));
        expect(alignTime(t, "60", { timeZone: NY })).toBe(utc(2024, 4, 15, 13));
        expect(alignTime(t, "60", { timeZone: "Asia/Kolkata" })).toBe(utc(2024, 4, 15, 13, 30));
    });

    it("nextBarTime crosses DST in exchange time", () => {
        // 2024-03-10: New York springs forward, the day is 23h long
        expect(nextBarTime(utc(2024, 2, 10, 12), "1D", { timeZone: NY })).toBe(utc(2024, 2, 11, 4));
        expect(nextBarTime(utc(2024, 1, 20), "1M", { timeZone: NY })).toBe(utc(2024, 2, 1, 5));
    });
});
