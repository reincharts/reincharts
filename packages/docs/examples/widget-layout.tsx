"use client";
import { type LayoutKind, TradingChart } from "@reincharts/widget";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { createDemoFeed } from "@/lib/demo-feed";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const layouts = ["single", "2h", "2v", "3", "4"] as const;

export default function MultiChartLayout() {
    const theme = useDocsChartTheme();
    const [feed] = useState(() => createDemoFeed());
    const [layout, setLayout] = useState<LayoutKind>("4");
    return (
        <WithToolbar toolbar={<Segmented label="layout" value={layout} options={layouts} onChange={setLayout} />}>
            <TradingChart
                datafeed={feed}
                defaultSymbol="REIN"
                defaultResolution="60"
                // the other charts of the grid show these symbols
                defaultState={{ cells: ["ACME", "GLOBX", "BTCD"] }}
                layout={layout}
                onLayoutChange={setLayout}
                // crosshairs are always synced; syncRange also pans / zooms them together
                syncRange
                drawingToolbar={false}
                theme={theme}
            />
        </WithToolbar>
    );
}
