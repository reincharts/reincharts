"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function HollowCandles() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={12}>
            <Pane>
                <Grid />
                <CandlestickSeries name="MSFT" hollow />
                <YAxis />
                <Legend title="MSFT · Hollow candles" />
            </Pane>
            <XAxis />
            <Crosshair mode="magnet" />
        </ChartCanvas>
    );
}
