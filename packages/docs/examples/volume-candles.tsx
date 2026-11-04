"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { VolumeCandlesSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

type Mode = "color" | "width" | "both";

export default function VolumeCandles() {
    const theme = useDocsChartTheme();
    const [mode, setMode] = useState<Mode>("color");
    return (
        <WithToolbar
            toolbar={
                <Segmented label="mode" value={mode} options={["color", "width", "both"] as const} onChange={setMode} />
            }
        >
            <ChartCanvas data={daily} theme={theme} barSpacing={12}>
                <Pane>
                    <Grid />
                    {/* opacity ("color") and / or body width ("width", equivolume) follow the volume */}
                    <VolumeCandlesSeries name="MSFT" mode={mode} />
                    <YAxis />
                    <Legend title="MSFT · Volume candles" />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
