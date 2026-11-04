"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries, LineSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// any array of objects works: here daily OHLC bars plus a "momentum" field (close vs. 10 bars earlier)
const bars = daily.map((d, i) => ({ ...d, momentum: i >= 10 ? d.close - daily[i - 10].close : undefined }));

export default function ChartCanvasAndPanes() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={bars} theme={theme}>
            {/* data, x axis viewport, render loop */}
            <Pane id="price" size={3}>
                {/* a vertical slot with its own price scales */}
                <CandlestickSeries />
                <YAxis />
            </Pane>
            <Pane id="momentum">
                <LineSeries y="momentum" />
                <YAxis />
            </Pane>
            <XAxis /> {/* shared by every pane */}
        </ChartCanvas>
    );
}
