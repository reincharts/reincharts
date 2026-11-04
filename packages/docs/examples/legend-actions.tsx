"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function LegendActions() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={weather} theme={theme} barSpacing={4}>
            <Pane>
                <Grid />
                <LineSeries<WeatherDay> name="High" y="high" color="#f97316" />
                <LineSeries<WeatherDay> name="Mean" y="temp" />
                <LineSeries<WeatherDay> name="Low" y="low" color="#06b6d4" />
                <YAxis tickFormat={(t) => `${t.label}°`} />
                <Legend
                    swatch
                    actions={(item, { toggle }) => (
                        <button
                            type="button"
                            onClick={toggle}
                            className="pointer-events-auto rounded px-1 text-[10px] text-fd-muted-foreground hover:bg-fd-accent"
                        >
                            {item.hidden ? "show" : "hide"}
                        </button>
                    )}
                />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
