"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { type Drawing, Drawings, DrawingStyleToolbar, DrawingToolbar, useDrawings } from "@reincharts/interactive";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// a point on the bar `back` bars before the last one
const at = (back: number, price: number) => ({ time: daily[daily.length - 1 - back].date.getTime(), price });

const defaultDrawings: Drawing[] = [
    { id: "low", type: "priceLabel", pane: "main", points: [at(54, 55.83)], style: {} },
    { id: "high", type: "priceLabel", pane: "main", points: [at(22, 60.96)], style: {} },
    { id: "target", type: "priceLine", pane: "main", points: [at(5, 62)], style: { text: "Target", color: "#10b981" } },
    { id: "stop", type: "priceLine", pane: "main", points: [at(5, 57.2)], style: { text: "Stop", color: "#ef4444" } },
];

export default function PriceLabelTools() {
    const theme = useDocsChartTheme();
    const drawings = useDrawings({ defaultDrawings });
    return (
        <div className="flex size-full flex-col">
            {/* only the price tools, as a horizontal toolbar */}
            <DrawingToolbar controller={drawings} tools={["priceLabel", "priceLine"]} orientation="horizontal" />
            <div className="min-h-0 flex-1">
                <ChartCanvas data={daily} theme={theme} barSpacing={8}>
                    <Pane id="main">
                        <Grid />
                        <CandlestickSeries />
                        <YAxis />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                    <Drawings controller={drawings} />
                    <DrawingStyleToolbar controller={drawings} />
                </ChartCanvas>
            </div>
        </div>
    );
}
