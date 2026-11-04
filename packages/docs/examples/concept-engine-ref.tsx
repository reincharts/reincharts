"use client";
import { ChartCanvas, type ChartEngine, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { useRef } from "react";
import { ToolbarButton, WithToolbar } from "@/components/preview/controls";
import { daily, type Bar } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function EngineRef() {
    const theme = useDocsChartTheme();
    const chart = useRef<ChartEngine<Bar>>(null);
    return (
        <WithToolbar
            toolbar={
                <>
                    <ToolbarButton onClick={() => chart.current?.zoomIn()}>zoomIn()</ToolbarButton>
                    <ToolbarButton onClick={() => chart.current?.zoomOut()}>zoomOut()</ToolbarButton>
                    <ToolbarButton onClick={() => chart.current?.resetView()}>resetView()</ToolbarButton>
                    <ToolbarButton onClick={() => chart.current?.fitContent()}>fitContent()</ToolbarButton>
                    <ToolbarButton onClick={() => chart.current?.scrollToRealtime()}>scrollToRealtime()</ToolbarButton>
                    <ToolbarButton
                        onClick={() => chart.current?.setVisibleRange(new Date("2016-01-01"), new Date("2016-06-30"))}
                    >
                        setVisibleRange(…)
                    </ToolbarButton>
                </>
            }
        >
            <ChartCanvas ref={chart} data={daily} theme={theme}>
                <Pane>
                    <CandlestickSeries />
                    <YAxis />
                </Pane>
                <XAxis />
            </ChartCanvas>
        </WithToolbar>
    );
}
