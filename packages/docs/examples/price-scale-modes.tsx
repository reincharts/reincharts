"use client";
import { ChartCanvas, Pane, type PriceScaleMode } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function PriceScaleModes() {
    const theme = useDocsChartTheme();
    const [mode, setMode] = useState<PriceScaleMode>("percent");
    return (
        <WithToolbar
            toolbar={
                <Segmented
                    label="mode"
                    value={mode}
                    options={["linear", "log", "percent", "indexed"] as const}
                    onChange={setMode}
                />
            }
        >
            <ChartCanvas data={daily} theme={theme} barSpacing={4}>
                <Pane scales={{ right: { mode } }}>
                    <Grid />
                    <CandlestickSeries />
                    <YAxis />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
