"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { MovingAverage } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function MovingAverages() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={8}>
            <Pane>
                <Grid />
                <CandlestickSeries name="MSFT" />
                <MovingAverage type="sma" period={50} color="#2962ff" />
                <MovingAverage type="ema" period={20} color="#f59e0b" />
                <MovingAverage type="wma" period={20} color="#ec4899" />
                <MovingAverage type="hma" period={20} color="#10b981" />
                <MovingAverage type="vwma" period={20} color="#8b5cf6" />
                <YAxis />
                <Legend title="MSFT · 1D" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
