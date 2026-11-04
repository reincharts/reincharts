"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { AreaSeries, LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, LastValueLabel } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { ReferenceLine } from "@reincharts/annotations";
import { useEffect, useState } from "react";
import { ToolbarButton, WithToolbar } from "@/components/preview/controls";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

interface Sample {
    time: Date;
    cpu: number;
    memory: number;
}

// a "server metrics" stream generated in the browser. Each sample is a pure function of its index, so
// React may call the state updater twice (StrictMode) without changing the result.
const START = Date.UTC(2026, 9, 31, 12, 0, 0);
const noise = (i: number, seed: number) => {
    const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    return x - Math.floor(x) - 0.5;
};
const clamp = (v: number) => Math.max(2, Math.min(98, v));
const round = (v: number) => Math.round(v * 10) / 10;

const sampleAt = (i: number): Sample => ({
    time: new Date(START + i * 1000),
    cpu: round(clamp(42 + 18 * Math.sin(i / 23) + 9 * Math.sin(i / 7.3) + 8 * noise(i, 1))),
    memory: round(clamp(54 + 6 * Math.sin(i / 90) + 1.5 * Math.sin(i / 11) + noise(i, 2))),
});

export default function RealtimeLine() {
    const theme = useDocsChartTheme();
    const [data, setData] = useState<Sample[]>(() => Array.from({ length: 120 }, (_, i) => sampleAt(i)));
    const [running, setRunning] = useState(true);
    useEffect(() => {
        if (!running) {
            return;
        }
        // append a sample every 250 ms; the chart keeps following the newest point while it is visible
        const id = setInterval(() => setData((d) => [...d, sampleAt(d.length)]), 250);
        return () => clearInterval(id);
    }, [running]);
    return (
        <WithToolbar
            toolbar={
                <>
                    <ToolbarButton onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Resume"}</ToolbarButton>
                    <span className="text-xs text-fd-muted-foreground tabular-nums">{data.length} samples</span>
                </>
            }
        >
            <ChartCanvas
                data={data}
                theme={theme}
                xAccessor={(d) => d.time}
                barSpacing={6}
                rightOffset={6}
                timeZone="UTC"
            >
                <Pane scales={{ right: { domain: [0, 100] } }}>
                    <Grid />
                    <ReferenceLine y={80} label="Alert 80%" color="#ef4444" />
                    <AreaSeries<Sample> name="CPU %" y="cpu" color="#3b82f6" curve="monotone" />
                    <LineSeries<Sample> name="Memory %" y="memory" color="#a855f7" curve="monotone" />
                    <LastValueLabel line />
                    <YAxis tickFormat={(t) => `${t.value}%`} />
                    <Legend orientation="horizontal" />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
