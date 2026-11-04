"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const data = [12, 18, 15, 26, 22, 31, 28, 35, 30, 41, 37, 44].map((value, i) => ({ month: `M${i + 1}`, value }));
type Row = (typeof data)[number];

export default function LineCurves() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={data} theme={theme} xAccessor={(d) => d.month} initialView="fit">
            <Pane>
                <Grid />
                <LineSeries<Row> name="linear" y={(d) => d.value} color="#a1a1aa" dash="dashed" width={1.5} />
                <LineSeries<Row> name="monotone" y={(d) => d.value + 8} curve="monotone" color="#2962ff" points />
                <LineSeries<Row> name="step" y={(d) => d.value - 8} curve="step" color="#f59e0b" />
                <YAxis />
                <Legend orientation="horizontal" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
