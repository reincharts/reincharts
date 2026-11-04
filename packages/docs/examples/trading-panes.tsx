"use client";
import { ChartCanvas, formatCompact, Pane } from "@reincharts/core";
import { CandlestickSeries, VolumeSeries } from "@reincharts/series";
import { BollingerBands, MACD, MovingAverage, RSI } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, LastValueLabel } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { Watermark } from "@reincharts/annotations";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function TradingPanes() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={7}>
            {/* price pane: candles, two EMAs, Bollinger Bands and volume on an overlay scale */}
            <Pane id="price" size={3} scales={{ volume: { margins: { top: 0.82, bottom: 0 } } }}>
                <Watermark text="MSFT" subtitle="Daily" />
                <Grid />
                <VolumeSeries scale="volume" format={formatCompact} />
                <CandlestickSeries name="MSFT" />
                <MovingAverage type="ema" period={20} color="#f59e0b" />
                <MovingAverage type="ema" period={50} color="#8b5cf6" />
                <BollingerBands />
                <LastValueLabel line />
                <YAxis />
                <Legend title="MSFT · 1D" />
            </Pane>
            {/* oscillators in their own resizable panes */}
            <Pane id="rsi">
                <Grid vertical={false} />
                <RSI />
                <YAxis />
                <Legend />
            </Pane>
            <Pane id="macd">
                <Grid vertical={false} />
                <MACD />
                <YAxis />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair mode="magnet" />
        </ChartCanvas>
    );
}
