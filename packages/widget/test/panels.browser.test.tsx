import * as React from "react";
import { page, userEvent } from "vitest/browser";
import type { TradingChartState } from "../src";
import "../src/styles.css";
import {
    button,
    chartCanvas,
    clickButton,
    frames,
    legendRow,
    memoryFeed,
    menuitem,
    mountWidget,
    pointer,
    press,
    randomFeed,
    unmountAll,
    until,
} from "./helpers";

afterEach(unmountAll);

const drawingCount = (s: TradingChartState) => s.drawings.length;

/** Picks the trend line tool and draws one on the chart with two clicks. */
async function drawTrendLine(host: HTMLElement, from = [0.3, 0.3], to = [0.6, 0.5]) {
    await page.getByRole("button", { name: "Trend Line", exact: true }).click();
    const canvas = chartCanvas(host);
    const r = canvas.getBoundingClientRect();
    for (const [fx, fy] of [from, to]) {
        const x = r.left + r.width * fx;
        const y = r.top + r.height * fy;
        pointer(canvas, "pointermove", x, y, 0);
        pointer(canvas, "pointerdown", x, y);
        pointer(canvas, "pointerup", x, y);
        await frames(1);
    }
    await frames(3);
}

const tree = () => page.getByRole("tree");
const treeRow = (name: string | RegExp) =>
    [...tree().element().querySelectorAll<HTMLElement>(".rc-w-tree-row")].find((r) =>
        typeof name === "string" ? r.textContent === name : name.test(r.textContent ?? ""),
    );
const treeButton = async (row: string, label: string) => {
    const el = treeRow(row);
    expect(el, `tree row ${row}`).toBeTruthy();
    await userEvent.hover(el!, { force: true });
    const full = label === "Settings" ? `${row} settings` : label === "Remove volume" ? label : `${label} ${row}`;
    const btn = el!.querySelector<HTMLElement>(`[aria-label="${full}"]`);
    expect(btn, `${label} on ${row}`).toBeTruthy();
    await userEvent.click(btn!, { force: true });
    await frames(2);
};

describe("Drawings, undo / redo, object tree (real UI)", () => {
    it("draws, lists, selects, hides, locks, deletes (key), undoes and redoes drawings", async () => {
        const w = await mountWidget({ datafeed: memoryFeed(), defaultSymbol: "AAA", defaultIndicators: ["rsi"] });
        const undo = () => button("Undo").element() as HTMLButtonElement;
        const redo = () => button("Redo").element() as HTMLButtonElement;
        expect(undo().disabled).toBe(true);
        expect(redo().disabled).toBe(true);

        await drawTrendLine(w.host);
        await until(() => drawingCount(w.state()) === 1, "a drawing");
        expect(undo().disabled).toBe(false);
        await press("{Escape}"); // deselect

        await clickButton("Object tree");
        expect(button("Object tree").element().getAttribute("aria-pressed")).toBe("true");
        const rows = () => [...tree().element().querySelectorAll(".rc-w-tree-row")].map((r) => r.textContent);
        expect(rows()).toEqual(["AAA", "Volume", "Trend Line", "RSI 14 close"]);
        expect([...tree().element().querySelectorAll(".rc-w-tree-pane")].map((p) => p.textContent)).toEqual([
            "Main pane",
            "Pane 2",
        ]);

        // select from the tree, Delete removes it, undo brings it back
        await userEvent.click(treeRow("Trend Line")!, { force: true });
        expect(treeRow("Trend Line")!.getAttribute("aria-selected")).toBe("true");
        chartCanvas(w.host).closest<HTMLElement>(".rc-chart")!.focus();
        await press("{Delete}");
        await until(() => drawingCount(w.state()) === 0, "deleted");
        expect(treeRow("Trend Line")).toBeUndefined();
        await clickButton("Undo");
        expect(drawingCount(w.state())).toBe(1);
        expect(redo().disabled).toBe(false);
        await clickButton("Redo");
        expect(drawingCount(w.state())).toBe(0);
        await clickButton("Undo");
        expect(drawingCount(w.state())).toBe(1);

        // hide / show / lock / unlock / remove from the tree
        await treeButton("Trend Line", "Hide");
        expect((w.state().drawings[0] as { hidden?: boolean }).hidden).toBe(true);
        expect(treeRow("Trend Line")!.hasAttribute("data-hidden")).toBe(true);
        await treeButton("Trend Line", "Show");
        expect((w.state().drawings[0] as { hidden?: boolean }).hidden).toBe(false);
        await treeButton("Trend Line", "Lock");
        expect((w.state().drawings[0] as { locked?: boolean }).locked).toBe(true);
        await treeButton("Trend Line", "Unlock");
        expect((w.state().drawings[0] as { locked?: boolean }).locked).toBe(false);
        await treeButton("Trend Line", "Remove");
        expect(drawingCount(w.state())).toBe(0);

        // main series, volume and indicator rows
        const n = () => w.engine().data.length - 1;
        const hidden = (name: string) =>
            w
                .engine()
                .legendItems("price", n())
                .find((i) => i.name === name)?.hidden;
        await treeButton("AAA", "Hide");
        expect(hidden("AAA")).toBe(true);
        expect(treeRow("AAA")!.hasAttribute("data-hidden")).toBe(true);
        await treeButton("AAA", "Show");
        expect(hidden("AAA")).toBeFalsy();
        await treeButton("AAA", "Settings");
        await expect.element(page.getByRole("dialog", { name: "Chart settings" })).toBeVisible();
        await press("{Escape}");
        await treeButton("Volume", "Hide");
        expect(hidden("Volume")).toBe(true);
        await treeButton("Volume", "Show");
        await treeButton("Volume", "Remove volume");
        expect(w.state().settings?.volume).toBe(false);
        expect(treeRow("Volume")).toBeUndefined();
        await treeButton("RSI 14 close", "Hide");
        expect(w.state().indicators[0].hidden).toBe(true);
        await treeButton("RSI 14 close", "Show");
        await treeButton("RSI 14 close", "Settings");
        await expect.element(page.getByRole("dialog", { name: "RSI 14 close" })).toBeVisible();
        await press("{Escape}");
        await treeButton("RSI 14 close", "Remove");
        expect(w.state().indicators).toEqual([]);
        expect(rows()).toEqual(["AAA"]);

        // close button
        await page.getByRole("button", { name: "Close object tree" }).click();
        expect(page.getByRole("tree").query()).toBeNull();
        expect(button("Object tree").element().getAttribute("aria-pressed")).toBe("false");

        // context menu: remove all drawings
        await drawTrendLine(w.host);
        await drawTrendLine(w.host, [0.2, 0.6], [0.4, 0.7]);
        await until(() => drawingCount(w.state()) === 2);
        await press("{Escape}");
        await userEvent.click(chartCanvas(w.host), { button: "right", position: { x: 500, y: 300 } });
        await menuitem("Remove all drawings").click();
        expect(drawingCount(w.state())).toBe(0);
        await clickButton("Undo");
        expect(drawingCount(w.state())).toBe(2);
        w.unmount();
    });
});

