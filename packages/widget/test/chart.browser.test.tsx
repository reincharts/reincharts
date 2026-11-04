import { page, userEvent } from "vitest/browser";
import { presetStart, RANGE_PRESETS } from "../src";
import "../src/styles.css";
import {
    button,
    chartCanvas,
    clickButton,
    drag,
    frames,
    legendAction,
    legendRow,
    menuitem,
    mountWidget,
    press,
    randomFeed,
    unmountAll,
    until,
} from "./helpers";

afterEach(unmountAll);

const DAY = 86_400_000;

describe("Legend actions (real UI)", () => {
    it("hides / shows the main series and the volume, opens settings, removes the volume", async () => {
        const w = await mountWidget({ defaultIndicators: ["ema"] });
        const n = () => w.engine().data.length - 1;
        const item = (name: string) =>
            w
                .engine()
                .legendItems("price", n())
                .find((i) => i.name === name);

        // main series: eye + gear (no ×)
        await legendAction(w.host, "TEST", "Hide");
        expect(item("TEST")?.hidden).toBe(true);
        expect(legendRow(w.host, "TEST")!.querySelector('[aria-label="Remove"]')).toBeNull();
        await legendAction(w.host, "TEST", "Show");
        expect(item("TEST")?.hidden).toBeFalsy();
        await legendAction(w.host, "TEST", "Settings");
        await expect.element(page.getByRole("dialog", { name: "Chart settings" })).toBeVisible();
        await press("{Escape}");

        // volume: eye + ×
        await legendAction(w.host, "Vol", "Hide");
        expect(item("Volume")?.hidden).toBe(true);
        await legendAction(w.host, "Vol", "Show");
        expect(item("Volume")?.hidden).toBeFalsy();
        await legendAction(w.host, "Vol", "Remove");
        expect(w.state().settings?.volume).toBe(false);
        expect(item("Volume")).toBeUndefined();

        // indicator: eye (state), gear, ×
        await legendAction(w.host, "EMA", "Hide");
        expect(w.state().indicators[0].hidden).toBe(true);
        await legendAction(w.host, "EMA", "Show");
        expect(w.state().indicators[0].hidden).toBe(false);
        await legendAction(w.host, "EMA", "Settings");
        await expect.element(page.getByRole("dialog", { name: "EMA 9 close" })).toBeVisible();
        await press("{Escape}");
        await legendAction(w.host, "EMA", "Remove");
        expect(w.state().indicators).toEqual([]);
        w.unmount();
    });
});

describe("Pane controls (real UI)", () => {
    it("maximizes, restores, collapses, expands and removes indicator panes, and maximizes the price pane", async () => {
        const w = await mountWidget({ defaultIndicators: ["rsi", "macd"] });
        const pane = (id: string) => w.engine().layout.panes.find((p) => p.id === id)!;
        const hoverPane = async (id: string) => {
            const p = pane(id);
            const r = chartCanvas(w.host).getBoundingClientRect();
            await userEvent.hover(chartCanvas(w.host), {
                position: { x: p.left + p.width / 2, y: p.top + p.height / 2 },
                force: true,
            });
            await frames(2);
            expect(r.width).toBeGreaterThan(0);
        };
        const control = (label: string) => {
            const btn = w.host.querySelector<HTMLElement>(`.rc-w-pane-controls [aria-label="${label}"]`);
            expect(btn, `pane control "${label}"`).toBeTruthy();
            return btn!;
        };
        const priceHeight = pane("price").height;

        await hoverPane("pane-rsi-1");
        await userEvent.click(control("Maximize pane"), { force: true });
        await frames(2);
        expect(pane("pane-rsi-1").height).toBeGreaterThan(priceHeight);
        expect(pane("price").height).toBeLessThanOrEqual(0);
        // the controls stay visible while maximized
        await userEvent.click(control("Restore pane"), { force: true });
        await frames(2);
        expect(pane("price").height).toBe(priceHeight);

        await hoverPane("pane-rsi-1");
        const rsiHeight = pane("pane-rsi-1").height;
        await userEvent.click(control("Collapse pane"), { force: true });
        await frames(2);
        expect(pane("pane-rsi-1").height).toBeLessThan(rsiHeight);
        await userEvent.click(control("Expand pane"), { force: true });
        await frames(2);
        expect(pane("pane-rsi-1").height).toBe(rsiHeight);

        // the price pane can be maximized too (no remove button)
        await hoverPane("price");
        expect(w.host.querySelector('.rc-w-pane-controls [aria-label="Remove pane"]')).toBeNull();
        await userEvent.click(control("Maximize pane"), { force: true });
        await frames(2);
        expect(pane("pane-macd-1").height).toBeLessThanOrEqual(0);
        await userEvent.click(control("Restore pane"), { force: true });
        await frames(2);

        await hoverPane("pane-macd-1");
        await userEvent.click(control("Remove pane"), { force: true });
        await frames(2);
        expect(w.state().indicators.map((i) => i.id)).toEqual(["rsi-1"]);
        expect(w.engine().paneIds).toEqual(["price", "pane-rsi-1"]);
        w.unmount();
    });
});

