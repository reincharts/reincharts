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
    {
        id: "summer",
        type: "rectangle",
        pane: "main",
        points: [at(131, 23.6), at(86, 16.4)],
        style: { fill: "rgba(41, 98, 255, 0.1)" },
    },
    {
        id: "drop",
        type: "ellipse",
        pane: "main",
        points: [at(31, 17.8), at(17, 8.4)],
        style: { color: "#f59e0b", fill: "rgba(245, 158, 11, 0.12)" },
    },
    {
        id: "spring",
        type: "triangle",
        pane: "main",
        points: [at(196, 8.8), at(173, 16.3), at(162, 12.4)],
        style: { color: "#8b5cf6", fill: "rgba(139, 92, 246, 0.12)" },
    },
    {
        id: "path",
        type: "path",
        pane: "main",
        points: [at(78, 14), at(64, 13), at(50, 15.5), at(38, 13.5), at(12, 6.5)],
        style: { color: "#10b981" },
    },
];

export default function ShapeTools() {
    const theme = useDocsChartTheme();
    const drawings = useDrawings({ defaultDrawings });
    return (
        <div className="flex size-full flex-col">
            {/* only this group's tools, as a horizontal toolbar */}
            <DrawingToolbar
                controller={drawings}
                tools={["rectangle", "ellipse", "triangle", "path"]}
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