describe("Keyboard (real UI)", () => {
    it("closes menus, dropdowns and dialogs with Escape and returns the focus", async () => {
        const w = await mountWidget({ datafeed: randomFeed(), defaultSymbol: "AAPL" });
        for (const name of [/^Chart type/, "Interval", "Layout"]) {
            await clickButton(name);
            await expect.element(page.getByRole("menu")).toBeVisible();
            await press("{Escape}");
            expect(page.getByRole("menu").query(), `${name} menu closed`).toBeNull();
            expect(document.activeElement).toBe(button(name).element());
        }
        // outside click closes a dropdown
        await clickButton("Layout");
        await userEvent.click(chartCanvas(w.host), { position: { x: 300, y: 300 } });
        expect(page.getByRole("menu").query()).toBeNull();
        // opening another dropdown closes the first one
        await clickButton(/^Chart type/);
        await clickButton("Layout");
        expect(page.getByRole("menu").elements()).toHaveLength(1);
        await press("{Escape}");
        // keyboard only: open the chart type menu, move with the arrows, pick with Enter
        (button(/^Chart type/).element() as HTMLElement).focus();
        await press("{Enter}");
        expect(document.activeElement?.textContent).toBe("Candles");
        await press("{ArrowDown}{ArrowDown}");
        expect(document.activeElement?.textContent).toBe("Heikin Ashi");
        await press("{End}");
        expect(document.activeElement?.textContent).toBe("Point & figure");
        await press("{ArrowDown}");
        expect(document.activeElement?.textContent).toBe("Bars");
        await press("{Enter}");
        expect(w.state().chartType).toBe("bars");
        expect(page.getByRole("menu").query()).toBeNull();
        (button("Layout").element() as HTMLElement).focus();
        await press("{ArrowDown}");
        expect(document.activeElement?.getAttribute("aria-label")).toBe("1 chart");
        await press("{Escape}");

        for (const name of ["Indicators", "Settings", "Compare symbol", /^Symbol search/]) {
            await clickButton(name);
            await expect.element(page.getByRole("dialog")).toBeVisible();
            await press("{Escape}");
            expect(page.getByRole("dialog").query(), `${name} dialog closed`).toBeNull();
        }
        w.unmount();
    });
});

describe("Resizing (real UI)", () => {
    it("relayouts the charts when the container changes size", async () => {
        const w = await mountWidget({ defaultState: { layout: "2h" } });
        const e0 = w.engine();
        const width = e0.width;
        w.host.style.width = "900px";
        w.host.style.height = "500px";
        await until(() => w.engine().width < width - 100, "chart narrower");
        const cells = w.host.querySelectorAll<HTMLElement>(".rc-w-cell");
        for (const c of cells) {
            const canvas = c.querySelector("canvas")!;
            expect(canvas.getBoundingClientRect().width).toBeCloseTo(c.getBoundingClientRect().width, 0);
            expect(canvas.getBoundingClientRect().height).toBeCloseTo(c.getBoundingClientRect().height, 0);
        }
        expect(w.host.querySelector<HTMLElement>(".rc-widget")!.getBoundingClientRect().height).toBe(500);
        w.unmount();
    });
});