describe("Context menu (real UI)", () => {
    it("runs every item and disables the ones with nothing to do", async () => {
        const w = await mountWidget();
        const canvas = chartCanvas(w.host);
        const open = async (x = 300, y = 200) => {
            await userEvent.click(canvas, { button: "right", position: { x, y } });
            await frames();
            await expect.element(page.getByRole("menu")).toBeVisible();
        };
        const disabled = (name: string | RegExp) => (menuitem(name).element() as HTMLButtonElement).disabled;

        await open();
        expect(disabled("Remove all indicators")).toBe(true);
        expect(disabled("Remove all drawings")).toBe(true);
        // copy price
        const copied: string[] = [];
        const spy = vi.spyOn(navigator.clipboard, "writeText").mockImplementation(async (t) => {
            copied.push(t);
        });
        const label = menuitem(/^Copy price/).element().textContent!;
        await menuitem(/^Copy price/).click();
        expect(copied).toHaveLength(1);
        expect(label).toContain(copied[0]);
        expect(Number(copied[0])).toBeGreaterThan(0);
        spy.mockRestore();
        expect(page.getByRole("menu").query()).toBeNull();

        // reset chart view after panning
        const initial = { ...w.engine().getVisibleRange() };
        await drag(canvas, 300);
        expect(w.engine().getVisibleRange().to).toBeLessThan(initial.to);
        await open();
        await menuitem("Reset chart view").click();
        await frames(2);
        const reset = w.engine().getVisibleRange();
        expect(reset.to).toBe(initial.to);
        expect(Math.abs(reset.from - initial.from)).toBeLessThan(10 * DAY);

        // scale modes with check marks
        for (const [name, mode] of [
            ["Log scale", "log"],
            ["Percent scale", "percent"],
            ["Indexed to 100", "indexed"],
        ] as const) {
            await open();
            await menuitem(name).click();
            await frames();
            expect(w.state().scaleMode).toBe(mode);
            expect(w.engine().getScale("price").mode).toBe(mode);
            await open();
            expect(menuitem(name).element().closest(".rc-w-menu-row")!.querySelector(".rc-w-menu-check")).toBeTruthy();
            await menuitem(name).click(); // toggles back to linear
            await frames();
            expect(w.state().scaleMode).toBe("linear");
        }
        // on a percent scale "Copy price" still copies the price, not the percentage
        await clickButton("Percentage scale");
        await open();
        expect(menuitem(/^Copy price/).element().textContent).not.toContain("%");
        const copy2 = vi.spyOn(navigator.clipboard, "writeText").mockImplementation(async (t) => {
            copied.push(t);
        });
        await menuitem(/^Copy price/).click();
        copy2.mockRestore();
        expect(Number(copied.at(-1))).toBeGreaterThan(50);
        await clickButton("Percentage scale");

        // auto scale
        w.engine().getScale("price").auto = false;
        await open();
        expect(
            menuitem("Auto scale").element().closest(".rc-w-menu-row")!.querySelector(".rc-w-menu-check"),
        ).toBeNull();
        await menuitem("Auto scale").click();
        expect(w.engine().getScale("price").isAuto).toBe(true);

        // dialogs and panels
        await open();
        await menuitem("Add indicator…").click();
        await expect.element(page.getByRole("dialog", { name: "Indicators" })).toBeVisible();
        await page.getByRole("button", { name: /^Relative Strength Index/ }).click();
        await press("{Escape}");
        await open();
        expect(disabled("Remove all indicators")).toBe(false);
        await menuitem("Remove all indicators").click();
        expect(w.state().indicators).toEqual([]);

        await open();
        await menuitem("Settings…").click();
        await expect.element(page.getByRole("dialog", { name: "Chart settings" })).toBeVisible();
        await press("{Escape}");
        await open();
        await menuitem("Object tree").click();
        await expect.element(page.getByRole("complementary", { name: "Object tree" })).toBeVisible();

        // Escape and outside clicks close it
        await open();
        await press("{Escape}");
        expect(page.getByRole("menu").query()).toBeNull();
        await open();
        await userEvent.click(w.host.querySelector(".rc-w-bottombar")!, { position: { x: 600, y: 10 } });
        expect(page.getByRole("menu").query()).toBeNull();

        // in a small corner, the menu stays inside the widget
        const c = canvas.getBoundingClientRect();
        await open(c.width - 80, c.height - 40);
        const m = page.getByRole("menu").element().getBoundingClientRect();
        const root = w.host.getBoundingClientRect();
        expect(m.right).toBeLessThanOrEqual(root.right);
        expect(m.bottom).toBeLessThanOrEqual(root.bottom);
        await press("{Escape}");
        w.unmount();
    });
});

