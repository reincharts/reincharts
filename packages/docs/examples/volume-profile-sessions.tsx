"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries, VolumeProfileSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { aggregateBars, type Bar } from "@reincharts/datafeed";
import { useMemo } from "react";
import { minutes } from "@/lib/data-intraday";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function SessionVolumeProfile() {
    const theme = useDocsChartTheme();
    // 1-minute bars → 15-minute bars (aggregateBars from @reincharts/datafeed)
    const bars = useMemo(
        () =>
            aggregateBars(
                minutes.map((d) => ({ ...d, time: d.date.getTime() })),
                "15",
            ).map((b) => ({ ...b, date: new Date(b.time) })),
        [],
    );
    return (
        <ChartCanvas data={bars} theme={theme} barSpacing={7}>
            <Pane>
                <Grid />
                {/* a new profile every trading day, growing from the left of each session */}
                <VolumeProfileSeries<Bar & { date: Date }>
                    side="left"
                    bins={16}
                    maxWidth={0.8}
                    sessionStart={(d, _i, prev) => d.date.getDate() !== prev.date.getDate()}
                />
                <CandlestickSeries />
                <YAxis />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
