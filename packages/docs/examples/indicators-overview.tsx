"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { BollingerBands, MACD, MovingAverage, RSI } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function IndicatorsOverview() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={8}>
            <Pane id="price" size={3}>
                <Grid />
                <CandlestickSeries name="MSFT" />
                {/* overlays share the price scale */}
                <MovingAverage type="ema" period={20} color="#f59e0b" />
                <BollingerBands />
                <YAxis />
                <Legend title="MSFT · 1D" />
            </Pane>
            {/* oscillators get their own panes */}
            <Pane id="rsi">
                <Grid vertical={false} />
                <RSI />
                <YAxis />
                <Legend />
            </Pane>
            <Pane id="macd">
                <Grid vertical={false} />
                <MACD />
                <YAxis />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
