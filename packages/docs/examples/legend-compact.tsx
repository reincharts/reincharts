"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// daily active users per region
const regions = [
    { key: "na", name: "North America", color: "#3b82f6", base: 5200 },
    { key: "eu", name: "Europe", color: "#8b5cf6", base: 4300 },
    { key: "apac", name: "Asia Pacific", color: "#10b981", base: 3600 },
    { key: "latam", name: "Latin America", color: "#f59e0b", base: 1900 },
    { key: "mea", name: "Middle East & Africa", color: "#ef4444", base: 1100 },
] as const;
const data = Array.from({ length: 120 }, (_, i) => {
    const row: Record<string, number | Date> = { date: new Date(2026, 4, 1 + i) };
    regions.forEach((r, k) => {
        row[r.key] = Math.round(
            r.base * (1 + i / 400) * (1 + 0.08 * Math.sin(i / 6 + k) + 0.04 * Math.sin(i / 2.3 + k)),
        );
    });
    return row;
});

const modes = { auto: "auto", compact: true, full: false } as const;
type Mode = keyof typeof modes;

export default function CompactLegend() {
    const theme = useDocsChartTheme();
    const [mode, setMode] = useState<Mode>("compact");
    return (
        <WithToolbar
            toolbar={
                <>
                    <Segmented label="legend" value={mode} options={Object.keys(modes) as Mode[]} onChange={setMode} />
                    <span className="text-xs text-fd-muted-foreground">auto: compact when the pane is under 480px</span>
                </>
            }
        >
            <ChartCanvas data={data} theme={theme} barSpacing={6}>
                <Pane>
                    <Grid />
                    {regions.map((r) => (
                        <LineSeries key={r.key} name={r.name} y={r.key} color={r.color} width={1.5} />
                    ))}
                    <YAxis />
                    {/* compact: first item with its value, the others behind an "N more" toggle */}
                    <Legend compact={modes[mode]} />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
