"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, LastValueLine } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function CandlestickExample() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={10}>
            <Pane>
                <Grid />
                <CandlestickSeries name="MSFT" />
                <LastValueLine />
                <YAxis />
                <Legend title="MSFT · 1D" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
