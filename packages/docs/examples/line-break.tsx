"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineBreakSeries } from "@reincharts/series";
import { lineBreak } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useMemo } from "react";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function LineBreak() {
    const theme = useDocsChartTheme();
    // lineBreak() turns time bars into 3 line break data: one datum per box
    const data = useMemo(() => lineBreak(daily, { lines: 3 }), []);
    return (
        <ChartCanvas data={data} theme={theme} barSpacing={10}>
            <Pane>
                <Grid />
                <LineBreakSeries name="MSFT" />
                <YAxis />
                <Legend title="MSFT · 3 line break" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
