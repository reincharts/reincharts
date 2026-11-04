import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane } from "@reincharts/core";
import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import { page } from "vitest/browser";
import { CandlestickSeries, LineSeries } from "../src";

const data = generateBars(150, { seed: 7 });

describe("candlestick (visual)", () => {
    for (const theme of ["light", "dark"] as const) {
        it(`renders candles, line, axes and grid (${theme})`, async () => {
            const { host, unmount } = await mountChart(
                <ChartCanvas data={data} theme={theme} ratio={1} timeZone="UTC">
                    <Pane id="price" size={3}>
                        <Grid />
                        <CandlestickSeries name="TEST" />
                        <LineSeries y={(d) => (d.high + d.low) / 2} color="#ff9800" width={1.5} />
                        <YAxis />
                    </Pane>
                    <Pane id="volume">
                        <LineSeries y="volume" curve="step" />
                        <YAxis />
                    </Pane>
                    <XAxis />
                </ChartCanvas>,
            );
            await expect.element(page.elementLocator(host)).toMatchScreenshot(`candles-${theme}`);
            unmount();
        });
    }
});
