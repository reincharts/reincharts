import * as reincharts from "../src";

describe("reincharts umbrella", () => {
    it("re-exports the public API of every package", () => {
        const expected = [
            // core
            "ChartCanvas",
            "Pane",
            "ChartOverlay",
            "ChartEngine",
            "useChart",
            "useRenderable",
            "useHitTarget",
            "useChartEvent",
            "useChartState",
            "lightTheme",
            "darkTheme",
            "createTheme",
            // series
            "CandlestickSeries",
            "LineSeries",
            "AreaSeries",
            "BarSeries",
            "HorizontalBarSeries",
            "ScatterSeries",
            "RenkoSeries",
            "useSeries",
            // indicators
            "Indicator",
            "indicators",
            "defineIndicator",
            "ema",
            "rsi",
            "heikinAshi",
            // axes
            "XAxis",
            "YAxis",
            "Grid",
            // coordinates
            "Crosshair",
            "PriceLine",
            "LastValueLabel",
            // tooltip
            "Legend",
            "Tooltip",
            // annotations
            "Markers",
            "Watermark",
            "ReferenceLine",
            // interactive
            "useDrawings",
            "Drawings",
            "DrawingToolbar",
            "defineTool",
            // datafeed
            "useDatafeed",
            "createRandomDatafeed",
            "parseCsv",
            // widget
            "TradingChart",
        ];
        for (const name of expected) {
            expect(reincharts, name).toHaveProperty(name);
        }
    });
});
