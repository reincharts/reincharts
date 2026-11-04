"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries, VolumeSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function OverlayScale() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={8}>
            <Pane
                scales={{
                    // price uses the top 70%, the overlay "volume" scale (no axis) the bottom 20%
                    right: { margins: { top: 0.1, bottom: 0.3 } },
                    volume: { margins: { top: 0.8, bottom: 0 } },
                }}
            >
                <Grid />
                <CandlestickSeries name="MSFT" />
                {/* after the candles, so the legend lists MSFT first */}
                <VolumeSeries scale="volume" />
                <YAxis />
                <Legend title="MSFT · 1D" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
