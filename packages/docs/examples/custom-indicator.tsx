"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { bollinger, defineIndicator, Indicator } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

/** Bollinger %B: where the close sits inside the bands (0 = lower band, 1 = upper band). */
const percentB = defineIndicator<{ period: number; multiplier: number }>({
    id: "percentB",
    name: "Bollinger %B",
    shortName: "%B",
    category: "volatility",
    overlay: false,
    inputs: {
        period: { type: "number", label: "Length", default: 20, min: 1 },
        multiplier: { type: "number", label: "StdDev", default: 2, min: 0.1, step: 0.1 },
    },
    outputs: {
        pb: {
            type: "line",
            label: "%B",
            color: "#0ea5e9",
            // red above the upper band, green below the lower band
            colorFn: (v) => (v > 1 ? "#ef4444" : v < 0 ? "#10b981" : "#0ea5e9"),
        },
    },
    levels: [{ value: 1 }, { value: 0.5 }, { value: 0 }],
    fills: [{ between: [1, 0], color: "rgba(14, 165, 233, 0.08)" }],
    scale: { precision: 2 },
    calculate(data, { period, multiplier }) {
        const { upper, lower } = bollinger(data, { period, multiplier });
        return {
            pb: data.map((d, i) => {
                const [u, l] = [upper[i], lower[i]];
                return u === undefined || l === undefined || u === l ? undefined : (d.close - l) / (u - l);
            }),
        };
    },
});

export default function CustomIndicator() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={8}>
            <Pane size={2}>
                <Grid />
                <CandlestickSeries name="MSFT" />
                <YAxis />
                <Legend title="MSFT · 1D" />
            </Pane>
            <Pane>
                <Grid vertical={false} />
                <Indicator definition={percentB} inputs={{ period: 20 }} />
                <YAxis />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
