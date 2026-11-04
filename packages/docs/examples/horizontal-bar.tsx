"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { HorizontalBarSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Tooltip } from "@reincharts/tooltip";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// GDP 2025, trillions of US$
const data = [
    { country: "United States", gdp: 30.3, growth: 1.8 },
    { country: "China", gdp: 19.5, growth: 4.6 },
    { country: "Germany", gdp: 4.9, growth: 0.4 },
    { country: "India", gdp: 4.2, growth: 6.4 },
    { country: "Japan", gdp: 4.2, growth: 0.6 },
    { country: "United Kingdom", gdp: 3.8, growth: 1.1 },
    { country: "France", gdp: 3.3, growth: 0.7 },
    { country: "Italy", gdp: 2.5, growth: 0.5 },
];

export default function HorizontalBars() {
    const theme = useDocsChartTheme();
    return (
        // linear x mode + a category price scale: datum i is drawn in band i
        <ChartCanvas data={data} theme={theme} xMode="linear" initialView="fit">
            <Pane scales={{ right: { categories: data.map((d) => d.country), margins: { top: 0.04, bottom: 0.04 } } }}>
                <Grid horizontal={false} />
                <HorizontalBarSeries name="GDP (T$)" x="gdp" radius={4} widthRatio={0.65} />
                <YAxis />
                <Tooltip />
            </Pane>
            <XAxis />
            <Crosshair vertical={false} />
        </ChartCanvas>
    );
}
