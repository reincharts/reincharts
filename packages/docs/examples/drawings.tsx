"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
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
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const last = weather.length - 1;
// a point on the day `back` days before the last one
const at = (back: number, value: number) => ({ time: weather[last - back].date.getTime(), price: value });

// lines, freehand, shapes, text and measurements
const tools = [
    "trendLine",
    "ray",
    "extendedLine",
    "infoLine",
    "arrow",
    "horizontalLine",
    "horizontalRay",
    "verticalLine",
    "crossLine",
    "brush",
    "highlighter",
    "rectangle",
    "ellipse",
    "triangle",
    "path",
    "text",
    "callout",
    "priceRange",
    "dateRange",
    "dateAndPriceRange",
];

const defaultDrawings: Drawing[] = [
    { id: "trend", type: "trendLine", pane: "main", points: [at(201, 6.3), at(164, 13.2)], style: {} },
    {
        id: "summer",
        type: "rectangle",
        pane: "main",
        points: [at(131, 23.6), at(86, 16.4)],
        style: { color: "#f59e0b", fill: "rgba(245, 158, 11, 0.1)" },
    },
    {
        // a highlighter stroke over the first cold spell
        id: "highlight",
        type: "highlighter",
        pane: "main",
        points: Array.from({ length: 11 }, (_, i) => at(31 - i, weather[last - 31 + i].temp)),
        style: { color: "rgba(255, 193, 7, 0.4)", width: 14 },
    },
    {
        id: "note",
        type: "callout",
        pane: "main",
        points: [at(25, 12.3), at(70, 8)],
        style: { text: "First cold spell" },
    },
];

export default function DrawingTools() {
    const theme = useDocsChartTheme();
    const drawings = useDrawings({ defaultDrawings });
    return (
        <div className="flex size-full">
            {/* left toolbar: tool groups, magnet, keep drawing, lock, hide, remove */}
            <DrawingToolbar controller={drawings} tools={tools} />
            <div className="min-w-0 flex-1">
                <ChartCanvas data={weather} theme={theme} barSpacing={3}>
                    <Pane id="main">
                        <Grid />
                        <LineSeries<WeatherDay> name="Mean temperature" y="temp" curve="monotone" />
                        <YAxis tickFormat={(t) => `${t.label}°`} />
                        <Legend />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                    <Drawings controller={drawings} />
                    {/* floating style editor for the selected drawing */}
                    <DrawingStyleToolbar controller={drawings} />
                    <ZoomButtons />
                </ChartCanvas>
            </div>
        </div>
    );
}
