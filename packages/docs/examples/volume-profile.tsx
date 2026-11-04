"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries, VolumeProfileSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function VolumeProfile() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={6}>
            <Pane>
                <Grid />
                {/* volume by price over the visible bars, with the point of control */}
                <VolumeProfileSeries bins={30} maxWidth={0.25} />
                <CandlestickSeries />
                <YAxis />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
