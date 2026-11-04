import { indicators } from "@reincharts/indicators";
import {
    defaultState,
    indicatorPanes,
    layoutCount,
    nextIndicatorId,
    normalizeState,
    paneIdFor,
    parseState,
    PRICE_PANE,
    reduceState,
    serializeState,
    type TradingChartState,
} from "../src/state";

const base = () => defaultState({ symbol: "AAPL" });

describe("reduceState", () => {
    it("returns the same object when nothing changes", () => {
        const s = base();
        expect(reduceState(s, { type: "symbol", symbol: "AAPL" })).toBe(s);
        expect(reduceState(s, { type: "resolution", resolution: "1D" })).toBe(s);
        expect(reduceState(s, { type: "chartType", chartType: "candles" })).toBe(s);
        expect(reduceState(s, { type: "scaleMode", mode: "linear" })).toBe(s);
        expect(reduceState(s, { type: "removeIndicator", id: "nope" })).toBe(s);
        expect(reduceState(s, { type: "removeAllIndicators" })).toBe(s);
        expect(reduceState(s, { type: "removeCompare", symbol: "X" })).toBe(s);
        expect(reduceState(s, { type: "updateIndicator", id: "nope", patch: { hidden: true } })).toBe(s);
    });

    it("changes symbol, resolution, chart type and scale mode", () => {
        let s: TradingChartState = { ...base(), visibleRange: { from: 1, to: 2 } };
        s = reduceState(s, { type: "symbol", symbol: "MSFT" });
        expect(s.symbol).toBe("MSFT");
        expect(s.visibleRange).toBeUndefined();
        s = reduceState(s, { type: "resolution", resolution: "60" });
        s = reduceState(s, { type: "chartType", chartType: "renko" });
        s = reduceState(s, { type: "scaleMode", mode: "log" });
        expect(s).toMatchObject({ resolution: "60", chartType: "renko", scaleMode: "log" });
    });

    it("sets per-cell symbols", () => {
        let s = reduceState(base(), { type: "symbol", symbol: "TSLA", cell: 2 });
        expect(s.cells).toEqual(["AAPL", "TSLA"]);
        s = reduceState(s, { type: "symbol", symbol: "NVDA", cell: 1 });
        expect(s.cells).toEqual(["NVDA", "TSLA"]);
        expect(reduceState(s, { type: "symbol", symbol: "NVDA", cell: 1 })).toBe(s);
    });

    it("adds overlays to the price pane and oscillators to new panes with deterministic ids", () => {
        let s = reduceState(base(), { type: "addIndicator", definition: indicators.ema });
        s = reduceState(s, { type: "addIndicator", definition: indicators.ema, inputs: { period: 50 } });
        s = reduceState(s, { type: "addIndicator", definition: indicators.rsi });
        expect(s.indicators.map((i) => [i.id, i.paneId])).toEqual([
            ["ema-1", PRICE_PANE],
            ["ema-2", PRICE_PANE],
            ["rsi-1", paneIdFor("rsi-1")],
        ]);
        expect(s.indicators[1].inputs).toEqual({ period: 50 });
        expect(indicatorPanes(s)).toEqual(["pane-rsi-1"]);
    });

    it("honours explicit ids and panes, and avoids duplicates", () => {
        let s = reduceState(base(), { type: "addIndicator", definition: indicators.macd, id: "m" });
        s = reduceState(s, { type: "addIndicator", definition: indicators.rsi, paneId: "pane-m" });
        s = reduceState(s, { type: "addIndicator", definition: indicators.rsi, id: "m" });
        expect(s.indicators.map((i) => i.id)).toEqual(["m", "rsi-1", "rsi-2"]);
        expect(indicatorPanes(s)).toEqual(["pane-m", "pane-rsi-2"]);
    });

    it("updates, hides and removes indicators (dropping empty pane sizes)", () => {
        let s = reduceState(base(), { type: "addIndicator", definition: indicators.rsi });
        s = { ...s, paneSizes: { price: 3, "pane-rsi-1": 2 } };
        s = reduceState(s, { type: "updateIndicator", id: "rsi-1", patch: { inputs: { period: 7 }, hidden: true } });
        expect(s.indicators[0]).toMatchObject({ inputs: { period: 7 }, hidden: true });
        s = reduceState(s, { type: "removeIndicator", id: "rsi-1" });
        expect(s.indicators).toEqual([]);
        expect(s.paneSizes).toEqual({ price: 3 });
    });

    it("removes all indicators", () => {
        let s = reduceState(base(), { type: "addIndicator", definition: indicators.rsi });
        s = reduceState(s, { type: "addIndicator", definition: indicators.sma });
        s = reduceState(s, { type: "removeAllIndicators" });
        expect(s.indicators).toEqual([]);
        expect(s.paneSizes).toBeUndefined();
    });

    it("adds compare symbols (switching to percent) and removes them", () => {
        let s = reduceState(base(), { type: "addCompare", symbol: "MSFT" });
        expect(s.compare).toEqual(["MSFT"]);
        expect(s.scaleMode).toBe("percent");
        expect(reduceState(s, { type: "addCompare", symbol: "MSFT" })).toBe(s);
        expect(reduceState(s, { type: "addCompare", symbol: "AAPL" })).toBe(s);
        expect(reduceState(s, { type: "addCompare", symbol: "  " })).toBe(s);
        s = reduceState(s, { type: "removeCompare", symbol: "MSFT" });
        expect(s.compare).toBeUndefined();
        // switching the main symbol to a compared one removes it from compare
        s = reduceState(reduceState(s, { type: "addCompare", symbol: "X" }), { type: "symbol", symbol: "X" });
        expect(s.compare).toEqual([]);
    });

    it("toggles favorites, theme, layout, settings, drawings", () => {
        let s = reduceState(base(), { type: "toggleFavorite", resolution: "1D" });
        expect(s.favorites).not.toContain("1D");
        s = reduceState(s, { type: "toggleFavorite", resolution: "1D" });
        expect(s.favorites).toContain("1D");
        s = reduceState(s, { type: "theme", theme: "dark" });
        s = reduceState(s, { type: "layout", layout: "4" });
        s = reduceState(s, { type: "settings", settings: { volume: false } });
        s = reduceState(s, { type: "settings", settings: { grid: false } });
        const drawings = [{ id: "d1" }];
        s = reduceState(s, { type: "drawings", drawings });
        expect(s).toMatchObject({ theme: "dark", layout: "4", settings: { volume: false, grid: false } });
        expect(s.drawings).toBe(drawings);
        expect(reduceState(s, { type: "drawings", drawings })).toBe(s);
        const loaded = defaultState({ symbol: "Z" });
        expect(reduceState(s, { type: "load", state: loaded })).toBe(loaded);
        expect(reduceState(s, { type: "paneSizes", sizes: { price: 2 } }).paneSizes).toEqual({ price: 2 });
        expect(reduceState(s, { type: "visibleRange", range: { from: 1, to: 2 } }).visibleRange).toEqual({
            from: 1,
            to: 2,
        });
    });

    it("computes layout counts and next ids", () => {
        expect(["single", "2h", "2v", "3", "4", undefined].map((l) => layoutCount(l as any))).toEqual([
            1, 2, 2, 3, 4, 1,
        ]);
        expect(nextIndicatorId([{ id: "rsi-1" } as any, { id: "rsi-3" } as any], "rsi")).toBe("rsi-2");
    });
});

