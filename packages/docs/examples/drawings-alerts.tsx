"use client";
import { ChartCanvas, ChartOverlay, Pane } from "@reincharts/core";
import { AreaSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, LastValueLabel } from "@reincharts/coordinates";
import { type Drawing, Drawings, DrawingToolbar, useDrawings } from "@reincharts/interactive";
import { useEffect, useState } from "react";
import { ToolbarButton, WithToolbar } from "@/components/preview/controls";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

interface Reading {
    time: Date;
    temp: number;
}

// a simulated room temperature sensor: reading `i` is a pure function of `i` (one reading per second)
const START = Date.UTC(2026, 9, 31, 9, 0, 0);
const noise = (i: number) => {
    const h = Math.sin(i * 12.9898) * 43758.5453;
    return h - Math.floor(h) - 0.5;
};
const reading = (i: number): Reading => ({
    time: new Date(START + i * 1000),
    temp: Math.round((22 + 1.3 * Math.sin(i / 11) + 0.7 * Math.sin(i / 4.3 + 1) + 0.7 * noise(i)) * 100) / 100,
});

// the thresholds are ordinary drawings: drag them to move the alert levels
const defaultDrawings: Drawing[] = [
    {
        id: "high",
        type: "horizontalLine",
        pane: "main",
        points: [{ time: START, price: 23.5 }],
        style: { text: "High", color: "#ef4444" },
    },
    {
        id: "low",
        type: "horizontalLine",
        pane: "main",
        points: [{ time: START, price: 20.5 }],
        style: { text: "Low", color: "#3b82f6" },
    },
];

export default function DrawingAlerts() {
    const theme = useDocsChartTheme();
    const [data, setData] = useState<Reading[]>(() => Array.from({ length: 150 }, (_, i) => reading(i)));
    const [running, setRunning] = useState(true);
    const [alerts, setAlerts] = useState<string[]>([]);
    // onCross fires when new data crosses a horizontal line, ray, cross line or trend line
    const drawings = useDrawings({
        defaultDrawings,
        onCross: (drawing, direction, bar) => {
            const { time, temp } = bar as Reading;
            const line = `${time.toISOString().slice(11, 19)} · ${temp.toFixed(1)}° crossed ${drawing.style.text ?? drawing.type} ${direction === "up" ? "↑" : "↓"}`;
            setAlerts((a) => [line, ...a].slice(0, 4));
        },
    });
    useEffect(() => {
        if (!running) {
            return;
        }
        const id = setInterval(() => setData((d) => [...d, reading(d.length)]), 250);
        return () => clearInterval(id);
    }, [running]);
    return (
        <WithToolbar
            toolbar={
                <>
                    <ToolbarButton onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Resume"}</ToolbarButton>
                    <span className="text-xs text-fd-muted-foreground">Drag a line to move the threshold</span>
                </>
            }
        >
            <div className="flex size-full">
                <DrawingToolbar
                    controller={drawings}
                    tools={["horizontalLine", "horizontalRay", "crossLine", "trendLine"]}
                />
                <div className="min-w-0 flex-1">
                    <ChartCanvas
                        data={data}
                        theme={theme}
                        xAccessor={(d) => d.time}
                        barSpacing={6}
                        rightOffset={6}
                        timeZone="UTC"
                    >
                        <Pane id="main" scales={{ right: { domain: [18, 26] } }}>
                            <Grid />
                            <AreaSeries<Reading> name="Temperature" y="temp" color="#10b981" curve="monotone" />
                            <LastValueLabel />
                            <YAxis tickFormat={(t) => `${t.label}°`} />
                            <ChartOverlay>
                                <ul className="m-3 inline-flex flex-col gap-1 rounded-md border border-fd-border bg-fd-background/90 px-3 py-2 font-mono text-xs text-fd-muted-foreground">
                                    {alerts.length ? (
                                        alerts.map((a) => <li key={a}>{a}</li>)
                                    ) : (
                                        <li>waiting for a crossing…</li>
                                    )}
                                </ul>
                            </ChartOverlay>
                        </Pane>
                        <XAxis />
                        <Crosshair />
                        {/* the value checked against the lines */}
                        <Drawings controller={drawings} source={(d: Reading) => d.temp} />
                    </ChartCanvas>
                </div>
            </div>
        </WithToolbar>
    );
}
