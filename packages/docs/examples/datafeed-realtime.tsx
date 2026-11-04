"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, LastValueLabel } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { createRandomDatafeed, useDatafeed } from "@reincharts/datafeed";
import { useState } from "react";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function RealtimeDatafeed() {
    const theme = useDocsChartTheme();
    // a seeded random walk with a realtime ticker; 60x speed = one minute of market time per second
    const [feed] = useState(() =>
        createRandomDatafeed({ symbols: ["DEMO"], seed: 7, speed: 60, realtimeIntervalMs: 500 }),
    );
    const { data, loadMore } = useDatafeed(feed, { symbol: "DEMO", resolution: "1" });
    return (
        // scrolling to the first bar loads the previous page of history
        <ChartCanvas data={data} theme={theme} barSpacing={8} onReachStart={loadMore}>
            <Pane>
                <Grid />
                <CandlestickSeries name="DEMO" />
                <LastValueLabel line />
                <YAxis />
                <Legend title="DEMO · 1m · live" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
