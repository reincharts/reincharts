"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { MovingAverage } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, CurrentCoordinate, EdgeIndicator, LastValueLabel, PriceLine } from "@reincharts/coordinates";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function PriceLines() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={daily} theme={theme} barSpacing={6}>
            <Pane>
                <Grid />
                <LineSeries name="MSFT" y="close" />
                <MovingAverage type="ema" period={50} color="#f59e0b" />
                {/* fixed prices with titles */}
                <PriceLine price={62} title="Target" color="#10b981" />
                <PriceLine price={56} title="Stop" color="#ef4444" />
                {/* last value of every series on the axis, with a dotted line */}
                <LastValueLabel line />
                {/* first visible close, on the left edge */}
                <EdgeIndicator y="close" item="first" color="#a1a1aa" />
                {/* dot on the hovered value */}
                <CurrentCoordinate y="close" />
                <YAxis />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
