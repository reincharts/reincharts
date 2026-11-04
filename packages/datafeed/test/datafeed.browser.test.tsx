import * as React from "react";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries, LineSeries } from "@reincharts/series";
import { mountChart } from "@reincharts/testing/browser";
import { page } from "vitest/browser";
import { createRandomDatafeed, useDatafeed, type Resolution } from "../src";

const NOW = Date.UTC(2024, 5, 14, 15, 37, 20);

function DemoChart({ resolution, theme }: { resolution: Resolution; theme: "light" | "dark" }) {
    const [feed] = React.useState(() => createRandomDatafeed({ seed: 7, now: () => NOW, realtimeIntervalMs: 0 }));
    const { data, loadMore, symbolInfo } = useDatafeed(feed, { symbol: "DEMO", resolution, initialBars: 300 });
    if (data.length === 0) {
        return null;
    }
    return (
        <ChartCanvas data={data} theme={theme} ratio={1} timeZone="UTC" onReachStart={loadMore} resetKey={resolution}>
            <Pane id="price" size={3}>
                <Grid />
                <CandlestickSeries name={symbolInfo?.name} />
                <YAxis />
            </Pane>
            <Pane id="volume">
                <LineSeries y="volume" curve="step" />
                <YAxis />
            </Pane>
            <XAxis />
        </ChartCanvas>
    );
}

describe("random datafeed + ChartCanvas (visual)", () => {
    for (const [resolution, theme] of [
        ["1D", "light"],
        ["15", "dark"],
    ] as const) {
        it(`renders ${resolution} candles from useDatafeed (${theme})`, async () => {
            const { host, unmount } = await mountChart(<DemoChart resolution={resolution} theme={theme} />);
            await expect.element(page.elementLocator(host)).toMatchScreenshot(`datafeed-${resolution}-${theme}`);
            unmount();
        });
    }
});
