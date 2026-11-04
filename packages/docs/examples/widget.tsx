"use client";
import { TradingChart } from "@reincharts/widget";
import { useState } from "react";
import { createDemoFeed } from "@/lib/demo-feed";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function TradingChartExample() {
    const theme = useDocsChartTheme();
    // any Datafeed works: history pages, realtime bars and symbol search come from it
    const [feed] = useState(() => createDemoFeed());
    return (
        <TradingChart
            datafeed={feed}
            defaultSymbol="REIN"
            defaultResolution="15"
            defaultIndicators={["ema", "rsi"]}
            theme={theme}
        />
    );
}
