"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { OHLCSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function HLCBars() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={14}>
            <Pane>
                <Grid />
                {/* HLC bars: no open tick, a single neutral color, thicker lines */}
                <OHLCSeries hlc color="#71717a" thickness={2} />
                <YAxis />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
