"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { ColumnsSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function Columns() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={7}>
            <Pane>
                <Grid />
                {/* columns: close prices as columns, colored by the change from the previous bar */}
                <ColumnsSeries name="MSFT" />
                <YAxis />
                <Legend title="MSFT · Columns" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
