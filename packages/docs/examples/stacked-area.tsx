"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { StackedAreaSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// weekly traffic by channel
const data = Array.from({ length: 52 }, (_, i) => ({
    week: `W${i + 1}`,
    search: 420 + 120 * Math.sin(i / 6) + i * 6,
    social: 260 + 90 * Math.cos(i / 5) + i * 2,
    direct: 180 + 40 * Math.sin(i / 3),
}));

export default function StackedAreas() {
    const theme = useDocsChartTheme();
    const [offset, setOffset] = useState<"none" | "percent">("none");
    return (
        <WithToolbar
            toolbar={
                <Segmented label="offset" value={offset} options={["none", "percent"] as const} onChange={setOffset} />
            }
        >
            <ChartCanvas data={data} theme={theme} xAccessor={(d) => d.week} initialView="fit">
                <Pane>
                    <Grid />
                    <StackedAreaSeries
                        ys={["direct", "social", "search"]}
                        names={["Direct", "Social", "Search"]}
                        offset={offset}
                        curve="monotone"
                    />
                    <YAxis />
                    <Legend orientation="horizontal" />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
