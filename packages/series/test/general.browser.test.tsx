import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane } from "@reincharts/core";
import { seededRandom } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import * as React from "react";
import { page } from "vitest/browser";
import {
    BubbleSeries,
    ErrorBarSeries,
    GroupedBarSeries,
    GroupedHorizontalBarSeries,
    HorizontalBarSeries,
    LineSeries,
    ScatterSeries,
    StackedAreaSeries,
    StackedBarSeries,
    StackedHorizontalBarSeries,
    StraightLine,
} from "../src";

const size = { width: 560, height: 300 };
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const random = seededRandom(9);
const monthly = months.map((x, i) => ({
    x,
    a: Math.round(40 + 25 * Math.sin(i / 2) + random() * 10),
    b: Math.round(30 + 15 * Math.cos(i / 3) + random() * 10),
    c: Math.round(20 + i * 2 + random() * 8),
    net: Math.round((random() - 0.4) * 40),
}));
const countries = ["United States", "China", "Germany", "Japan", "India", "United Kingdom", "France"];
const gdp = countries.map((label, i) => ({
    label,
    value: Math.round(100 - i * 11 + random() * 8),
    b: Math.round(30 + random() * 40),
}));
const points = Array.from({ length: 80 }, () => {
    const x = random() * 100;
    return { x, y: 10 + x * 0.6 + (random() - 0.5) * 30, r: random() * 50, group: random() > 0.5 ? 1 : 0 };
});
const measurements = Array.from({ length: 14 }, (_, i) => ({
    x: i * 2,
    y: 20 + i * 3 + (random() - 0.5) * 8,
    error: 2 + random() * 5,
}));

const shot = async (name: string, ui: React.ReactElement) => {
    const { host, unmount } = await mountChart(ui, size);
    await expect.element(page.elementLocator(host)).toMatchScreenshot(name);
    unmount();
};

const Frame = ({
    data,
    children,
    linear,
    scales,
}: {
    data: readonly any[];
    children: React.ReactNode;
    linear?: boolean;
    scales?: any;
}) => (
    <ChartCanvas data={data} ratio={1} xMode={linear ? "linear" : "index"}>
        <Pane scales={scales}>
            <Grid />
            {children}
            <YAxis />
        </Pane>
        <XAxis />
    </ChartCanvas>
);

const keys = ["a", "b", "c"] as const;
const names = ["Product A", "Product B", "Product C"];

describe("general-purpose series (visual)", () => {
    it("multi-line monotone with points", () =>
        shot(
            "lines-monotone",
            <Frame data={monthly}>
                {keys.map((k, i) => (
                    <LineSeries key={k} y={k} curve="monotone" points color={["#2962ff", "#ff6d00", "#9c27b0"][i]} />
                ))}
            </Frame>,
        ));

    it("stacked area", () =>
        shot(
            "stacked-area",
            <Frame data={monthly}>
                <StackedAreaSeries ys={keys} names={names} curve="monotone" />
            </Frame>,
        ));

    it("grouped bars on a category x axis", () =>
        shot(
            "grouped-bars",
            <Frame data={monthly} scales={{ right: { margins: { top: 0.08, bottom: 0 } } }}>
                <GroupedBarSeries ys={keys} names={names} radius={2} />
            </Frame>,
        ));

    it("stacked bars with negative values", () =>
        shot(
            "stacked-bars",
            <Frame data={monthly}>
                <StackedBarSeries ys={["a", "b", "net"]} names={["A", "B", "Net"]} />
                <StraightLine value={0} dash="solid" />
            </Frame>,
        ));

    it("horizontal bars with categories", () =>
        shot(
            "horizontal-bars",
            <Frame data={gdp} linear scales={{ right: { categories: countries } }}>
                <HorizontalBarSeries x="value" radius={3} />
            </Frame>,
        ));

    it("grouped and stacked horizontal bars", async () => {
        await shot(
            "horizontal-grouped",
            <Frame data={gdp} linear scales={{ right: { categories: countries } }}>
                <GroupedHorizontalBarSeries ys={["value", "b"]} />
            </Frame>,
        );
        await shot(
            "horizontal-stacked",
            <Frame data={gdp} linear scales={{ right: { categories: countries } }}>
                <StackedHorizontalBarSeries ys={["value", "b"]} />
            </Frame>,
        );
    });

    it("scatter and bubbles in linear x mode (unsorted data)", () =>
        shot(
            "scatter-bubble",
            <Frame data={points} linear>
                <BubbleSeries<(typeof points)[number]> y="y" r="r" fill={(d, _i, theme) => theme.palette[d.group]} />
                <ScatterSeries
                    y={(d) => d.y - 40}
                    marker={(d) => (d.group ? "triangle" : "diamond")}
                    size={9}
                    fill={(_d, _i, t) => t.palette[2]}
                />
            </Frame>,
        ));

    it("error bars", () =>
        shot(
            "error-bars",
            <Frame data={measurements} linear>
                <ErrorBarSeries y="y" error="error" />
                <ScatterSeries y="y" fillOpacity={1} size={7} />
                <StraightLine value={40} />
                <StraightLine type="vertical" value={13} />
            </Frame>,
        ));
});
