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

// points are [entry, target, stop]
const defaultDrawings: Drawing[] = [
    {
        id: "long",
        type: "longPosition",
        pane: "main",
        points: [at(30, 56.9), at(19, 60), at(19, 55.9)],
        style: { quantity: 100 },
    },
    { id: "short", type: "shortPosition", pane: "main", points: [at(17, 59.3), at(8, 57.6), at(8, 60.1)], style: {} },
];

export default function PositionTools() {
    const theme = useDocsChartTheme();
    const drawings = useDrawings({ defaultDrawings });
    return (
        <div className="flex size-full flex-col">
            {/* only the position tools, as a horizontal toolbar */}
            <DrawingToolbar controller={drawings} tools={["longPosition", "shortPosition"]} orientation="horizontal" />
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
