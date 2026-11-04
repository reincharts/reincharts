"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, LastValueLabel } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function LineExample() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={weather} theme={theme} barSpacing={2}>
            <Pane>
                <Grid />
                <LineSeries<WeatherDay> name="Mean temperature" y="temp" curve="monotone" />
                <LastValueLabel />
                <YAxis tickFormat={(t) => `${t.label}°`} />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
