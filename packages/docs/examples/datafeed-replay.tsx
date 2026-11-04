"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { useBarReplay } from "@reincharts/datafeed";
import { ToolbarButton, WithToolbar } from "@/components/preview/controls";
import { daily } from "@/lib/data";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

export default function BarReplay() {
    const theme = useDocsChartTheme();
    // reveal the data bar by bar, starting 200 bars before the end
    const replay = useBarReplay(daily, { startIndex: -200, speed: 8 });
    return (
        <WithToolbar
            toolbar={
                <>
                    <ToolbarButton onClick={replay.toggle}>{replay.playing ? "Pause" : "Play"}</ToolbarButton>
                    <ToolbarButton onClick={() => replay.stepBack()}>‹ Back</ToolbarButton>
                    <ToolbarButton onClick={() => replay.step()}>Step ›</ToolbarButton>
                    <ToolbarButton onClick={replay.reset}>Reset</ToolbarButton>
                    <span className="text-xs text-fd-muted-foreground tabular-nums">
                        bar {replay.index + 1} / {daily.length}
                    </span>
                </>
            }
        >
            <ChartCanvas data={replay.data} theme={theme} barSpacing={9}>
                <Pane>
                    <Grid />
                    <CandlestickSeries name="MSFT" />
                    <YAxis />
                    <Legend title="MSFT · Replay" />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
