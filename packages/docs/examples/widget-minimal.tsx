"use client";
import { TradingChart } from "@reincharts/widget";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function MinimalTradingChart() {
    const theme = useDocsChartTheme();
    // every part of the UI can be switched off
    return (
        <TradingChart
            data={daily}
            symbol="MSFT"
            toolbar={false}
            drawingToolbar={false}
            bottomBar={false}
            watermark={false}
            defaultChartType="area"
            crosshair="magnet"
            theme={theme}
        />
    );
}
