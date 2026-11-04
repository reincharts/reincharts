"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// unevenly spaced numeric x values: a damped oscillation sampled more densely near 0
const data = Array.from({ length: 160 }, (_, i) => {
    const x = (i / 160) ** 1.6 * 40;
    return { x, y: Math.exp(-x / 14) * Math.sin(x), envelope: Math.exp(-x / 14) };
});
type Row = (typeof data)[number];

export default function LinearX() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={data} theme={theme} xMode="linear">
            <Pane>
                <Grid />
                <LineSeries<Row> name="envelope" y="envelope" color="#a1a1aa" dash="dashed" width={1} />
                <LineSeries<Row> name="signal" y="y" curve="monotone" />
                <YAxis />
                <Legend orientation="horizontal" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
