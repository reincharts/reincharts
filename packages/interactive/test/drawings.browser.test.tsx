import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import * as React from "react";
import { page } from "vitest/browser";
import {
    Drawings,
    DrawingStyleToolbar,
    DrawingToolbar,
    useDrawings,
    ZoomButtons,
    type Drawing,
    type DrawingController,
} from "../src";
import "../src/styles.css";

const data = generateBars(150, { seed: 7 });
const t = (i: number) => data[i].date.getTime();
const p = (i: number, price: number) => ({ time: t(i), price });
let seq = 0;
const d = (type: string, points: { time: number; price: number }[], style: Drawing["style"] = {}): Drawing => ({
    id: `v${seq++}`,
    type,
    pane: "price",
    points,
    style,
});

const scene: Drawing[] = [
    d("rectangle", [p(34, 95), p(57, 87.8)], {
        color: "#9c27b0",
        fill: "rgba(156, 39, 176, 0.1)",
        text: "Accumulation",
    }),
    d("parallelChannel", [p(57, 89.3), p(85, 101.9), p(57, 94.6)], { color: "#2962ff" }),
    d("trendLine", [p(50, 88.3), p(100, 103.6)], { color: "#089981", extend: "right" }),
    d("dateAndPriceRange", [p(111, 104.8), p(121, 97.2)]),
    d("fibRetracement", [p(105, 110.1), p(130, 93)]),
    d("horizontalLine", [p(100, 107.2)], { color: "#f23645", text: "Resistance", dash: "dashed" }),
    d("longPosition", [p(131, 95.5), p(147, 103), p(147, 92.5)]),
    d("text", [p(66, 110.5)], { text: "Breakout ↗", fontSize: 15, color: "#ff9800" }),
    d("callout", [p(105, 110.6), p(111, 113)], { text: "ATH", fontSize: 13, color: "#2962ff" }),
    d("priceLine", [p(50, 86.5)], { text: "Buy alert", color: "#673ab7" }),
];

function Chart({
    theme,
    drawings,
    selected,
    children,
    onController,
}: {
    theme: "light" | "dark";
    drawings: Drawing[];
    selected?: string[];
    children?: (c: DrawingController) => React.ReactNode;
    onController?: (c: DrawingController) => void;
}) {
    const controller = useDrawings({ defaultDrawings: drawings });
    React.useEffect(() => {
        controller.select(selected ?? []);
        onController?.(controller);
    }, [controller, selected, onController]);
    return (
        <ChartCanvas data={data} theme={theme} ratio={1} timeZone="UTC" barSpacing={6}>
            <Pane id="price">
                <Grid />
                <CandlestickSeries />
                <YAxis />
            </Pane>
            <XAxis />
            <Drawings controller={controller} />
            {children?.(controller)}
        </ChartCanvas>
    );
}

describe("drawings (visual)", () => {
    for (const theme of ["light", "dark"] as const) {
        it(`renders many tools on a candle chart (${theme})`, async () => {
            const { host, unmount } = await mountChart(<Chart theme={theme} drawings={scene} />, {
                width: 800,
                height: 500,
            });
            await expect.element(page.elementLocator(host)).toMatchScreenshot(`drawings-${theme}`);
            unmount();
        });
    }

    it("shows handles, axis highlights and the style toolbar for a selected drawing", async () => {
        const fib = scene[4];
        const { host, unmount } = await mountChart(
            <Chart theme="light" drawings={[scene[2], fib, scene[5]]} selected={[fib.id]}>
                {(c) => <DrawingStyleToolbar controller={c} />}
            </Chart>,
            { width: 800, height: 500 },
        );
        await new Promise((r) => setTimeout(r, 50));
        await expect.element(page.elementLocator(host)).toMatchScreenshot("drawings-selected");
        unmount();
    });

    for (const theme of ["light", "dark"] as const) {
        it(`renders the drawing toolbar with an open flyout and zoom buttons (${theme})`, async () => {
            const Layout = () => {
                const [controller, setController] = React.useState<DrawingController | null>(null);
                return (
                    <div
                        style={{
                            display: "flex",
                            width: "100%",
                            height: "100%",
                            background: theme === "dark" ? "#131722" : "#fff",
                        }}
                    >
                        {/* fixed column so the chart width doesn't depend on when the toolbar lays out */}
                        <div style={{ width: 42, flex: "none" }}>
                            {controller && (
                                <DrawingToolbar
                                    controller={controller}
                                    theme={theme}
                                    favorites={["trendLine", "fibRetracement"]}
                                    onFavoritesChange={() => {}}
                                />
                            )}
                        </div>
                        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
                            <Chart theme={theme} drawings={scene.slice(0, 5)} onController={setController}>
                                {() => <ZoomButtons autoHide={false} />}
                            </Chart>
                        </div>
                    </div>
                );
            };
            const { host, unmount } = await mountChart(<Layout />, { width: 800, height: 500 });
            await new Promise((r) => setTimeout(r, 50));
            const arrow = host.querySelector('[aria-label="Fib Retracement options"]') as HTMLButtonElement;
            arrow.click();
            // let CSS transitions settle
            await new Promise((r) => setTimeout(r, 400));
            await expect.element(page.elementLocator(host)).toMatchScreenshot(`toolbar-${theme}`);
            unmount();
        });
    }
});
