"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { daily, type Bar } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// highlight unusually large ranges (high - low > 2% of the close)
const isWide = (d: Bar) => (d.high - d.low) / d.close > 0.02;

export default function CandleColors() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={10}>
            <Pane>
                <Grid />
                <CandlestickSeries<Bar>
                    upColor="#26a69a"
                    downColor="#ef5350"
                    fill={(d) => (isWide(d) ? "#f59e0b" : d.close >= d.open ? "#26a69a" : "#ef5350")}
                    widthRatio={0.6}
                />
                <YAxis />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
