"use client";
import { bollinger, defineIndicator } from "@reincharts/indicators";
import { TradingChart } from "@reincharts/widget";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

/** Bollinger %B: where the close sits inside the bands. */
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
    outputs: { pb: { type: "line", label: "%B", color: "#0ea5e9" } },
    levels: [{ value: 1 }, { value: 0 }],
    fills: [{ between: [1, 0], color: "rgba(14, 165, 233, 0.08)" }],
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

export default function WidgetCustomIndicator() {
    const theme = useDocsChartTheme();
    return (
        <TradingChart
            data={daily}
            symbol="MSFT"
            // listed under "Custom" in the indicators dialog, usable in defaultIndicators and saved layouts
            extraIndicators={[percentB]}
            defaultIndicators={[{ definitionId: "bollinger" }, { definitionId: "percentB" }]}
            theme={theme}
        />
    );
}
