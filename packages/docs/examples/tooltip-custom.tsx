"use client";
import { ChartCanvas, Pane, useChartState } from "@reincharts/core";
import { BarSeries, LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Tooltip, TooltipCard, type TooltipContent } from "@reincharts/tooltip";
import { traffic, type TrafficDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const weekday = new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric", year: "numeric" });

/** The default card plus a computed row: wrap TooltipCard instead of rebuilding it. */
function Card({ content }: { content: TooltipContent }) {
    const theme = useChartState((s) => s.theme);
    const d = content.datum as TrafficDay;
    const rate = (d.signups / d.sessions) * 100;
    return (
        <div>
            <TooltipCard content={content} theme={theme} />
            <div
                className="mt-1 rounded-md px-2.5 py-1 text-xs font-medium"
                style={{ background: rate >= 3.3 ? "rgba(16, 185, 129, 0.15)" : theme.selection, color: theme.text }}
            >
                Conversion {rate.toFixed(2)}%
            </div>
        </div>
    );
}

export default function CustomTooltip() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={traffic} theme={theme} barSpacing={7}>
            <Pane>
                <Grid />
                <BarSeries<TrafficDay> name="Sign-ups" y="signups" scale="signups" fill="rgba(139, 92, 246, 0.55)" />
                <LineSeries<TrafficDay> name="Sessions" y="sessions" color="#3b82f6" width={1.5} />
                <YAxis />
                <YAxis side="left" scale="signups" />
                {/* formatHeader changes the title, render replaces the card (still positioned at the pointer) */}
                <Tooltip
                    formatHeader={(i) => weekday.format(traffic[i].date)}
                    render={(content) => <Card content={content} />}
                />
            </Pane>
            <XAxis />
            <Crosshair horizontal={false} />
        </ChartCanvas>
    );
}
