"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { RenkoSeries } from "@reincharts/series";
import { renko } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useMemo } from "react";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function Renko() {
    const theme = useDocsChartTheme();
    // renko() turns time bars into Renko data: one datum per brick
    const data = useMemo(() => renko(daily, { boxSize: 0.5 }), []);
    return (
        <ChartCanvas data={data} theme={theme} barSpacing={10}>
            <Pane>
                <Grid />
                <RenkoSeries name="MSFT" />
                <YAxis />
                <Legend title="MSFT · Renko" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
