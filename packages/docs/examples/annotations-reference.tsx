"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { AreaSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Tooltip } from "@reincharts/tooltip";
import { ReferenceArea, ReferenceDot, ReferenceLine } from "@reincharts/annotations";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const data = Array.from({ length: 60 }, (_, i) => ({
    x: i,
    latency: 180 + 70 * Math.sin(i / 5) + (i % 7) * 9 + (i > 38 && i < 46 ? 120 : 0),
}));
type Row = (typeof data)[number];
const peak = data.reduce((a, b) => (b.latency > a.latency ? b : a));

export default function ReferenceExample() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={data} theme={theme} xMode="linear">
            <Pane>
                <Grid />
                <ReferenceArea x1={38} x2={46} label="Incident" color="#ef4444" />
                <ReferenceArea y1={0} y2={200} color="#10b981" opacity={0.06} label="SLO" labelAlign="right" />
                <AreaSeries<Row> name="p95 latency (ms)" y="latency" curve="monotone" />
                <ReferenceLine y={300} label="Alert threshold" color="#f59e0b" />
                <ReferenceDot
                    x={peak.x}
                    y={peak.latency}
                    label={`Peak ${Math.round(peak.latency)} ms`}
                    color="#ef4444"
                />
                <YAxis />
                <Tooltip />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
