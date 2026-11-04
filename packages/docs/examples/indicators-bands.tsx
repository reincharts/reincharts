"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Indicator, indicators } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const ids = ["bollinger", "keltner", "donchian", "envelope"] as const;

export default function BandsAndChannels() {
    const theme = useDocsChartTheme();
    const [id, setId] = useState<(typeof ids)[number]>("bollinger");
    return (
        <WithToolbar toolbar={<Segmented label="indicator" value={id} options={ids} onChange={setId} />}>
            <ChartCanvas data={daily} theme={theme} barSpacing={8}>
                <Pane>
                    <Grid />
                    <CandlestickSeries name="MSFT" />
                    {/* key: remount when the definition changes (new legend item / styles) */}
                    <Indicator key={id} definition={indicators[id]} />
                    <YAxis />
                    <Legend title="MSFT · 1D" />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
