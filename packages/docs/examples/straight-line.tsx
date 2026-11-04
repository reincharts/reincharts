"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries, StraightLine } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function StraightLines() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={weather} theme={theme} initialView="fit">
            <Pane>
                <Grid />
                <LineSeries<WeatherDay> name="Mean" y="temp" />
                {/* a horizontal line at a value (freezing) and a vertical line at a date (summer solstice) */}
                <StraightLine value={0} color="#06b6d4" autoscale />
                <StraightLine type="vertical" value={new Date(2025, 5, 21)} color="#f59e0b" dash="dotted" />
                <YAxis tickFormat={(t) => `${t.label}°`} />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