describe("serialization", () => {
    const full: TradingChartState = {
        symbol: "AAPL",
        resolution: "60",
        chartType: "heikinAshi",
        scaleMode: "log",
        indicators: [
            {
                id: "ema-1",
                definitionId: "ema",
                inputs: { period: 21 },
                styles: { ma: { color: "#f00" } },
                paneId: "price",
            },
            { id: "rsi-1", definitionId: "rsi", inputs: {}, styles: {}, paneId: "pane-rsi-1", hidden: true },
        ],
        drawings: [{ id: "d1", type: "trendLine" }],
        compare: ["MSFT"],
        paneSizes: { price: 3, "pane-rsi-1": 1 },
        visibleRange: { from: 1000, to: 2000 },
        theme: "dark",
        layout: "2h",
        cells: ["TSLA"],
        favorites: ["1", "1D"],
        settings: { crosshair: "magnet", volume: false },
    };

    it("round-trips through JSON", () => {
        expect(parseState(serializeState(full))).toEqual(full);
    });

    it("fills defaults and drops invalid values", () => {
        const s = normalizeState(
            {
                symbol: 5,
                resolution: "",
                chartType: "pie",
                scaleMode: "weird",
                indicators: [
                    { id: "a", definitionId: "sma" },
                    { id: "a", definitionId: "ema" },
                    { definitionId: "x" },
                    "junk",
                ],
                drawings: "no",
                compare: ["A", 3],
                paneSizes: { price: -1, other: "x" },
                visibleRange: { from: 5, to: 1 },
                theme: "blue",
                layout: "9",
                extra: true,
            },
            { symbol: "DEF" },
        );
        expect(s).toEqual({
            symbol: "DEF",
            resolution: "1D",
            chartType: "candles",
            scaleMode: "linear",
            indicators: [{ id: "a", definitionId: "sma", inputs: {}, styles: {}, paneId: "price" }],
            drawings: [],
            compare: ["A"],
        });
    });

    it("parses garbage as defaults", () => {
        expect(parseState("{not json", { symbol: "X" })).toEqual(defaultState({ symbol: "X" }));
        expect(parseState(null)).toEqual(defaultState());
        expect(parseState({ symbol: "Y" }).symbol).toBe("Y");
    });
});
