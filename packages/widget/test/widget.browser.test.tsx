import { createMemoryDatafeed } from "@reincharts/datafeed";
import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import * as React from "react";
import { page } from "vitest/browser";
import { TradingChart, type TradingChartHandle, type TradingChartProps } from "../src";
import "../src/styles.css";

const series = (seed: number, price: number) =>
    generateBars(320, { seed, price, start: Date.UTC(2024, 0, 1) }).map(({ date, ...b }) => ({
        ...b,
        time: date.getTime(),
    }));

const feed = createMemoryDatafeed(
    { AAPL: series(7, 180), MSFT: series(11, 410), NVDA: series(3, 90) },
    {
        symbols: {
            AAPL: { description: "Apple Inc.", exchange: "NASDAQ", type: "stock" },
            MSFT: { description: "Microsoft Corporation", exchange: "NASDAQ", type: "stock" },
            NVDA: { description: "NVIDIA Corporation", exchange: "NASDAQ", type: "stock" },
        },
    },
);

const T = (d: string) => Date.parse(`${d}T00:00:00Z`);
const drawings = [
    {
        id: "t1",
        type: "trendLine",
        pane: "price",
        points: [
            { time: T("2024-07-08"), price: 203 },
            { time: T("2024-09-23"), price: 160 },
        ],
        style: {},
    },
    { id: "h1", type: "horizontalLine", pane: "price", points: [{ time: T("2024-08-01"), price: 172.5 }], style: {} },
];

const frames = async (n = 4) => {
    for (let i = 0; i < n; i++) {
        await new Promise((r) => requestAnimationFrame(r));
    }
};

const mount = async (props: Partial<TradingChartProps>, ref?: React.Ref<TradingChartHandle>) => {
    const result = await mountChart(
        <TradingChart
            ref={ref}
            datafeed={feed}
            defaultSymbol="AAPL"
            defaultIndicators={["ema", "rsi", "macd"]}
            timeZone="UTC"
            ratio={1}
            {...props}
        />,
        { width: 1200, height: 700 },
    );
    // wait for the datafeed and a few renders
    for (let i = 0; i < 50 && result.host.querySelector(".rc-w-status"); i++) {
        await frames(1);
    }
    await frames(6);
    return result;
};

describe("TradingChart (visual)", () => {
    for (const theme of ["light", "dark"] as const) {
        it(`full widget (${theme})`, async () => {
            const { host, unmount } = await mount({ theme, defaultState: { drawings } });
            await expect.element(page.elementLocator(host)).toMatchScreenshot(`widget-${theme}`);
            unmount();
        });
    }

    it("indicators dialog", async () => {
        const { host, unmount } = await mount({ theme: "light" });
        host.querySelector<HTMLButtonElement>('button[aria-label="Indicators"]')!.click();
        await frames(4);
        await expect.element(page.elementLocator(host)).toMatchScreenshot("widget-indicators-dialog");
        unmount();
    });

    it("multi-chart 2h layout", async () => {
        const { host, unmount } = await mount({
            theme: "dark",
            defaultIndicators: ["sma"],
            defaultState: { layout: "2h", cells: ["MSFT"] },
        });
        await expect.element(page.elementLocator(host)).toMatchScreenshot("widget-layout-2h");
        unmount();
    });
});
