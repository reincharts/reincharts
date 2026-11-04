"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Indicator, indicators } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { aggregateBars } from "@reincharts/datafeed";
import { useMemo } from "react";
import { minutes } from "@/lib/data-intraday";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function VolumeIndicators() {
    const theme = useDocsChartTheme();
    // 15-minute bars: VWAP resets every session (day)
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
            <Pane size={3}>
                <Grid />
                <CandlestickSeries name="15m" />
                <Indicator definition={indicators.vwap} />
                <YAxis />
                <Legend title="Intraday · 15m" />
            </Pane>
            <Pane>
                <Indicator definition={indicators.volume} />
                <YAxis />
                <Legend />
            </Pane>
            <Pane>
                <Grid vertical={false} />
                <Indicator definition={indicators.obv} />
                <YAxis />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
