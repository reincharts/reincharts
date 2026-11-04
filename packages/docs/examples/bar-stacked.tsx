"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { StackedBarSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend, Tooltip } from "@reincharts/tooltip";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { useDocsChartTheme } from "@/lib/use-docs-theme";
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const data = months.map((month, i) => ({
    month,
    hardware: 40 + ((i * 17) % 30),
    software: 60 + ((i * 23) % 45),
    services: 25 + ((i * 11) % 20),
}));

export default function StackedBars() {
    const theme = useDocsChartTheme();
    const [offset, setOffset] = useState<"none" | "percent">("none");
    return (
        <WithToolbar
            toolbar={
                <Segmented label="offset" value={offset} options={["none", "percent"] as const} onChange={setOffset} />
            }
        >
            <ChartCanvas data={data} theme={theme} xAccessor={(d) => d.month} initialView="fit">
                <Pane>
                    <Grid vertical={false} />
                    <StackedBarSeries
                        name="Revenue"
                        ys={["hardware", "software", "services"]}
                        names={["Hardware", "Software", "Services"]}
                        colors={["#2962ff", "#60a5fa", "#bfdbfe"]}
                        offset={offset}
                    />
                    <YAxis />
                    <Legend />
                    <Tooltip />
                </Pane>
                <XAxis />
                <Crosshair horizontal={false} />
            </ChartCanvas>
        </WithToolbar>
    );
}
