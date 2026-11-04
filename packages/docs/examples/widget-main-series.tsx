"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, LastValueLabel } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { CHART_TYPES, chartData, chartTypeInfo, MainSeries, WidgetIcon, type ChartType } from "@reincharts/widget";
import { useMemo, useState } from "react";
import { WithToolbar } from "@/components/preview/controls";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const bars = daily.slice(-400);

/** The chart type picker of <TradingChart>, rebuilt from its exported building blocks in a plain chart. */
export default function ChartTypeSwitcher() {
    const theme = useDocsChartTheme();
    const [type, setType] = useState<ChartType>("candles");
    // the bars unchanged, or new bars for Heikin Ashi, Renko, Kagi, Point & figure and Line break
    const data = useMemo(() => chartData(type, bars), [type]);
    // transforms that build irregular bars (renko...) are not 1:1 with the source: reset the view
    const family = chartTypeInfo(type).timeBased ? "time" : type;
    return (
        <WithToolbar
            toolbar={
                <div className="flex flex-wrap gap-0.5">
                    {CHART_TYPES.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            title={t.label}
                            aria-label={t.label}
                            aria-pressed={t.id === type}
                            onClick={() => setType(t.id)}
                            className={`rounded-md p-1 transition-colors ${
                                t.id === type
                                    ? "bg-fd-accent text-fd-foreground"
                                    : "text-fd-muted-foreground hover:text-fd-foreground"
                            }`}
                        >
                            {/* the widget's icon set: every chart type id is also an icon name */}
                            <WidgetIcon name={t.id} />
                        </button>
                    ))}
                </div>
            }
        >
            <ChartCanvas data={data} theme={theme} barSpacing={8} resetKey={family}>
                <Pane>
                    <Grid />
                    <MainSeries type={type} name={`MSFT · ${chartTypeInfo(type).label}`} />
                    <LastValueLabel />
                    <YAxis />
                    <Legend />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
