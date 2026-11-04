"use client";
import { ChartCanvas, formatCompact, Pane } from "@reincharts/core";
import { CandlestickSeries, VolumeSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function VolumePane() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={8}>
            <Pane id="price" size={3}>
                <Grid />
                <CandlestickSeries name="MSFT" />
                <YAxis />
                <Legend title="MSFT · 1D" />
            </Pane>
            <Pane id="volume">
                <Grid vertical={false} />
                <VolumeSeries format={formatCompact} />
                <YAxis tickFormat={(t) => formatCompact(t.value)} />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
