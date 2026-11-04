"use client";
// Landing page hero: the batteries-included <TradingChart> on a live demo datafeed.
import { TradingChart } from "@reincharts/widget";
import { useState } from "react";
import { createDemoFeed } from "@/lib/demo-feed";
import { useDocsChartTheme } from "@/lib/use-docs-theme";
import { useMediaQuery } from "@/lib/use-media-query";

export function HeroChart() {
    const theme = useDocsChartTheme();
    const wide = useMediaQuery("(min-width: 768px)");
    // 30x simulated speed: a new 5-minute bar every 10 seconds
    const [feed] = useState(() => createDemoFeed(30));
    return (
        <TradingChart
            datafeed={feed}
            defaultSymbol="REIN"
            defaultResolution="5"
            defaultIndicators={["ema", { definitionId: "ema", inputs: { period: 50 } }, { definitionId: "rsi" }]}
            theme={theme}
            drawingToolbar={wide}
            bottomBar={wide}
        />
    );
}
