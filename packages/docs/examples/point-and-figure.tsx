"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { PointAndFigureSeries } from "@reincharts/series";
import { pointAndFigure } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useMemo } from "react";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function PointAndFigure() {
    const theme = useDocsChartTheme();
    // pointAndFigure() turns time bars into Point & Figure data: one datum per column of X or O
    const data = useMemo(() => pointAndFigure(daily, { boxSize: 0.5, reversal: 3 }), []);
    return (
        <ChartCanvas data={data} theme={theme} barSpacing={10}>
            <Pane>
                <Grid />
                <PointAndFigureSeries name="MSFT" />
                <YAxis />
                <Legend title="MSFT · Point & Figure" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
