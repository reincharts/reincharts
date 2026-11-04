"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { AreaSeries, LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend, Tooltip } from "@reincharts/tooltip";
import { Label, Markers, ReferenceArea, ReferenceLine } from "@reincharts/annotations";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// 26 weeks of active users: a steady climb, a launch campaign, then a new plateau
const random = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const rand = random(11);
const start = new Date(2026, 0, 5);
const data = Array.from({ length: 26 }, (_, i) => {
    const lift = i < 12 ? 0 : Math.min(i - 11, 5) * 0.85 - Math.max(i - 18, 0) * 0.22;
    const users = 6.2 + i * 0.1 + lift + Math.sin(i / 2.2) * 0.3 + (rand() - 0.5) * 0.35;
    return {
        week: new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * 7),
        users: Math.round(users * 100) / 100,
        lastYear: Math.round((5.3 + i * 0.09 + Math.cos(i / 2.6) * 0.3) * 100) / 100,
    };
});
type Row = (typeof data)[number];
const peak = data.reduce((a, b) => (b.users > a.users ? b : a));

export default function AnnotatedLine() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={data} theme={theme} xAccessor={(d) => d.week} initialView="fit" rightOffset={0}>
            <Pane scales={{ right: { margins: { top: 0.2, bottom: 0.2 } } }}>
                <Grid vertical={false} />
                {/* a highlighted period */}
                <ReferenceArea x1={data[12].week} x2={data[16].week} label="Launch campaign" color="#3b82f6" />
                {/* a target line with a label */}
                <ReferenceLine y={10} label="Goal · 10k" color="#10b981" labelPosition="start" />
                <LineSeries<Row>
                    name="Last year"
                    y="lastYear"
                    curve="monotone"
                    color={theme.textMuted}
                    dash="dashed"
                    width={1.5}
                />
                <AreaSeries<Row> name="Active users (k)" y="users" curve="monotone" color="#3b82f6" lineWidth={2.5} />
                {/* text markers at notable points */}
                <Markers
                    data={[
                        { x: data[4].week, position: "below", shape: "circle", text: "Pricing page", color: "#a855f7" },
                        {
                            x: data[12].week,
                            position: "below",
                            shape: "circle",
                            text: "v2.0 release",
                            color: "#3b82f6",
                        },
                        {
                            x: peak.week,
                            position: "above",
                            shape: "circle",
                            text: `Peak ${peak.users}k`,
                            color: "#f59e0b",
                        },
                    ]}
                    high="users"
                    low="users"
                    size={9}
                />
                {/* a callout with a background */}
                <Label
                    text={`+${Math.round((data[21].users / data[11].users - 1) * 100)}% since launch`}
                    x={data[21].week}
                    y={data[21].users}
                    dy={-26}
                    align="center"
                    color="#ffffff"
                    background="#10b981"
                    fontWeight={600}
                />
                <YAxis tickFormat={(t) => `${t.value}k`} />
                <Legend position="bottom-right" orientation="horizontal" swatch showValues={false} />
                <Tooltip />
            </Pane>
            <XAxis />
            <Crosshair horizontal={false} />
        </ChartCanvas>
    );
}