describe("Bottom bar (real UI)", () => {
    it("applies every range preset, loading older history when needed", async () => {
        const w = await mountWidget({ datafeed: randomFeed(), defaultSymbol: "AAPL", defaultResolution: "1D" });
        for (const p of RANGE_PRESETS) {
            await clickButton(p);
            const e = w.engine();
            const last = e.times[e.data.length - 1];
            const start = presetStart(p, last);
            if (start === undefined) {
                // "All": everything loaded is visible
                expect(e.from).toBe(-0.5);
                continue;
            }
            // the history reaches back far enough (5Y needs older pages), and the range starts near the preset start
            await until(() => {
                const r = w.engine().getVisibleRange();
                return Math.abs(r.from - start) < 4 * DAY;
            }, `range of ${p}`);
            const r = w.engine().getVisibleRange();
            expect(r.to).toBeGreaterThanOrEqual(last);
        }
        expect(w.engine().data.length).toBeGreaterThan(5 * 365);
        w.unmount();
    });

    it("toggles % / log / auto, shows the scroll-to-realtime button, changes the time zone", async () => {
        const w = await mountWidget();
        const scale = () => w.engine().getScale("price");
        await clickButton("Log scale");
        expect(scale().mode).toBe("log");
        expect(button("Log scale").element().getAttribute("aria-pressed")).toBe("true");
        await clickButton("Percentage scale");
        expect(scale().mode).toBe("percent");
        expect(button("Log scale").element().getAttribute("aria-pressed")).toBe("false");
        await clickButton("Percentage scale");
        expect(scale().mode).toBe("linear");

        // dragging the price axis turns auto off, "auto" turns it back on
        const canvas = chartCanvas(w.host);
        const r = canvas.getBoundingClientRect();
        const axisX = w.engine().layout.panes[0].left + w.engine().layout.panes[0].width + 20;
        const { pointer } = await import("./helpers");
        pointer(canvas, "pointermove", r.left + axisX, r.top + 150, 0);
        pointer(canvas, "pointerdown", r.left + axisX, r.top + 150);
        for (let k = 1; k <= 5; k++) {
            pointer(canvas, "pointermove", r.left + axisX, r.top + 150 + k * 20);
            await frames(1);
        }
        pointer(canvas, "pointerup", r.left + axisX, r.top + 250);
        await frames(2);
        expect(scale().isAuto).toBe(false);
        expect(button("Auto scale").element().getAttribute("aria-pressed")).toBe("false");
        await clickButton("Auto scale");
        expect(scale().isAuto).toBe(true);
        expect(button("Auto scale").element().getAttribute("aria-pressed")).toBe("true");

        // scroll to realtime
        expect(w.host.querySelector(".rc-w-realtime")).toBeNull();
        await drag(canvas, 400);
        await until(() => w.host.querySelector(".rc-w-realtime"), "realtime button");
        await userEvent.click(w.host.querySelector(".rc-w-realtime")!);
        await frames(2);
        expect(w.engine().range.end).toBe(w.engine().data.length - 1);
        await until(() => !w.host.querySelector(".rc-w-realtime"), "realtime button hidden");

        // time zone menu (opens upwards, inside the widget)
        expect(button(/^Time zone/).element().textContent).toBe("UTC");
        await clickButton(/^Time zone/);
        const menu = page.getByRole("menu").element().getBoundingClientRect();
        expect(menu.top).toBeGreaterThanOrEqual(w.host.getBoundingClientRect().top);
        expect(menu.bottom).toBeLessThanOrEqual(w.host.getBoundingClientRect().bottom);
        await menuitem("Tokyo").click();
        expect(w.state().settings?.timeZone).toBe("Asia/Tokyo");
        expect(w.engine().options.timeZone).toBe("Asia/Tokyo");
        expect(button(/^Time zone/).element().textContent).toBe("Tokyo");
        w.unmount();
    });

    it("disables time range presets for renko-like chart types", async () => {
        const w = await mountWidget({ defaultChartType: "renko" });
        for (const p of RANGE_PRESETS) {
            expect((button(p).element() as HTMLButtonElement).disabled, p).toBe(p !== "All");
        }
        await clickButton("All");
        expect(w.engine().from).toBe(-0.5);
        w.unmount();
    });
});

