"use client";
import { TradingChart } from "@reincharts/widget";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function TradingChartData() {
    const theme = useDocsChartTheme();
    // data mode: pass your bars; symbol and resolution are just labels
    return (
        <TradingChart
            data={daily}
            symbol="MSFT"
            resolution="1D"
            defaultChartType="hollowCandles"
            defaultIndicators={[{ definitionId: "bollinger" }, { definitionId: "macd" }]}
            compare={false}
            theme={theme}
        />
    );
}
