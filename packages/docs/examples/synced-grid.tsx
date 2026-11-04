"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { AreaSeries, BaselineSeries, CandlestickSeries, LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, LastValueLabel } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import type { ReactNode } from "react";
import { comparison, type ComparisonBar } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

function Cell({ children }: { children: ReactNode }) {
    return <div className="min-h-[240px] bg-fd-background">{children}</div>;
}

export default function SyncedGrid() {
    const theme = useDocsChartTheme();
    // one syncId: hovering any chart moves the crosshair in all four; syncRange shares pan and zoom
    const shared = { data: comparison, theme, syncId: "grid", syncRange: true, barSpacing: 5 };
    return (
        <div className="grid size-full grid-cols-1 gap-px overflow-y-auto bg-fd-border md:grid-cols-2 md:grid-rows-2">
            <Cell>
                <ChartCanvas {...shared}>
                    <Pane>
                        <Grid />
                        <CandlestickSeries name="MSFT" />
                        <LastValueLabel />
                        <YAxis width={56} />
                        <Legend title="MSFT" />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                </ChartCanvas>
            </Cell>
            <Cell>
                <ChartCanvas {...shared}>
                    <Pane>
                        <Grid />
                        <LineSeries<ComparisonBar> name="S&P 500" y="sp500" color="#f59e0b" />
                        <LastValueLabel />
                        <YAxis width={56} />
                        <Legend title="S&P 500" />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                </ChartCanvas>
            </Cell>
            <Cell>
                <ChartCanvas {...shared}>
                    <Pane>
                        <Grid />
                        <AreaSeries<ComparisonBar> name="AAPL" y="aapl" color="#8b5cf6" />
                        <LastValueLabel />
                        <YAxis width={56} />
                        <Legend title="AAPL" />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                </ChartCanvas>
            </Cell>
            <Cell>
                <ChartCanvas {...shared}>
                    <Pane>
                        <Grid />
                        <BaselineSeries<ComparisonBar> name="GE" y="ge" base={22} />
                        <LastValueLabel />
                        <YAxis width={56} />
                        <Legend title="GE · baseline 22" />
                    </Pane>
                    <XAxis />
                    <Crosshair />
                </ChartCanvas>
            </Cell>
        </div>
    );
}