describe("Bar replay (real UI)", () => {
    for (const mode of ["data", "datafeed"] as const) {
        it(`enters, selects a bar, plays, pauses, steps, changes speed and exits (${mode} mode)`, async () => {
            const w = await mountWidget(
                mode === "data" ? {} : { datafeed: randomFeed(), defaultSymbol: "AAPL", defaultResolution: "60" },
            );
            const total = w.engine().data.length;
            const len = () => w.engine().data.length;
            await clickButton("Bar replay");
            expect(button("Bar replay").element().getAttribute("aria-pressed")).toBe("true");
            const bar = page.getByRole("toolbar", { name: "Bar replay" });
            await expect.element(bar).toBeVisible();
            await until(() => len() < total, "replay hides future bars");
            const start = len();

            await bar.getByRole("button", { name: "Step forward" }).click();
            await until(() => len() === start + 1, "step");
            await bar.getByRole("button", { name: "Step back" }).click();
            await bar.getByRole("button", { name: "Step back" }).click();
            await until(() => len() === start - 1, "step back");

            // select a bar on the chart
            await bar.getByRole("button", { name: "Select bar" }).click();
            await expect.element(bar.getByRole("button", { name: "Click a bar…" })).toBeVisible();
            const canvas = chartCanvas(w.host);
            const e = w.engine();
            const target = Math.floor((e.range.start + e.range.end) / 2);
            const x = e.xOfIndex(target);
            await userEvent.click(canvas, { position: { x, y: 150 } });
            await until(() => len() === target + 1, "replay restarts at the clicked bar");
            await expect.element(bar.getByRole("button", { name: "Select bar" })).toBeVisible();

            // speed + play / pause
            await bar.getByRole("combobox", { name: "Replay speed" }).selectOptions("10");
            await bar.getByRole("button", { name: "Play" }).click();
            await until(() => len() >= target + 3, "playing reveals bars", 3000);
            await bar.getByRole("button", { name: "Pause" }).click();
            const paused = len();
            await new Promise((r) => setTimeout(r, 350));
            expect(len()).toBe(paused);

            // exit while playing: all data back, the timer stops
            await bar.getByRole("button", { name: "Play" }).click();
            await bar.getByRole("button", { name: "Exit replay" }).click();
            await until(() => len() === total, "exit restores the data");
            expect(bar.query()).toBeNull();
            const renders = w.states.length;
            await new Promise((r) => setTimeout(r, 350));
            expect(len()).toBe(total);
            expect(w.states.length).toBe(renders);
            // re-entering starts paused
            await clickButton("Bar replay");
            await until(() => len() < total);
            const again = len();
            await new Promise((r) => setTimeout(r, 300));
            expect(len()).toBe(again);
            await clickButton("Bar replay");
            await until(() => len() === total);
            w.unmount();
        });
    }

    it("selects the replay start on a renko chart (bricks map to the source bars)", async () => {
        const w = await mountWidget({ defaultChartType: "renko" });
        await clickButton("Bar replay");
        const bar = page.getByRole("toolbar", { name: "Bar replay" });
        await expect.element(bar).toBeVisible();
        await frames(3);
        await bar.getByRole("button", { name: "Select bar" }).click();
        const e = w.engine();
        const target = Math.floor((e.range.start + e.range.end) / 2);
        const brickTime = e.times[target];
        await userEvent.click(chartCanvas(w.host), { position: { x: e.xOfIndex(target), y: 150 } });
        await frames(3);
        // the replay ends at the bar of the clicked brick, so the last brick is that brick
        await until(() => w.engine().times[w.engine().data.length - 1] <= brickTime, "replay at the brick");
        expect(w.engine().times[w.engine().data.length - 1]).toBeGreaterThan(w.engine().times[0]);
        w.unmount();
    });
});
