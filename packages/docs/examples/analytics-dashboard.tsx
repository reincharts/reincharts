"use client";
import { ChartCanvas, formatCompact, Pane } from "@reincharts/core";
import { AreaSeries, BarSeries, LineSeries, StackedAreaSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { ReferenceLine } from "@reincharts/annotations";
import type { ReactNode } from "react";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// 120 days of product analytics from a seeded generator (no network requests)
const random = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const rand = random(3);
const data = Array.from({ length: 120 }, (_, i) => {
    const weekday = new Date(2026, 4, 1 + i).getDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.72 : 1;
    const trend = 1 + i / 160;
    const visitors = Math.round((4200 + 700 * Math.sin(i / 9) + rand() * 600) * trend * weekend);
    const conversion = 2.4 + 0.5 * Math.sin(i / 14 + 1) + (rand() - 0.5) * 0.5;
    return {
        day: new Date(2026, 4, 1 + i),
        visitors,
        revenue: Math.round((visitors * conversion) / 100) * 48,
        conversion: Math.round(conversion * 100) / 100,
        organic: Math.round(visitors * (0.46 + 0.04 * Math.sin(i / 11))),
        paid: Math.round(visitors * 0.28),
        referral: Math.round(visitors * (0.26 - 0.04 * Math.sin(i / 11))),
    };
});
type Row = (typeof data)[number];

const total = (key: "visitors" | "revenue") => data.reduce((sum, d) => sum + d[key], 0);

function Card({ title, value, children }: { title: string; value: string; children: ReactNode }) {
    return (
        <div className="flex min-h-[260px] flex-col bg-fd-background">
            <div className="flex items-baseline justify-between gap-2 px-4 pt-3">
                <span className="text-sm font-medium text-fd-foreground">{title}</span>
                <span className="text-sm font-semibold text-fd-foreground tabular-nums">{value}</span>
            </div>
            <div className="min-h-0 flex-1">{children}</div>
        </div>
    );
}

export default function AnalyticsDashboard() {
    const theme = useDocsChartTheme();
    // every chart gets the same syncId (shared crosshair) and syncRange (shared pan / zoom)
    const shared = {
        data,
        theme,
        xAccessor: (d: Row) => d.day,
        syncId: "analytics",
        syncRange: true,
        initialView: "fit" as const,
        rightOffset: 0,
    };
    return (
        <div className="grid size-full grid-cols-1 gap-px overflow-y-auto bg-fd-border md:grid-cols-2 md:grid-rows-2">
            <Card title="Visitors" value={formatCompact(total("visitors"))}>
                <ChartCanvas {...shared}>
                    <Pane>
                        <Grid vertical={false} />
                        <AreaSeries<Row>
                            name="Visitors"
                            y="visitors"
                            curve="monotone"
                            color="#3b82f6"
                            format={formatCompact}
                        />
                        <YAxis tickFormat={(t) => formatCompact(t.value)} />
                        <Legend />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                </ChartCanvas>
            </Card>
            <Card title="Revenue" value={`$${formatCompact(total("revenue"))}`}>
                <ChartCanvas {...shared}>
                    <Pane>
                        <Grid vertical={false} />
                        <BarSeries<Row>
                            name="Revenue"
                            y="revenue"
                            fill="#10b981"
                            radius={2}
                            format={(v) => `$${formatCompact(v)}`}
                        />
                        <YAxis tickFormat={(t) => formatCompact(t.value)} />
                        <Legend />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                </ChartCanvas>
            </Card>
            <Card
                title="Conversion rate"
                value={`${(data.reduce((s, d) => s + d.conversion, 0) / data.length).toFixed(2)}%`}
            >
                <ChartCanvas {...shared}>
                    <Pane>
                        <Grid vertical={false} />
                        <ReferenceLine y={2.5} label="Target 2.5%" color="#f59e0b" />
                        <LineSeries<Row>
                            name="Conversion"
                            y="conversion"
                            curve="monotone"
                            color="#a855f7"
                            format={(v) => `${v.toFixed(2)}%`}
                        />
                        <YAxis tickFormat={(t) => `${t.value}%`} />
                        <Legend />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                </ChartCanvas>
            </Card>
            <Card title="Traffic by channel" value="3 channels">
                <ChartCanvas {...shared}>
                    <Pane>
                        <Grid vertical={false} />
                        <StackedAreaSeries<Row>
                            ys={["referral", "paid", "organic"]}
                            names={["Referral", "Paid", "Organic"]}
                            colors={["#f59e0b", "#ec4899", "#06b6d4"]}
                            offset="percent"
                            format={formatCompact}
                            curve="monotone"
                        />
                        <YAxis tickFormat={(t) => `${t.value}%`} />
                        <Legend orientation="horizontal" />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                </ChartCanvas>
            </Card>
        </div>
    );
}
