"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { ATR, ElderRay, ForceIndex, SAR, Stochastic } from "@reincharts/indicators";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// convenience components: <Indicator definition={...}> with typed inputs as props
const lower = {
    "slow stochastic": <Stochastic variant="slow" period={14} dSmoothing={3} />,
    ATR: <ATR period={14} maType="rma" />,
    "Elder ray": <ElderRay period={13} />,
    "Force index": <ForceIndex period={13} />,
};
type Lower = keyof typeof lower;

export default function IndicatorComponents() {
    const theme = useDocsChartTheme();
    const [id, setId] = useState<Lower>("slow stochastic");
    return (
        <WithToolbar
            toolbar={
                <Segmented label="lower pane" value={id} options={Object.keys(lower) as Lower[]} onChange={setId} />
            }
        >
            <ChartCanvas data={daily} theme={theme} barSpacing={8}>
                <Pane size={2}>
                    <Grid />
                    <CandlestickSeries name="MSFT" />
                    <SAR increment={0.02} max={0.2} color="#8b5cf6" />
                    <YAxis />
                    <Legend />
                </Pane>
                {/* key: a new pane content when the indicator changes */}
                <Pane key={id}>
                    <Grid vertical={false} />
                    {lower[id]}
                    <YAxis />
                    <Legend />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
