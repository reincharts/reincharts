"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries, VolumeSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function PriceScales() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme}>
            <Pane scales={{ right: { mode: "log" }, volume: { margins: { top: 0.8, bottom: 0 } } }}>
                <CandlestickSeries /> {/* on the "right" scale (log) */}
                <VolumeSeries scale="volume" /> {/* on its own scale, in the bottom 20% */}
                <YAxis /> {/* labels of the "right" scale */}
            </Pane>
            <XAxis />
        </ChartCanvas>
    );
}
