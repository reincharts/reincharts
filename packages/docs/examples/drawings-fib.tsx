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
    { id: "retracement", type: "fibRetracement", pane: "main", points: [at(99, 50.4), at(76, 57.7)], style: {} },
    {
        id: "extension",
        type: "fibExtension",
        pane: "main",
        points: [at(34, 56.7), at(24, 60.1), at(11, 57.6)],
        style: {},
    },
    { id: "gann", type: "gannFan", pane: "main", points: [at(55, 55.8), at(40, 57.4)], style: {} },
];

export default function FibTools() {
    const theme = useDocsChartTheme();
    const drawings = useDrawings({ defaultDrawings });
    return (
        <div className="flex size-full flex-col">
            {/* only this group's tools, as a horizontal toolbar */}
            <DrawingToolbar
                controller={drawings}
                tools={["fibRetracement", "fibExtension", "gannFan"]}
                orientation="horizontal"
            />
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
