"use client";
import { ChartCanvas, createTheme, darkTheme } from "@reincharts/core";
import { AreaSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { traffic } from "@/lib/data-general";

// deep-merged over the dark preset: only the keys you set change
const terminal = createTheme(
    {
        background: "#0b0f0c",
        line: "#22c55e",
        area: { top: "rgba(34, 197, 94, 0.35)", bottom: "rgba(34, 197, 94, 0)" },
        grid: { color: "rgba(34, 197, 94, 0.08)" },
        axis: { line: "#14532d", text: "#4ade80" },
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    darkTheme,
);

export default function CustomTheme() {
    return (
        <ChartCanvas data={traffic} theme={terminal}>
            <AreaSeries y="sessions" />
            <YAxis />
            <XAxis />
        </ChartCanvas>
    );
}
