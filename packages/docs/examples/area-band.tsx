"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { AreaSeries, LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function AreaBand() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={weather} theme={theme} barSpacing={5}>
            <Pane>
                <Grid />
                {/* y0 turns the area into a band: here the daily low-high range, without a line */}
                <AreaSeries<WeatherDay>
                    name="Low – high"
                    y="high"
                    y0="low"
                    lineWidth={0}
                    fill="rgba(249, 115, 22, 0.2)"
                    legend={false}
                />
                <LineSeries<WeatherDay> name="Mean" y="temp" color="#f97316" width={1.5} curve="monotone" />
                <YAxis tickFormat={(t) => `${t.label}°`} />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
