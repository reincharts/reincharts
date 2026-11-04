"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, type CrosshairMode } from "@reincharts/coordinates";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function CrosshairModes() {
    const theme = useDocsChartTheme();
    const [mode, setMode] = useState<CrosshairMode>("magnet");
    return (
        <WithToolbar
            toolbar={
                <Segmented
                    label="mode"
                    value={mode}
                    options={["normal", "magnet", "hidden"] as const}
                    onChange={setMode}
                />
            }
        >
            <ChartCanvas data={weather} theme={theme} barSpacing={10}>
                <Pane>
                    <Grid />
                    <LineSeries<WeatherDay> name="High" y="high" color="#f97316" width={1} />
                    <LineSeries<WeatherDay> name="Mean" y="temp" />
                    <LineSeries<WeatherDay> name="Low" y="low" color="#06b6d4" width={1} />
                    <YAxis tickFormat={(t) => `${t.label}°`} />
                </Pane>
                <XAxis />
                {/* magnet: the horizontal line snaps to the nearest line value at the hovered day */}
                <Crosshair mode={mode} />
            </ChartCanvas>
        </WithToolbar>
    );
}
