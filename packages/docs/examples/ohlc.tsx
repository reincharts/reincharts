"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { OHLCSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function OHLCBars() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={9}>
            <Pane>
                <Grid />
                <OHLCSeries name="MSFT" />
                <YAxis />
                <Legend title="MSFT · Bars" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
