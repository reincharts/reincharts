"use client";
import { ChartCanvas, type ChartEngine, formatCompact, Pane } from "@reincharts/core";
import { CandlestickSeries, VolumeSeries } from "@reincharts/series";
import { MACD, RSI } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useRef } from "react";
import { ToolbarButton, WithToolbar } from "@/components/preview/controls";
import { daily, type Bar } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function Panes() {
    const theme = useDocsChartTheme();
    const chart = useRef<ChartEngine<Bar>>(null);
    return (
        <WithToolbar
            toolbar={
                <>
                    {/* drop the sizes set by dragging separators: back to each pane's `size` */}
                    <ToolbarButton onClick={() => chart.current?.resetPaneSizes()}>Reset pane sizes</ToolbarButton>
                    <span className="text-xs text-fd-muted-foreground">
                        Drag a separator to resize, double-click it to maximize
                    </span>
                </>
            }
        >
            <ChartCanvas ref={chart} data={daily} theme={theme} barSpacing={8}>
                <Pane id="price" size={3}>
                    <Grid />
                    <CandlestickSeries name="MSFT" />
                    <YAxis />
                    <Legend title="MSFT · 1D" />
                </Pane>
                <Pane id="volume">
                    <VolumeSeries format={formatCompact} />
                    <YAxis tickFormat={(t) => formatCompact(t.value)} />
                    <Legend />
                </Pane>
                <Pane id="rsi">
                    <Grid vertical={false} />
                    <RSI />
                    <YAxis />
                    <Legend />
                </Pane>
                <Pane id="macd">
                    <Grid vertical={false} />
                    <MACD />
                    <YAxis />
                    <Legend />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
