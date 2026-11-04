"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { heikinAshi } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useMemo } from "react";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function HeikinAshiChart() {
    const theme = useDocsChartTheme();
    // heikinAshi() returns new bars (averaged OHLC); draw them with the regular candlestick series
    const bars = useMemo(() => heikinAshi(daily), []);
    return (
        <ChartCanvas data={bars} theme={theme} barSpacing={10}>
            <Pane>
                <Grid />
                <CandlestickSeries name="MSFT" />
                <YAxis />
                <Legend title="MSFT · Heikin Ashi" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
