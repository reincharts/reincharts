"use client";
import { ChartCanvas, ChartOverlay, Pane, useChart, usePaneId } from "@reincharts/core";
import { BarSeries, LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { useLegend } from "@reincharts/tooltip";
import { traffic, type TrafficDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const count = (v: number) => Math.round(v).toLocaleString("en");

/** A legend with your own markup: useLegend gives the shown bar and every series' name, color and values. */
function StatCards() {
    const engine = useChart<TrafficDay>();
    const { index, hovered, entries } = useLegend(usePaneId());
    const day = engine.data[index]?.date;
    return (
        <ChartOverlay>
            <div className="m-3 flex flex-wrap items-start gap-2">
                {entries.map(({ item }) => (
                    <button
                        key={item.id}
                        type="button"
                        // overlays let pointer events through: opt in on interactive elements
                        className="pointer-events-auto rounded-md border border-fd-border bg-fd-background/90 px-2.5 py-1.5 text-left shadow-xs transition-opacity hover:bg-fd-accent"
                        style={{ opacity: item.hidden ? 0.45 : 1 }}
                        onClick={() => engine.setHidden(item.id)}
                    >
                        <span className="flex items-center gap-1.5 text-[11px] text-fd-muted-foreground">
                            <span className="size-2 rounded-full" style={{ background: item.color }} />
                            {item.name}
                        </span>
                        <span className="block text-sm font-semibold tabular-nums text-fd-foreground">
                            {item.values[0]?.value ?? "–"}
                        </span>
                    </button>
                ))}
                <span className="self-center text-xs text-fd-muted-foreground">
                    {day?.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    {hovered ? "" : " (latest)"}
                </span>
            </div>
        </ChartOverlay>
    );
}

export default function CustomLegend() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={traffic} theme={theme} barSpacing={9}>
            {/* sessions in the top part of the pane, sign-ups below it */}
            <Pane
                scales={{
                    right: { margins: { top: 0.3, bottom: 0.35 } },
                    signups: { margins: { top: 0.72, bottom: 0.02 } },
                }}
            >
                <Grid />
                <LineSeries<TrafficDay> name="Sessions" y="sessions" color="#3b82f6" format={count} />
                <BarSeries<TrafficDay> name="Sign-ups" y="signups" scale="signups" fill="#f59e0b" format={count} />
                <YAxis />
                <StatCards />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
