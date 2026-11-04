"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function AxesAndGrid() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={weather} theme={theme} barSpacing={5}>
            <Pane>
                <Grid vertical={false} dash="dashed" />
                <LineSeries<WeatherDay> name="Mean" y="temp" />
                <YAxis side="left" tickFormat={(t) => `${t.label}°C`} />
                <YAxis side="right" tickSpacing={60} showTicks={false} />
            </Pane>
            <XAxis tickSpacing={120} height={32} />
            <Crosshair />
        </ChartCanvas>
    );
}
