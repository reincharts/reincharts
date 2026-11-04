"use client";
import { ChartCanvas, formatCompact, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useMemo, useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const sizes = { "10k": 10_000, "50k": 50_000, "200k": 200_000 } as const;
type Size = keyof typeof sizes;

/** A seeded random walk with daily seasonality: one sample per minute. */
function generate(count: number) {
    let seed = 17;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const start = Date.UTC(2026, 0, 1);
    const out = new Array<{ time: Date; value: number; baseline: number }>(count);
    let walk = 0;
    for (let i = 0; i < count; i++) {
        walk += (rand() - 0.5) * 2.4;
        const daily = Math.sin((i / 1440) * Math.PI * 2) * 18;
        out[i] = { time: new Date(start + i * 60_000), value: 200 + walk + daily, baseline: 200 + walk * 0.98 };
    }
    return out;
}

export default function LargeDataset() {
    const theme = useDocsChartTheme();
    const [size, setSize] = useState<Size>("50k");
    const data = useMemo(() => generate(sizes[size]), [size]);
    return (
        <WithToolbar
            toolbar={
                <>
                    <Segmented label="points" value={size} options={Object.keys(sizes) as Size[]} onChange={setSize} />
                    <span className="text-xs text-fd-muted-foreground">
                        {formatCompact(data.length * 2)} values · scroll to zoom, drag to pan
                    </span>
                </>
            }
        >
            {/* only the visible slice is drawn; when points share a pixel, series aggregate per pixel column */}
            <ChartCanvas data={data} theme={theme} xMode="linear" initialView="fit" timeZone="UTC" resetKey={size}>
                <Pane>
                    <Grid />
                    <LineSeries name="Trend" y="baseline" color={theme.textMuted} width={1} />
                    <LineSeries name="Sensor" y="value" color="#3b82f6" width={1.25} />
                    <YAxis />
                    <Legend orientation="horizontal" />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
