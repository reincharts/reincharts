import { ChartCanvas, Pane, useRenderable } from "@reincharts/core";
import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import { page } from "vitest/browser";
import { Grid, XAxis, YAxis } from "../src";

/** Minimal series so the scales have extents (keeps axes tests independent of @reincharts/series). */
const Dots = ({ y }: { y: (d: any) => number }) => {
    useRenderable({
        baseValue: (s) => y(data[s]),
        extent: (s, e) => {
            let min = Infinity;
            let max = -Infinity;
            for (const d of data.slice(s, e + 1)) {
                min = Math.min(min, y(d));
                max = Math.max(max, y(d));
            }
            return [min, max];
        },
        draw(ctx, { data: rows, start, end, x, y: yOf, theme }) {
            ctx.fillStyle = theme.line;
            for (let i = start; i <= end; i++) {
                ctx.fillRect(x(i) - 1, yOf(y(rows[i])) - 1, 2, 2);
            }
        },
    });
    return null;
};

const data = generateBars(120, { seed: 3, interval: 3_600_000 });

describe("axes (visual)", () => {
    it("time axis + left/right price axes + grid", async () => {
        const { host, unmount } = await mountChart(
            <ChartCanvas data={data} ratio={1} timeZone="UTC">
                <Pane id="a" size={2}>
                    <Grid />
                    <Dots y={(d) => d.close} />
                    <YAxis />
                    <YAxis side="left" />
                </Pane>
                <Pane id="b" scales={{ right: { mode: "percent" } }}>
                    <Grid vertical={false} />
                    <Dots y={(d) => d.close * (1 + Math.sin(d.volume) * 0.01)} />
                    <YAxis />
                </Pane>
                <XAxis />
            </ChartCanvas>,
        );
        await expect.element(page.elementLocator(host)).toMatchScreenshot("axes-time");
        unmount();
    });

    it("numeric x axis with log y scale (dark)", async () => {
        const rows = Array.from({ length: 60 }, (_, i) => ({ x: i * 2.5, y: Math.pow(1.12, i) }));
        const Y = ({ y }: { y: (d: any) => number }) => {
            useRenderable({
                extent: () => [1, Math.pow(1.12, 59)],
                draw(ctx, { data: r, start, end, x, y: yOf, theme }) {
                    ctx.strokeStyle = theme.line;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    for (let i = start; i <= end; i++) {
                        ctx.lineTo(x(i), yOf(y(r[i])));
                    }
                    ctx.stroke();
                },
            });
            return null;
        };
        const { host, unmount } = await mountChart(
            <ChartCanvas data={rows} ratio={1} theme="dark" xMode="linear">
                <Pane id="a" scales={{ right: { mode: "log" } }}>
                    <Grid />
                    <Y y={(d) => d.y} />
                    <YAxis />
                </Pane>
                <XAxis />
            </ChartCanvas>,
        );
        await expect.element(page.elementLocator(host)).toMatchScreenshot("axes-numeric-log");
        unmount();
    });

    it("category y axis (horizontal bars layout)", async () => {
        const categories = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
        const rows = categories.map((c, i) => ({ c, v: (i + 1) * 20 }));
        const Bars = () => {
            useRenderable({
                xExtent: () => [0, 100],
                draw(ctx, { engine, scale, theme }) {
                    ctx.fillStyle = theme.line;
                    const band = scale!.bandHeight * 0.6;
                    rows.forEach((r, i) => {
                        const x0 = engine.xOfLogical(0);
                        ctx.fillRect(x0, scale!.toY(i) - band / 2, engine.xOfLogical(r.v) - x0, band);
                    });
                },
            });
            return null;
        };
        const { host, unmount } = await mountChart(
            <ChartCanvas data={rows} ratio={1} xMode="linear" xAccessor={(d) => d.v}>
                <Pane id="a" scales={{ right: { categories } }}>
                    <Grid horizontal={false} />
                    <Bars />
                    <YAxis side="left" />
                </Pane>
                <XAxis />
            </ChartCanvas>,
        );
        await expect.element(page.elementLocator(host)).toMatchScreenshot("axes-category-y");
        unmount();
    });
});
