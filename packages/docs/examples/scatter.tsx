"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { ScatterSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Tooltip } from "@reincharts/tooltip";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// three clusters of points (height vs weight)
const random = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const rand = random(42);
const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
const groups = [
    { name: "Group A", cx: 165, cy: 60 },
    { name: "Group B", cx: 175, cy: 75 },
    { name: "Group C", cx: 185, cy: 88 },
];
const data = groups.flatMap((g, group) =>
    Array.from({ length: 60 }, () => ({ x: g.cx + gauss() * 6, y: g.cy + gauss() * 6, group, size: 20 + rand() * 80 })),
);
type Point = (typeof data)[number];

const shapes = ["circle", "square", "triangle"] as const;

export default function Scatter() {
    const theme = useDocsChartTheme();
    return (
        // linear x mode: x values are read from `d.x` and placed on a continuous axis
        <ChartCanvas data={data} theme={theme} xMode="linear">
            <Pane>
                <Grid />
                <ScatterSeries<Point>
                    name="Weight (kg)"
                    y="y"
                    marker={(d) => shapes[d.group]}
                    fill={(d, _i, t) => t.palette[d.group]}
                    size={9}
                />
                <YAxis />
                <Tooltip mode="nearest" />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
