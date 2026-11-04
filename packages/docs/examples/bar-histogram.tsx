"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { BarSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function Histogram() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={weather} theme={theme} barSpacing={6}>
            <Pane>
                <Grid />
                {/* fill per datum: warmer than normal in red, colder in blue */}
                <BarSeries<WeatherDay>
                    name="Anomaly"
                    y="anomaly"
                    fill={(d) => (d.anomaly >= 0 ? "#ef4444" : "#3b82f6")}
                    format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}°`}
                />
                <YAxis tickFormat={(t) => `${t.label}°`} />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
