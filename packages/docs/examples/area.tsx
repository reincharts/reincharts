"use client";
import { ChartCanvas, formatCompact, Pane } from "@reincharts/core";
import { AreaSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, LastValueLabel } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { traffic, type TrafficDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function AreaExample() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={traffic} theme={theme} barSpacing={3}>
            <Pane>
                <Grid />
                {/* the gradient is derived from the line color */}
                <AreaSeries<TrafficDay> name="Sessions" y="sessions" color="#3b82f6" />
                <LastValueLabel />
                <YAxis tickFormat={(t) => formatCompact(t.value)} />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
