"use client";
import {
    ChartCanvas,
    ChartOverlay,
    formatNumber,
    Pane,
    useChart,
    useChartEvent,
    useChartState,
} from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { useState } from "react";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

/** Shows the hovered day and the last clicked value. Lives inside <Pane>, so it can use the chart hooks. */
function Inspector() {
    const engine = useChart<WeatherDay>();
    const index = useChartState((s) => s.crosshair?.index ?? -1);
    const [clicked, setClicked] = useState("click anywhere");
    useChartEvent("click", (e) => setClicked(`clicked ${formatNumber(e.price(), 1)}° on ${engine.formatX(e.index)}`));
    const day = engine.data[index];
    return (
        <ChartOverlay>
            <div className="m-3 inline-flex flex-col gap-1 rounded-md border border-fd-border bg-fd-background/90 px-3 py-2 font-mono text-xs text-fd-muted-foreground shadow-sm">
                <span>
                    {day
                        ? `${engine.formatX(index)}  low ${day.low}°  mean ${day.temp}°  high ${day.high}°`
                        : "hover the chart"}
                </span>
                <span className="text-fd-foreground">{clicked}</span>
            </div>
        </ChartOverlay>
    );
}

export default function InteractionEvents() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={weather} theme={theme} barSpacing={8}>
            <Pane>
                <Grid />
                <LineSeries<WeatherDay> name="Mean" y="temp" />
                <YAxis tickFormat={(t) => `${t.label}°`} />
                <Inspector />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