describe("TradingChartHandle (real UI)", () => {
    it("round-trips save / load with drawings, indicators, chart type, layout and the visible range", async () => {
        const w = await mountWidget({ datafeed: memoryFeed(), defaultSymbol: "AAA" });
        const h = () => w.ref.current!;
        let rsi: string | undefined;
        React.act(() => {
            rsi = h().addIndicator("rsi", { inputs: { period: 7 } });
        });
        expect(rsi).toBe("rsi-1");
        React.act(() => void h().addIndicator("ema"));
        await drawTrendLine(w.host);
        await press("{Escape}");
        await clickButton(/^Chart type/);
        await menuitem("Heikin Ashi").click();
        await clickButton("Layout");
        await page.getByRole("menuitemradio", { name: "2 charts, stacked" }).click();
        await frames(4);
        // pan to a custom range
        w.engine().setVisibleRange(Date.UTC(2024, 3, 1), Date.UTC(2024, 6, 1));
        await frames(2);
        const saved = h().save();
        expect(saved).toMatchObject({ symbol: "AAA", chartType: "heikinAshi", layout: "2v" });
        expect(saved.indicators.map((i) => i.id)).toEqual(["rsi-1", "ema-1"]);
        expect(saved.drawings).toHaveLength(1);
        expect(Object.keys(saved.paneSizes ?? {})).toEqual(["price", "pane-rsi-1"]);
        const json = JSON.stringify(saved);

        // change everything
        React.act(() => h().removeIndicator("rsi-1"));
        await clickButton(/^Chart type/);
        await menuitem("Renko").click();
        await clickButton("Layout");
        await page.getByRole("menuitemradio", { name: "1 chart" }).click();
        await clickButton(/^Symbol search/);
        await expect.poll(() => page.getByRole("option").elements().length).toBe(3);
        await page.getByRole("option", { name: /BBB/ }).click();
        await until(() => legendRow(w.host, "BBB"), "BBB");
        await clickButton("Undo");
        expect(h().save().drawings).toHaveLength(0);

        // load restores it all, including the range (after the AAA data is loaded again)
        React.act(() => h().load(json));
        await until(() => legendRow(w.host, "AAA"), "AAA again");
        await frames(4);
        const again = h().save();
        expect(again.indicators).toEqual(saved.indicators);
        expect(again.drawings).toEqual(saved.drawings);
        expect(again).toMatchObject({ symbol: "AAA", chartType: "heikinAshi", layout: "2v" });
        expect(w.host.querySelectorAll(".rc-w-cell")).toHaveLength(2);
        expect(Math.abs(again.visibleRange!.from - saved.visibleRange!.from)).toBeLessThan(86_400_000);
        expect(Math.abs(again.visibleRange!.to - saved.visibleRange!.to)).toBeLessThan(86_400_000);
        // loading more history later doesn't snap the view back
        w.engine().setVisibleRange(Date.UTC(2024, 0, 10), Date.UTC(2024, 2, 1));
        await frames(4);
        const moved = w.engine().getVisibleRange();
        expect(Math.abs(moved.from - Date.UTC(2024, 0, 10))).toBeLessThan(2 * 86_400_000);

        // a partial state keeps the symbol
        React.act(() => h().load({ chartType: "line" }));
        await frames(4);
        expect(h().save()).toMatchObject({ symbol: "AAA", chartType: "line", indicators: [] });

        // screenshot + resetView
        const png = h().screenshot();
        expect(png).toMatch(/^data:image\/png;base64,/);
        expect(png.length).toBeGreaterThan(5000);
        w.engine().setVisibleRange(Date.UTC(2024, 3, 1), Date.UTC(2024, 4, 1));
        React.act(() => h().resetView());
        await frames(3);
        expect(w.engine().range.end).toBe(w.engine().data.length - 1);
        w.unmount();
    });

    it("keeps working in React.StrictMode (datafeed, replay, drawings, dialogs)", async () => {
        const w = await mountWidget(
            { datafeed: randomFeed(), defaultSymbol: "AAPL", defaultIndicators: ["ema"] },
            { strict: true },
        );
        expect(w.engine().data.length).toBe(500);
        await clickButton("Bar replay");
        await until(() => w.engine().data.length < 500);
        const start = w.engine().data.length;
        await page.getByRole("button", { name: "Step forward" }).click();
        await until(() => w.engine().data.length === start + 1);
        await page.getByRole("button", { name: "Exit replay" }).click();
        await until(() => w.engine().data.length === 500);
        await drawTrendLine(w.host);
        await until(() => w.state().drawings.length === 1, "drawing in StrictMode");
        await press("{Escape}");
        await clickButton("Undo");
        expect(w.state().drawings).toHaveLength(0);
        await clickButton("Indicators");
        await page.getByRole("button", { name: /^Relative Strength Index/ }).click();
        await press("{Escape}");
        expect(w.state().indicators.map((i) => i.id)).toEqual(["ema-1", "rsi-1"]);
        w.unmount();
    });
});
