"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { type Drawing, Drawings, DrawingStyleToolbar, DrawingToolbar, useDrawings } from "@reincharts/interactive";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const last = weather.length - 1;
// a point on the day `back` days before the last one
const at = (back: number, value: number) => ({ time: weather[last - back].date.getTime(), price: value });

const defaultDrawings: Drawing[] = [
    { id: "spring", type: "ray", pane: "main", points: [at(201, 6.3), at(164, 13.2)], style: { extend: "right" } },
    { id: "info", type: "infoLine", pane: "main", points: [at(34, 17.3), at(23, 9.8)], style: {} },
    {
        id: "peak",
        type: "horizontalLine",
        pane: "main",
        points: [at(108, 22.8)],
        style: { color: "#ef4444", dash: "dashed", text: "Warmest day" },
    },
    { id: "front", type: "verticalLine", pane: "main", points: [at(26, 14.1)], style: { dash: "dashed" } },
    { id: "arrow", type: "arrow", pane: "main", points: [at(150, 24), at(111, 23.2)], style: { color: "#8b5cf6" } },
];

export default function LineTools() {
    const theme = useDocsChartTheme();
    const drawings = useDrawings({ defaultDrawings });
    return (
        <div className="flex size-full flex-col">
            {/* only this group's tools, as a horizontal toolbar */}
            <DrawingToolbar
                controller={drawings}
                tools={[
                    "trendLine",
                    "ray",
                    "extendedLine",
                    "infoLine",
                    "arrow",
                    "horizontalLine",
                    "horizontalRay",
                    "verticalLine",
                    "crossLine",
                ]}
                orientation="horizontal"
            />
            <div className="min-h-0 flex-1">
                <ChartCanvas data={weather} theme={theme} barSpacing={3}>
                    <Pane id="main">
                        <Grid />
                        <LineSeries<WeatherDay> name="Mean temperature" y="temp" curve="monotone" />
                        <YAxis tickFormat={(t) => `${t.label}°`} />
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
