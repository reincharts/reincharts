import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane, useChart, useRenderable, type ChartEngine } from "@reincharts/core";
import { CandlestickSeries, LineSeries } from "@reincharts/series";
import { generateBars, seededRandom } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import * as React from "react";
import { page } from "vitest/browser";
import { Legend, Tooltip } from "../src";

const bars = generateBars(120, { seed: 11 });

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
    for (let i = 0; i < 3; i++) {
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    }
};

const sma = (i: number, n: number) => {
    if (i < n - 1) {
        return undefined;
    }
    let s = 0;
    for (let k = i - n + 1; k <= i; k++) {
        s += bars[k].close;
    }
    return s / n;
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const sales = months.map((month, i) => ({
    month,
    revenue: 120 + Math.sin(i / 2) * 40 + i * 6,
    costs: 90 + Math.cos(i / 3) * 25 + i * 3,
}));

const random = seededRandom(3);
const points = Array.from({ length: 80 }, () => {
    const x = random() * 100;
    return { x, y: x * 0.6 + (random() - 0.5) * 30 };
}).sort((a, b) => a.x - b.x);

/** Minimal scatter renderable for the test (the real ScatterSeries lives in @reincharts/series). */
const Scatter = ({ color = "#2962ff" }: { color?: string }) => {
    const engine = useChart();
    useRenderable({
        extent: () => [-20, 80],
        xExtent: () => [0, 100],
        legend: (i) => ({
            id: "scatter",
            name: "Samples",
            color,
            values: [
                { label: "x", value: points[i].x.toFixed(1) },
                { label: "y", value: points[i].y.toFixed(1) },
            ],
        }),
        indexAt: (x, y) => {
            const s = engine.getScale(engine.paneIds[0]);
            let best: number | undefined;
            let dist = 12;
            points.forEach((p, i) => {
                const d = Math.hypot(engine.xOfIndex(i) - x, s.toY(p.y) - y);
                if (d < dist) {
                    dist = d;
                    best = i;
                }
            });
            return best;
        },
        draw(ctx, { x, y, crosshair }) {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.7;
            points.forEach((p, i) => {
                ctx.beginPath();
                ctx.arc(x(i), y(p.y), i === crosshair?.index ? 6 : 4, 0, Math.PI * 2);
                ctx.fill();
            });
        },
    });
    return null;
};

describe("tooltip (visual)", () => {
    for (const theme of ["light", "dark"] as const) {
        it(`legend with title, OHLC, change and indicators (${theme})`, async () => {
            const { host, unmount } = await mountChart(
                <ChartCanvas data={bars} theme={theme} ratio={1} timeZone="UTC">
                    <Pane id="price" size={3}>
                        <Grid />
                        <CandlestickSeries name="TEST" />
                        <LineSeries name="SMA 10" y={(_d, i) => sma(i, 10)} color="#ff9800" width={1.5} />
                        <LineSeries name="SMA 30" y={(_d, i) => sma(i, 30)} color="#9c27b0" width={1.5} />
                        <Legend title="TEST · 1D · NASDAQ" />
                        <YAxis />
                    </Pane>
                    <Pane id="volume">
                        <LineSeries name="Volume" y="volume" curve="step" color="#26a69a" />
                        <Legend />
                        <YAxis />
                    </Pane>
                    <XAxis />
                </ChartCanvas>,
            );
            await hover(host, 300, 150);
            await expect.element(page.elementLocator(host)).toMatchScreenshot(`legend-${theme}`);
            unmount();
        });
    }

    it("floating tooltip on a general line chart", async () => {
        const { host, unmount } = await mountChart(
            <ChartCanvas data={sales} xAccessor={(d) => d.month} ratio={1}>
                <Grid />
                <LineSeries name="Revenue" y="revenue" color="#2962ff" points />
                <LineSeries name="Costs" y="costs" color="#ff6d00" points />
                <Legend position="top" orientation="horizontal" showValues={false} />
                <Tooltip />
                <YAxis />
                <XAxis />
            </ChartCanvas>,
        );
        await hover(host, 300, 200);
        await expect.element(page.elementLocator(host)).toMatchScreenshot("tooltip-line");
        await hover(host, 560, 60);
        await expect.element(page.elementLocator(host)).toMatchScreenshot("tooltip-line-flipped");
        unmount();
    });

    it("nearest tooltip on a scatter chart (dark)", async () => {
        const ref = React.createRef<ChartEngine>();
        const { host, unmount } = await mountChart(
            <ChartCanvas ref={ref} data={points} xMode="linear" xAccessor={(d) => d.x} theme="dark" ratio={1}>
                <Grid />
                <Scatter />
                <Tooltip mode="nearest" />
                <YAxis />
                <XAxis />
            </ChartCanvas>,
        );
        const engine = ref.current!;
        const i = 40;
        const pane = engine.layout.panes[0];
        await hover(
            host,
            engine.layout.plotLeft + engine.xOfIndex(i) + 3,
            pane.top + engine.getScale(pane.id).toY(points[i].y) - 2,
        );
        expect(engine.crosshair?.index).toBe(i);
        await expect.element(page.elementLocator(host)).toMatchScreenshot("tooltip-scatter");
        unmount();
    });
});
