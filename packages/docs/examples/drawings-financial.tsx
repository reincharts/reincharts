"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import {
    type Drawing,
    Drawings,
    DrawingStyleToolbar,
    DrawingToolbar,
    useDrawings,
    ZoomButtons,
} from "@reincharts/interactive";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// a point on the bar `back` bars before the last one
const at = (back: number, price: number) => ({ time: daily[daily.length - 1 - back].date.getTime(), price });

const defaultDrawings: Drawing[] = [
    {
        id: "channel",
        type: "parallelChannel",
        pane: "main",
        points: [at(71, 56.89), at(37, 56.59), at(63, 58.31)],
        style: {},
    },
    {
        id: "fib",
        type: "fibRetracement",
        pane: "main",
        points: [at(32, 56.6), at(24, 60.1)],
        style: { levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map((value) => ({ value })) },
    },
    { id: "long", type: "longPosition", pane: "main", points: [at(12, 58.2), at(1, 61.5), at(1, 57.2)], style: {} },
    { id: "alert", type: "priceLine", pane: "main", points: [at(5, 54)], style: { text: "Alert", color: "#ef4444" } },
];

export default function FinancialDrawingTools() {
    const theme = useDocsChartTheme();
    const drawings = useDrawings({ defaultDrawings });
    return (
        <div className="flex size-full">
            {/* the full toolbar: every built-in tool */}
            <DrawingToolbar controller={drawings} />
            <div className="min-w-0 flex-1">
                <ChartCanvas data={daily} theme={theme} barSpacing={8}>
                    <Pane id="main">
                        <Grid />
                        <CandlestickSeries name="MSFT" />
                        <YAxis />
                        <Legend title="MSFT · 1D" />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                    <Drawings controller={drawings} />
                    <DrawingStyleToolbar controller={drawings} />
                    <ZoomButtons />
                </ChartCanvas>
            </div>
        </div>
    );
}
