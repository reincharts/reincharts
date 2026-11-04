import { ChartCanvas, Pane, useRenderable, type ChartEngine } from "@reincharts/core";
import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import * as React from "react";
import { page } from "vitest/browser";

/** Minimal line renderable using only core (keeps core's tests independent of the other packages). */
function Line({ y, color }: { y: (d: any) => number; color?: string }) {
    useRenderable({
        extent: (s, e, data = engineData) => {
            let min = Infinity;
            let max = -Infinity;
            for (let i = s; i <= e; i++) {
                const v = y(data[i]);
                min = Math.min(min, v);
                max = Math.max(max, v);
            }
            return [min, max];
        },
        baseValue: (s) => y(engineData[s]),
        draw(ctx, { data, start, end, x, y: yOf, theme, scale }) {
            ctx.strokeStyle = color ?? theme.line;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = start; i <= end; i++) {
                ctx.lineTo(x(i), yOf(y(data[i])));
            }
            ctx.stroke();
            // value labels at the price ticks, so the screenshot shows the scale mode
            ctx.fillStyle = theme.text;
            ctx.font = `11px ${theme.fontFamily}`;
            for (const t of scale!.ticks()) {
                ctx.fillText(t.label, 6, t.y - 3);
            }
        },
    });
    return null;
}

const engineData = generateBars(220, { seed: 13 }).map((d, i) => ({ ...d, close: d.close * (1 + i / 60) }));

describe("core engine (visual)", () => {
    it("stacks resizable panes with separators and per-pane scale modes", async () => {
        const ref = React.createRef<ChartEngine>();
        const { host, unmount } = await mountChart(
            <ChartCanvas ref={ref} data={engineData} ratio={1} timeZone="UTC" initialView="fit">
                <Pane id="linear" size={2}>
                    <Line y={(d) => d.close} />
                </Pane>
                <Pane id="log" scales={{ right: { mode: "log" } }}>
                    <Line y={(d) => d.close} color="#f97316" />
                </Pane>
                <Pane id="percent" scales={{ right: { mode: "percent" } }}>
                    <Line y={(d) => d.close} color="#a855f7" />
                </Pane>
            </ChartCanvas>,
        );
        expect(ref.current!.layout.panes.map((p) => p.id)).toEqual(["linear", "log", "percent"]);
        await expect.element(page.elementLocator(host)).toMatchScreenshot("engine-panes");
        // maximizing a pane gives it the whole height
        ref.current!.toggleMaximizePane("log");
        for (let i = 0; i < 3; i++) {
            await new Promise((r) => requestAnimationFrame(() => r(undefined)));
        }
        expect(ref.current!.layout.panes.find((p) => p.id === "log")!.height).toBe(ref.current!.height);
        await expect.element(page.elementLocator(host)).toMatchScreenshot("engine-maximized");
        unmount();
    });
});
