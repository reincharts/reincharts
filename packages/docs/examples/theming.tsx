"use client";
import { ChartCanvas, createTheme, darkTheme, Pane } from "@reincharts/core";
import { AreaSeries, BarSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { traffic, type TrafficDay } from "@/lib/data-general";

// a custom "terminal" theme: deep-merged over the dark preset
const terminal = createTheme(
    {
        background: "#0b0f0c",
        text: "#9ef0b5",
        line: "#22c55e",
        area: { top: "rgba(34, 197, 94, 0.35)", bottom: "rgba(34, 197, 94, 0)" },
        grid: { color: "rgba(34, 197, 94, 0.08)" },
        axis: { line: "#14532d", text: "#4ade80" },
        crosshair: { color: "#22c55e", labelBackground: "#14532d" },
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    darkTheme,
);

export default function CustomTheme() {
    return (
        <ChartCanvas data={traffic} theme={terminal} barSpacing={7}>
            <Pane size={3}>
                <Grid />
                <AreaSeries<TrafficDay> name="Sessions" y="sessions" />
                <YAxis />
            </Pane>
            <Pane>
                <BarSeries<TrafficDay> name="Sign-ups" y="signups" fill="rgba(74, 222, 128, 0.6)" />
                <YAxis />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
