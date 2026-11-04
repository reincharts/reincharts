"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { GroupedBarSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend, Tooltip } from "@reincharts/tooltip";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const data = [
    { quarter: "Q1 2025", desktop: 186, mobile: 80, tablet: 45 },
    { quarter: "Q2 2025", desktop: 305, mobile: 200, tablet: 62 },
    { quarter: "Q3 2025", desktop: 237, mobile: 120, tablet: 58 },
    { quarter: "Q4 2025", desktop: 273, mobile: 190, tablet: 71 },
    { quarter: "Q1 2026", desktop: 209, mobile: 130, tablet: 66 },
    { quarter: "Q2 2026", desktop: 314, mobile: 240, tablet: 80 },
];

export default function GroupedBars() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={data} theme={theme} xAccessor={(d) => d.quarter} initialView="fit">
            <Pane>
                <Grid vertical={false} />
                <GroupedBarSeries
                    name="Visitors (k)"
                    ys={["desktop", "mobile", "tablet"]}
                    names={["Desktop", "Mobile", "Tablet"]}
                    radius={3}
                />
                <YAxis />
                <Legend />
                <Tooltip />
            </Pane>
            <XAxis />
            <Crosshair horizontal={false} />
        </ChartCanvas>
    );
}
