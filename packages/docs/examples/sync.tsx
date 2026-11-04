"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { AreaSeries, BarSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { traffic, type TrafficDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function SyncedCharts() {
    const theme = useDocsChartTheme();
    return (
        <div className="grid size-full grid-rows-2 divide-y divide-fd-border">
            {/* same syncId → shared crosshair; syncRange → shared pan / zoom */}
            <ChartCanvas data={traffic} theme={theme} syncId="docs-sync" syncRange barSpacing={6}>
                <Pane>
                    <Grid />
                    <AreaSeries<TrafficDay> name="Sessions" y="sessions" />
                    <YAxis width={64} />
                    <Legend />
                </Pane>
                <Crosshair />
            </ChartCanvas>
            <ChartCanvas data={traffic} theme={theme} syncId="docs-sync" syncRange barSpacing={6}>
                <Pane>
                    <Grid />
                    <BarSeries<TrafficDay> name="Sign-ups" y="signups" fill="#8b5cf6" />
                    <YAxis width={64} />
                    <Legend />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </div>
    );
}
