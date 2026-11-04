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
        id: "hint",
        type: "text",
        pane: "main",
        points: [at(212, 21)],
        style: { text: "Double-click to edit", fontSize: 14 },
    },
    {
        id: "summer",
        type: "text",
        pane: "main",
        points: [at(122, 14.5)],
        style: { text: "Summer", fontSize: 16, bold: true, textColor: "#f59e0b" },
    },
    {
        id: "peak",
        type: "callout",
        pane: "main",
        points: [at(108, 22.8), at(62, 24)],
        style: { text: "Warmest day: 22.8°" },
    },
    {
        id: "front",
        type: "callout",
        pane: "main",
        points: [at(25, 12.3), at(70, 7.5)],
        style: { text: "Cold front", color: "#0ea5e9" },
    },
];

export default function TextTools() {
    const theme = useDocsChartTheme();
    const drawings = useDrawings({ defaultDrawings });
    return (
        <div className="flex size-full flex-col">
            {/* text tools open an inline editor after they are placed */}
            <DrawingToolbar controller={drawings} tools={["text", "callout"]} orientation="horizontal" />
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
