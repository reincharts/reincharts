import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries, LineSeries } from "@reincharts/series";
import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import { page } from "vitest/browser";
import { Crosshair, CurrentCoordinate, LastValueLine, PriceLine, type CrosshairMode } from "../src";

const data = generateBars(120, { seed: 11 });

/** Moves the pointer to a position inside the chart and waits for the frame. */
const hover = async (host: HTMLElement, x: number, y: number) => {
    const top = host.querySelectorAll("canvas")[1];
    const rect = top.getBoundingClientRect();
    top.dispatchEvent(
        new PointerEvent("pointermove", {
            clientX: rect.left + x,
            clientY: rect.top + y,
            bubbles: true,
            pointerId: 1,
            pointerType: "mouse",
        }),
    );
    for (let i = 0; i < 2; i++) {
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    }
};

const sma = (i: number, n = 10) => {
    if (i < n - 1) {
        return undefined;
    }
    let s = 0;
    for (let k = i - n + 1; k <= i; k++) {
        s += data[k].close;
    }
    return s / n;
};

describe("coordinates (visual)", () => {
    for (const mode of ["normal", "magnet"] as CrosshairMode[]) {
        for (const theme of ["light", "dark"] as const) {
            it(`crosshair ${mode} with labels in two panes (${theme})`, async () => {
                const { host, unmount } = await mountChart(
                    <ChartCanvas data={data} theme={theme} ratio={1} timeZone="UTC">
                        <Pane id="price" size={3}>
                            <Grid />
                            <CandlestickSeries name="TEST" />
                            <LineSeries y={(_d, i) => sma(i)} color="#ff9800" width={1.5} />
                            <CurrentCoordinate y={(_d, i) => sma(i)} fill="#ff9800" />
                            <YAxis />
                        </Pane>
                        <Pane id="volume">
                            <Grid />
                            <LineSeries y="volume" curve="step" />
                            <YAxis />
                        </Pane>
                        <XAxis />
                        <Crosshair mode={mode} />
                    </ChartCanvas>,
                );
                await hover(host, 330, 60);
                await expect.element(page.elementLocator(host)).toMatchScreenshot(`crosshair-${mode}-${theme}`);
                unmount();
            });
        }
    }

    it("last value labels and price lines", async () => {
        const { host, unmount } = await mountChart(
            <ChartCanvas data={data} ratio={1} timeZone="UTC">
                <Pane id="price" size={3}>
                    <Grid />
                    <CandlestickSeries name="TEST" />
                    <LineSeries y={(_d, i) => sma(i)} color="#ff9800" width={1.5} name="SMA 10" />
                    <LineSeries y={(_d, i) => sma(i, 30)} color="#9c27b0" width={1.5} name="SMA 30" />
                    <PriceLine price={data[60].high} color="#2962ff" title="Target" />
                    <LastValueLine />
                    <YAxis />
                </Pane>
                <Pane id="volume">
                    <LineSeries y="volume" curve="step" color="#26a69a" />
                    <LastValueLine />
                    <YAxis />
                </Pane>
                <XAxis />
            </ChartCanvas>,
        );
        await expect.element(page.elementLocator(host)).toMatchScreenshot("last-values");
        unmount();
    });
});
