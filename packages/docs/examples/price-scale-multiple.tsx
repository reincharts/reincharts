"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { comparison, type ComparisonBar } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function MultipleScales() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={comparison} theme={theme} barSpacing={2}>
            <Pane>
                <Grid />
                {/* S&P 500 (~1,000–2,000) on the left scale, the stocks (~10–100) on the right one */}
                <LineSeries<ComparisonBar> name="S&P 500" y="sp500" scale="left" color="#a1a1aa" width={1.5} />
                <LineSeries<ComparisonBar> name="AAPL" y="aapl" color="#2962ff" width={1.5} />
                <LineSeries<ComparisonBar> name="GE" y="ge" color="#f59e0b" width={1.5} />
                <YAxis side="left" scale="left" />
                <YAxis side="right" />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
