"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { AreaSeries, LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Tooltip } from "@reincharts/tooltip";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const data = Array.from({ length: 30 }, (_, i) => ({
    day: new Date(2026, 8, i + 1),
    visitors: Math.round(2200 + 900 * Math.sin(i / 4) + i * 40),
    returning: Math.round(900 + 300 * Math.cos(i / 5) + i * 18),
}));
type Row = (typeof data)[number];

export default function TooltipExample() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={data} theme={theme} xAccessor={(d) => d.day} initialView="fit" rightOffset={0}>
            <Pane>
                <Grid />
                <AreaSeries<Row> name="Visitors" y="visitors" curve="monotone" />
                <LineSeries<Row> name="Returning" y="returning" curve="monotone" color="#f59e0b" />
                <YAxis />
                {/* a card next to the pointer with every series at the hovered day */}
                <Tooltip />
            </Pane>
            <XAxis />
            <Crosshair horizontal={false} xLabel={false} />
        </ChartCanvas>
    );
}
