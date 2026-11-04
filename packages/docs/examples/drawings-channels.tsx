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
    // two points for the base line, the third sets the width
    {
        id: "channel",
        type: "parallelChannel",
        pane: "main",
        points: [at(71, 56.89), at(37, 56.59), at(63, 58.31)],
        style: {},
    },
    {
        id: "pitchfork",
        type: "pitchfork",
        pane: "main",
        points: [at(25, 56.28), at(22, 60.96), at(14, 58.13)],
        style: { color: "#8b5cf6" },
    },
    { id: "regression", type: "regressionChannel", pane: "main", points: [at(97, 51.91), at(78, 57.21)], style: {} },
];

export default function ChannelTools() {
    const theme = useDocsChartTheme();
    const drawings = useDrawings({ defaultDrawings });
    return (
        <div className="flex size-full flex-col">
            {/* only the channel tools, as a horizontal toolbar */}
            <DrawingToolbar
                controller={drawings}
                tools={["parallelChannel", "regressionChannel", "pitchfork"]}
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
