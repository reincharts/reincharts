"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const data = [
    { month: "Jan", visitors: 4200, signups: 310 },
    { month: "Feb", visitors: 5100, signups: 420 },
    { month: "Mar", visitors: 4800, signups: 390 },
    { month: "Apr", visitors: 6900, signups: 610 },
    { month: "May", visitors: 7400, signups: 640 },
    { month: "Jun", visitors: 8800, signups: 820 },
    { month: "Jul", visitors: 8100, signups: 790 },
    { month: "Aug", visitors: 9600, signups: 930 },
];

export default function CategoryX() {
    const theme = useDocsChartTheme();
    return (
        // string x values → category axis (xType is detected from the first datum)
        <ChartCanvas data={data} theme={theme} xAccessor={(d) => d.month} initialView="fit">
            <Pane>
                <Grid />
                <LineSeries name="Visitors" y="visitors" curve="monotone" points />
                <LineSeries name="Sign-ups" y="signups" scale="signups" color="#f59e0b" curve="monotone" points />
                <YAxis />
                <YAxis side="left" scale="signups" />
                <Legend orientation="horizontal" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
