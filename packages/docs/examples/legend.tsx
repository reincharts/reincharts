"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { BarSeries, LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function LegendExample() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={weather} theme={theme} barSpacing={6}>
            <Pane size={3}>
                <Grid />
                <LineSeries<WeatherDay> name="High" y="high" color="#f97316" width={1.5} />
                <LineSeries<WeatherDay> name="Mean" y="temp" width={2} />
                <LineSeries<WeatherDay> name="Low" y="low" color="#06b6d4" width={1.5} />
                <YAxis tickFormat={(t) => `${t.label}°`} />
                {/* values follow the crosshair; click an item to hide its series */}
                <Legend />
            </Pane>
            <Pane>
                <Grid />
                <BarSeries<WeatherDay>
                    name="Anomaly"
                    y="anomaly"
                    fill={(d) => (d.anomaly >= 0 ? "#f97316" : "#06b6d4")}
                />
                <YAxis />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
