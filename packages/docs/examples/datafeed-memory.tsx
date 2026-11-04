"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { createMemoryDatafeed, useDatafeed } from "@reincharts/datafeed";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// daily bars in memory; weekly and monthly bars are aggregated on demand
const feed = createMemoryDatafeed({ MSFT: daily.map((d) => ({ ...d, time: d.date.getTime() })) }, { resolution: "1D" });
const resolutions = ["1D", "1W", "1M"] as const;

export default function MemoryDatafeed() {
    const theme = useDocsChartTheme();
    const [resolution, setResolution] = useState<(typeof resolutions)[number]>("1W");
    const { data, loadMore } = useDatafeed(feed, { symbol: "MSFT", resolution, initialBars: 200, pageSize: 200 });
    return (
        <WithToolbar
            toolbar={<Segmented label="interval" value={resolution} options={resolutions} onChange={setResolution} />}
        >
            <ChartCanvas data={data} theme={theme} barSpacing={8} onReachStart={loadMore} resetKey={resolution}>
                <Pane>
                    <Grid />
                    <CandlestickSeries name="MSFT" />
                    <YAxis />
                    <Legend title={`MSFT · ${resolution}`} />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
