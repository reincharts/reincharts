"use client";
import { ChartCanvas, formatCompact, Pane } from "@reincharts/core";
import { AreaSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { type Drawing, Drawings, DrawingStyleToolbar, DrawingToolbar, useDrawings } from "@reincharts/interactive";
import { traffic, type TrafficDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// sessions as a 7-day trailing average, which smooths out the weekly cycle
const data = traffic.map((d, i) => {
    const week = traffic.slice(Math.max(0, i - 6), i + 1);
    return { ...d, sessions: Math.round(week.reduce((sum, w) => sum + w.sessions, 0) / week.length) };
});

const last = data.length - 1;
// a point on the day `back` days before the last one
const at = (back: number, value: number) => ({ time: data[last - back].date.getTime(), price: value });

const defaultDrawings: Drawing[] = [
    // value change between two levels, with the percent change
    { id: "growth", type: "priceRange", pane: "main", points: [at(200, 3870), at(135, 4760)], style: {} },
    // number of days between two dates
    { id: "campaign", type: "dateRange", pane: "main", points: [at(120, 3750), at(85, 3950)], style: {} },
    // both at once
    { id: "summer", type: "dateAndPriceRange", pane: "main", points: [at(65, 5180), at(5, 4780)], style: {} },
];

export default function MeasureTools() {
    const theme = useDocsChartTheme();
    const drawings = useDrawings({ defaultDrawings });
    return (
        <div className="flex size-full flex-col">
            {/* only this group's tools, as a horizontal toolbar */}
            <DrawingToolbar
                controller={drawings}
                tools={["priceRange", "dateRange", "dateAndPriceRange"]}
                orientation="horizontal"
            />
            <div className="min-h-0 flex-1">
                <ChartCanvas data={data} theme={theme} barSpacing={3}>
                    <Pane id="main">
                        <Grid />
                        <AreaSeries<TrafficDay> name="Sessions (7-day average)" y="sessions" color="#3b82f6" />
                        <YAxis tickFormat={(t) => formatCompact(t.value)} />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                    <Drawings controller={drawings} />
                    <DrawingStyleToolbar controller={drawings} />
                </ChartCanvas>
            </div>
        </div>
    );
}
