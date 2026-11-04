"use client";
import { ChartCanvas, ChartOverlay, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function Overlay() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme}>
            <Pane>
                <CandlestickSeries />
                <YAxis />
                <ChartOverlay>
                    <div style={{ padding: 8 }}>MSFT · 1D</div>
                </ChartOverlay>
            </Pane>
            <XAxis />
        </ChartCanvas>
    );
}
