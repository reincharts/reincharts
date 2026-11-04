"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { HLCAreaSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function HLCArea() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={6}>
            <Pane>
                <Grid />
                <HLCAreaSeries name="MSFT" />
                <YAxis />
                <Legend title="MSFT · HLC area" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
