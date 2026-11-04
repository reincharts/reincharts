"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { BarSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Tooltip } from "@reincharts/tooltip";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const data = [
    { month: "Jan", revenue: 18.6 },
    { month: "Feb", revenue: 30.5 },
    { month: "Mar", revenue: 23.7 },
    { month: "Apr", revenue: 7.3 },
    { month: "May", revenue: 20.9 },
    { month: "Jun", revenue: 21.4 },
    { month: "Jul", revenue: 26.1 },
    { month: "Aug", revenue: 33.8 },
];

export default function Bars() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={data} theme={theme} xAccessor={(d) => d.month} initialView="fit">
            <Pane>
                <Grid vertical={false} />
                <BarSeries name="Revenue (k$)" y="revenue" radius={4} widthRatio={0.6} />
                <YAxis />
                <Tooltip />
            </Pane>
            <XAxis />
            <Crosshair horizontal={false} />
        </ChartCanvas>
    );
}
