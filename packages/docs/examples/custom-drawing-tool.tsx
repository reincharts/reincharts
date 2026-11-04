"use client";
import { ChartCanvas, Pane, withAlpha } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import {
    defineTool,
    type Drawing,
    Drawings,
    DrawingStyleToolbar,
    DrawingToolbar,
    useDrawings,
} from "@reincharts/interactive";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

/** A custom tool: highlights a time range over the full pane height, with its length in days. */
const timeBand = defineTool({
    type: "timeBand",
    label: "Time Band",
    group: "custom",
    icon: (
        <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="5" y="2.5" width="8" height="13" rx="1" fill="currentColor" fillOpacity="0.2" />
            <path d="M5 2v14M13 2v14" />
        </svg>
    ),
    points: 2,
    defaults: { color: "#f59e0b" },
    styleControls: ["color"],
    draw(ctx, g, _drawing, state) {
        const [a, b] = g.points;
        if (!a || !b) {
            return;
        }
        const left = Math.min(a.x, b.x);
        const width = Math.abs(b.x - a.x);
        ctx.fillStyle = withAlpha(g.color, state.selected || state.hovered ? 0.2 : 0.12);
        ctx.fillRect(left, 0, width, g.height);
        ctx.fillStyle = g.color;
        ctx.fillRect(Math.round(left), 0, 1, g.height);
        ctx.fillRect(Math.round(left + width), 0, 1, g.height);
        const bars = Math.round(Math.abs(g.logical(g.time(b.x)) - g.logical(g.time(a.x))));
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${bars} days`, left + width / 2, 16);
    },
    hitTest(g, x) {
        const [a, b] = g.points;
        return !!a && !!b && x >= Math.min(a.x, b.x) && x <= Math.max(a.x, b.x);
    },
    // drag handles at mid-height instead of the clicked prices
    handles: (g) => g.points.map((p) => ({ x: p.x, y: g.height / 2 })),
});

const last = (back: number) => weather[weather.length - 1 - back].date.getTime();
const defaultDrawings: Drawing[] = [
    {
        id: "band",
        type: "timeBand",
        pane: "main",
        points: [
            { time: last(131), price: 0 },
            { time: last(86), price: 0 },
        ],
        style: {},
    },
];

export default function CustomTool() {
    const theme = useDocsChartTheme();
    // custom tools are registered next to (or instead of) the built-in ones
    const drawings = useDrawings({ tools: [timeBand], defaultDrawings });
    return (
        <div className="flex size-full flex-col">
            <DrawingToolbar
                controller={drawings}
                tools={["timeBand", "trendLine", "rectangle"]}
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
