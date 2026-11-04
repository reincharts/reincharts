"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { type Drawing, Drawings, DrawingStyleToolbar, DrawingToolbar, useDrawings } from "@reincharts/interactive";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const last = weather.length - 1;
// time `back` days before the last day (fractions land between days)
const timeAt = (back: number) => {
    const i = Math.floor(last - back);
    const t = weather[i].date.getTime();
    return i >= last ? t : t + (last - back - i) * (weather[i + 1].date.getTime() - t);
};

// a slightly wobbly, hand-drawn loop around a point
const loop = (back: number, value: number, rx: number, ry: number) =>
    Array.from({ length: 44 }, (_, k) => {
        const a = -0.6 + (k / 43) * (Math.PI * 2 + 0.9);
        const wobble = 1 + 0.06 * Math.sin(a * 3) + k * 0.002;
        return { time: timeAt(back - rx * wobble * Math.cos(a)), price: value + ry * wobble * Math.sin(a) };
    });

// a stroke that follows the data between two days
const trace = (from: number, to: number) =>
    Array.from({ length: from - to + 1 }, (_, i) => ({ time: timeAt(from - i), price: weather[last - from + i].temp }));

const defaultDrawings: Drawing[] = [
    { id: "peak", type: "brush", pane: "main", points: loop(108, 22.3, 10, 2), style: { color: "#ef4444", width: 2 } },
    {
        id: "spring",
        type: "highlighter",
        pane: "main",
        points: trace(186, 170),
        style: { color: "rgba(255, 193, 7, 0.4)", width: 14 },
    },
    {
        id: "cold",
        type: "highlighter",
        pane: "main",
        points: trace(30, 22),
        style: { color: "rgba(56, 189, 248, 0.4)", width: 18 },
    },
];

export default function FreehandTools() {
    const theme = useDocsChartTheme();
    const drawings = useDrawings({ defaultDrawings });
    return (
        <div className="flex size-full flex-col">
            {/* drag on the chart to draw; the highlighter draws thick, translucent strokes */}
            <DrawingToolbar controller={drawings} tools={["brush", "highlighter"]} orientation="horizontal" />
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
