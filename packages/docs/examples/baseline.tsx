"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { BaselineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function BaselineExample() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={4}>
            <Pane>
                <Grid />
                {/* green above 55, red below */}
                <BaselineSeries name="MSFT" base={55} />
                <YAxis />
                <Legend title="MSFT · Baseline 55" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
