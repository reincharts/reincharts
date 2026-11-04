"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries, LineSeries } from "@reincharts/series";
import { ema } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { Label, Markers, Watermark } from "@reincharts/annotations";
import { useMemo } from "react";
import { daily, type Bar } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

type Row = Bar & { fast?: number; slow?: number; signal?: "buy" | "sell" };

export default function MarkersExample() {
    const theme = useDocsChartTheme();
    // EMA 5 / EMA 13 crossovers as buy / sell signals
    const data = useMemo<Row[]>(() => {
        const fast = ema(daily, { period: 5 });
        const slow = ema(daily, { period: 13 });
        return daily.map((d, i) => {
            const [f, s, pf, ps] = [fast[i], slow[i], fast[i - 1], slow[i - 1]];
            const cross =
                f !== undefined && s !== undefined && pf !== undefined && ps !== undefined
                    ? Math.sign(f - s) - Math.sign(pf - ps)
                    : 0;
            return { ...d, fast: f, slow: s, signal: cross > 0 ? "buy" : cross < 0 ? "sell" : undefined };
        });
    }, []);
    return (
        <ChartCanvas data={data} theme={theme} barSpacing={9}>
            <Pane>
                <Watermark text="MSFT" subtitle="1D · NASDAQ" />
                <Grid />
                <CandlestickSeries name="MSFT" />
                <LineSeries<Row> name="EMA 5" y="fast" color="#f59e0b" width={1.5} />
                <LineSeries<Row> name="EMA 13" y="slow" color="#8b5cf6" width={1.5} />
                <Markers<Row>
                    when={(d) => d.signal !== undefined}
                    position={(d) => (d.signal === "buy" ? "below" : "above")}
                    text={(d) => (d.signal === "buy" ? "Buy" : "Sell")}
                />
                <Label
                    text="EMA crossover strategy"
                    units="pixel"
                    x={12}
                    y={-12}
                    baseline="bottom"
                    color={theme.textMuted}
                />
                <YAxis />
                <Legend title="MSFT · 1D" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
