"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { GroupedHorizontalBarSeries, StackedHorizontalBarSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend, Tooltip } from "@reincharts/tooltip";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const data = [
    { team: "Platform", done: 34, review: 8, todo: 12 },
    { team: "Charts", done: 51, review: 6, todo: 9 },
    { team: "Indicators", done: 42, review: 11, todo: 4 },
    { team: "Drawings", done: 27, review: 9, todo: 21 },
    { team: "Docs", done: 19, review: 4, todo: 15 },
];

export default function StackedHorizontalBars() {
    const theme = useDocsChartTheme();
    const [layout, setLayout] = useState<"stacked" | "grouped">("stacked");
    const Series = layout === "stacked" ? StackedHorizontalBarSeries : GroupedHorizontalBarSeries;
    return (
        <WithToolbar
            toolbar={<Segmented value={layout} options={["stacked", "grouped"] as const} onChange={setLayout} />}
        >
            <ChartCanvas data={data} theme={theme} xMode="linear" initialView="fit">
                <Pane scales={{ right: { categories: data.map((d) => d.team) } }}>
                    <Grid horizontal={false} />
                    <Series
                        name="Tasks"
                        ys={["done", "review", "todo"]}
                        names={["Done", "In review", "To do"]}
                        colors={["#10b981", "#f59e0b", "#a1a1aa"]}
                        radius={layout === "grouped" ? 3 : 0}
                    />
                    <YAxis />
                    <Legend position="bottom-right" />
                    <Tooltip />
                </Pane>
                <XAxis />
            </ChartCanvas>
        </WithToolbar>
    );
}
