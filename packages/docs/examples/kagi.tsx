"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { KagiSeries } from "@reincharts/series";
import { kagi } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useMemo } from "react";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function Kagi() {
    const theme = useDocsChartTheme();
    // kagi() turns time bars into Kagi 3% data: one datum per kagi line
    const data = useMemo(() => kagi(daily, { reversal: 3, reversalType: "percent" }), []);
    return (
        <ChartCanvas data={data} theme={theme} barSpacing={10}>
            <Pane>
                <Grid />
                <KagiSeries name="MSFT" />
                <YAxis />
                <Legend title="MSFT · Kagi 3%" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
