import { lightTheme } from "@reincharts/core";
import { indicators } from "@reincharts/indicators";
import { sourceIndex } from "../src/ChartCell";
import { defaultState, reduceState } from "../src/state";
import { applyIndicatorColors, localZone, zoneLabel, zoneOptions } from "../src/utils";

describe("applyIndicatorColors", () => {
    it("skips the first palette color (line / area main series) and keeps colors stable", () => {
        let s = defaultState();
        const colors: string[] = [];
        for (let i = 0; i < 9; i++) {
            const action = applyIndicatorColors({ type: "addIndicator", definition: indicators.ema }, s, "light");
            s = reduceState(s, action);
            colors.push(s.indicators.at(-1)!.styles.ma!.color!);
        }
        const palette = lightTheme.palette;
        expect(colors).not.toContain(palette[0]);
        expect(colors.slice(0, palette.length - 1)).toEqual(palette.slice(1));
        expect(colors[palette.length - 1]).toBe(palette[1]); // wraps around without palette[0]
    });

    it("keeps explicit colors", () => {
        const action = applyIndicatorColors(
            { type: "addIndicator", definition: indicators.ema, styles: { ma: { color: "#123456" } } },
            defaultState(),
            "dark",
        );
        expect(action.type === "addIndicator" && action.styles?.ma?.color).toBe("#123456");
    });
});

describe("sourceIndex", () => {
    const bars = [1, 2, 3, 4, 5, 6].map((t) => ({ time: t * 1000 }));
    it("is the identity for 1:1 data", () => {
        expect(sourceIndex(bars, bars, 3)).toBe(3);
        const ha = bars.map((b) => ({ ...b }));
        expect(sourceIndex(bars, ha, 4)).toBe(4);
    });
    it("maps transformed bricks to the last bar at or before them", () => {
        const bricks = [{ date: new Date(2000) }, { date: new Date(2000) }, { date: new Date(5500) }];
        expect(sourceIndex(bars, bricks, 0)).toBe(1);
        expect(sourceIndex(bars, bricks, 2)).toBe(4);
    });
});

describe("time zones", () => {
    it("labels zones and lists the browser zone first, plus the current one", () => {
        expect(zoneLabel("America/New_York")).toBe("New York");
        expect(zoneLabel("Etc/UTC")).toBe("UTC");
        expect(zoneLabel("UTC")).toBe("UTC");
        const list = zoneOptions("Pacific/Auckland");
        expect(list[0]).toBe(localZone());
        expect(list).toContain("UTC");
        expect(list.at(-1)).toBe("Pacific/Auckland");
        expect(new Set(list).size).toBe(list.length);
    });
});
