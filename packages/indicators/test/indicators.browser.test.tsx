import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import { page } from "vitest/browser";
import { BollingerBands, Indicator, indicators, MACD, MovingAverage, RSI, Stochastic } from "../src";

const data = generateBars(160, { seed: 21 });

describe("indicators (visual)", () => {
    for (const theme of ["light", "dark"] as const) {
        it(`price pane with EMA / BB overlays and RSI, MACD panes (${theme})`, async () => {
            const { host, unmount } = await mountChart(
                <ChartCanvas data={data} theme={theme} ratio={1} timeZone="UTC">
                    <Pane id="price" size={3}>
                        <Grid />
                        <CandlestickSeries />
                        <BollingerBands />
                        <MovingAverage type="ema" period={9} />
                        <MovingAverage type="ema" period={50} />
                        <YAxis />
                    </Pane>
                    <Pane id="rsi">
                        <Grid />
                        <RSI />
                        <YAxis />
                    </Pane>
                    <Pane id="macd">
                        <Grid />
                        <MACD />
                        <YAxis />
                    </Pane>
                    <XAxis />
                </ChartCanvas>,
                { width: 800, height: 600 },
            );
            await expect.element(page.elementLocator(host)).toMatchScreenshot(`overlays-oscillators-${theme}`);
            unmount();
        });
    }

    it("ichimoku cloud, supertrend, SAR and stochastic", async () => {
        const { host, unmount } = await mountChart(
            <ChartCanvas data={data} ratio={1} timeZone="UTC" rightOffset={28}>
                <Pane id="price" size={3}>
                    <Grid />
                    <CandlestickSeries />
                    <Indicator definition={indicators.ichimoku} />
                    <YAxis />
                </Pane>
                <Pane id="stoch">
                    <Grid />
                    <Stochastic variant="slow" />
                    <YAxis />
                </Pane>
                <XAxis />
            </ChartCanvas>,
            { width: 800, height: 520 },
        );
        await expect.element(page.elementLocator(host)).toMatchScreenshot("ichimoku-stochastic");
        unmount();
    });

    it("supertrend, SAR, VWAP and volume", async () => {
        const intraday = generateBars(200, { seed: 4, interval: 15 * 60_000, start: Date.UTC(2024, 0, 2, 0) });
        const { host, unmount } = await mountChart(
            <ChartCanvas data={intraday} theme="dark" ratio={1} timeZone="UTC">
                <Pane id="price" size={3}>
                    <Grid />
                    <CandlestickSeries />
                    <Indicator definition={indicators.supertrend} />
                    <Indicator definition={indicators.sar} />
                    <Indicator definition={indicators.vwap} />
                    <YAxis />
                </Pane>
                <Pane id="volume">
                    <Grid />
                    <Indicator definition={indicators.volume} />
                    <YAxis />
                </Pane>
                <XAxis />
            </ChartCanvas>,
            { width: 800, height: 520 },
        );
        await expect.element(page.elementLocator(host)).toMatchScreenshot("trend-volume-dark");
        unmount();
    });
});
