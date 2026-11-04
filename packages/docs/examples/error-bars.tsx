"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { ErrorBarSeries, LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Tooltip } from "@reincharts/tooltip";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// mean response time per hour with one standard deviation
const data = Array.from({ length: 16 }, (_, i) => ({
    hour: `${String(i + 6).padStart(2, "0")}:00`,
    mean: 120 + 60 * Math.sin((i - 3) / 3) + (i % 3) * 8,
    sd: 12 + (i % 4) * 6,
}));

export default function ErrorBars() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={data} theme={theme} xAccessor={(d) => d.hour} initialView="fit">
            <Pane>
                <Grid />
                <ErrorBarSeries name="± 1 sd" y="mean" error="sd" />
                <LineSeries name="Mean (ms)" y="mean" curve="monotone" points />
                <YAxis />
                <Tooltip />
            </Pane>
            <XAxis />
            <Crosshair horizontal={false} />
        </ChartCanvas>
    );
}
