"use client";
import { ChartCanvas, Pane, useChart, useRenderable, withAlpha } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

/** A custom series: a filled band between each day's low and high temperature. */
function RangeBand({ color = "#8b5cf6" }: { color?: string }) {
    const engine = useChart<WeatherDay>();
    useRenderable<WeatherDay>({
        // autoscale: the band must fit between the lowest low and highest high on screen
        extent(start, end) {
            let min = Infinity;
            let max = -Infinity;
            for (let i = start; i <= end; i++) {
                min = Math.min(min, engine.data[i].low);
                max = Math.max(max, engine.data[i].high);
            }
            return [min, max];
        },
        // legend values at the hovered bar
        legend: (i) => {
            const d = engine.data[i];
            return d && { id: "range", name: "Range", color, values: [{ value: `${d.low}° – ${d.high}°` }] };
        },
        draw(ctx, { data, start, end, x, y }) {
            ctx.beginPath();
            for (let i = start; i <= end; i++) {
                ctx.lineTo(x(i), y(data[i].high));
            }
            for (let i = end; i >= start; i--) {
                ctx.lineTo(x(i), y(data[i].low));
            }
            ctx.closePath();
            ctx.fillStyle = withAlpha(color, 0.25);
            ctx.fill();
        },
    });
    return null;
}

export default function CustomSeries() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={weather} theme={theme} barSpacing={6}>
            <Pane>
                <Grid />
                <RangeBand />
                <LineSeries<WeatherDay> name="Mean" y="temp" color="#8b5cf6" width={1.5} />
                <YAxis tickFormat={(t) => `${t.label}°`} />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
