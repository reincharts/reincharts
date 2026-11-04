"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { AreaSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Tooltip } from "@reincharts/tooltip";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// any array of objects works: here, 90 days of page views
const data = Array.from({ length: 90 }, (_, i) => ({
    date: new Date(2026, 0, 1 + i),
    views: Math.round(1200 + 400 * Math.sin(i / 8) + i * 9 + ((i * 37) % 11) * 25),
}));

export default function QuickStart() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={data} theme={theme} initialView="fit" rightOffset={0}>
            <Pane>
                <Grid />
                <AreaSeries name="Page views" y="views" curve="monotone" />
                <YAxis />
                <Tooltip />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
