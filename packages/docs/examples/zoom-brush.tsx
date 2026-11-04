"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { AreaSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Brush, type BrushRange, ZoomButtons } from "@reincharts/interactive";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { traffic, type TrafficDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function ZoomAndBrush() {
    const theme = useDocsChartTheme();
    const [mode, setMode] = useState<"pan" | "brush">("brush");
    const [range, setRange] = useState<BrushRange>();
    return (
        <WithToolbar
            toolbar={
                <>
                    <Segmented label="drag to" value={mode} options={["pan", "brush"] as const} onChange={setMode} />
                    <span className="text-xs text-fd-muted-foreground">
                        {range
                            ? `selected ${range.endIndex - range.startIndex + 1} days`
                            : "drag over the chart to zoom into a range"}
                    </span>
                </>
            }
        >
            <ChartCanvas data={traffic} theme={theme} initialView="fit">
                <Pane>
                    <Grid />
                    <AreaSeries<TrafficDay> name="Sessions" y="sessions" />
                    <YAxis />
                    <Brush enabled={mode === "brush"} onSelect={setRange} />
                </Pane>
                <XAxis />
                <Crosshair />
                {/* zoom in / out, scroll and reset buttons */}
                <ZoomButtons autoHide={false} />
            </ChartCanvas>
        </WithToolbar>
    );
}
