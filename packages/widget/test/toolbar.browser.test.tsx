import { formatResolution, RESOLUTIONS, resolutionToMs } from "@reincharts/datafeed";
import { page, userEvent } from "vitest/browser";
import { CHART_TYPES } from "../src";
import { DEFAULT_FAVORITES } from "../src/state";
import "../src/styles.css";
import {
    button,
    chartCanvas,
    clickButton,
    frames,
    legendRow,
    medianStep,
    memoryFeed,
    menuitem,
    mountWidget,
    unmountAll,
    press,
    randomFeed,
    until,
} from "./helpers";

afterEach(unmountAll);

describe("TradingChart toolbar (real UI)", () => {
    it("searches and selects symbols (click, keyboard, Enter before results arrive)", async () => {
        const w = await mountWidget({ datafeed: randomFeed(), defaultSymbol: "AAPL", defaultResolution: "1D" });
        const firstClose = w.engine().data.at(-1).close;
        expect(legendRow(w.host, "AAPL")?.textContent).toContain("NASDAQ");

        await clickButton(/^Symbol search/);
        const dialog = page.getByRole("dialog", { name: "Symbol search" });
        await expect.element(dialog).toBeVisible();
        await expect.poll(() => dialog.getByRole("option").elements().length).toBe(3);
        await userEvent.type(dialog.getByRole("textbox"), "micro");
        await expect.poll(() => dialog.getByRole("option").elements().length).toBe(1);
        await dialog.getByRole("option", { name: /MSFT/ }).click();
        await until(() => w.engine().data.at(-1)?.close !== firstClose, "MSFT data");
        expect(w.state().symbol).toBe("MSFT");
        expect(page.getByRole("dialog").query()).toBeNull();
        await expect.element(button(/^Symbol search \(MSFT\)/)).toBeVisible();
        await until(() => legendRow(w.host, "MSFT")?.textContent?.includes("1D"), "legend title");
        expect(w.engine().data.at(-1).close).toBeGreaterThan(250); // MSFT walks around 400

        // keyboard: arrows + Enter
        await clickButton(/^Symbol search/);
        await expect.poll(() => page.getByRole("option").elements().length).toBe(3);
        await press("{ArrowDown}{ArrowDown}");
        expect(page.getByRole("option", { name: /NVDA/ }).element().getAttribute("aria-selected")).toBe("true");
        await press("{Enter}");
        expect(w.state().symbol).toBe("NVDA");

        // typing then Enter right away (before the debounced search answered) picks the typed symbol
        await clickButton(/^Symbol search/);
        await expect.poll(() => page.getByRole("option").elements().length).toBe(3);
        await userEvent.keyboard("msft{Enter}");
        await until(() => w.state().symbol === "MSFT", "MSFT picked by Enter", 2000);
        await frames();
        expect(page.getByRole("dialog").query()).toBeNull();

        // Escape closes without changing anything
        await clickButton(/^Symbol search/);
        await press("{Escape}");
        expect(page.getByRole("dialog").query()).toBeNull();
        expect(w.state().symbol).toBe("MSFT");
        w.unmount();
    });

    it("switches intervals with every favorite button and every dropdown item, and edits favorites", async () => {
        const w = await mountWidget({ datafeed: randomFeed(), defaultSymbol: "AAPL", defaultResolution: "1D" });
        const toolbar = page.getByRole("toolbar", { name: "Chart toolbar" });
        const expectResolution = async (r: string) => {
            await until(() => w.state().resolution === r, `resolution ${r}`);
            await until(() => {
                const e = w.engine();
                if (e.data.length < 10) {
                    return false;
                }
                const step = medianStep(e.times);
                const want = resolutionToMs(r);
                // weeks / months vary a little, days and below are exact
                return Math.abs(Math.log(step / want)) < 0.2;
            }, `bars spaced by ${r}`);
        };

        // favorite buttons
        const favorites = DEFAULT_FAVORITES;
        for (const r of [...favorites].reverse()) {
            const btn = toolbar.getByRole("button", { name: new RegExp(`^${longName(r)}$`) });
            await btn.click();
            await expectResolution(r);
            expect(btn.element().getAttribute("aria-pressed")).toBe("true");
        }

        // dropdown: every resolution
        for (const r of RESOLUTIONS) {
            await clickButton("Interval");
            const item = page.getByRole("menuitemradio", { name: longName(r), exact: true });
            await item.click();
            await frames();
            expect(page.getByRole("menu").query(), "menu closes").toBeNull();
            await expectResolution(r);
            if (!favorites.includes(r)) {
                // a non-favorite interval is shown next to the dropdown chevron
                expect(button("Interval").element().textContent).not.toBe("");
            }
        }

        // star: add "2h" (120) to the favorites, then remove it
        await clickButton("Interval");
        const row = page.getByRole("menuitemradio", { name: longName("120"), exact: true }).element().parentElement!;
        await userEvent.click(row.querySelector<HTMLElement>('[aria-label="Add to favorites"]')!, { force: true });
        await frames();
        expect(w.state().favorites).toContain("120");
        await press("{Escape}");
        expect(page.getByRole("menu").query()).toBeNull();
        const fav = toolbar.getByRole("button", { name: new RegExp(`^${longName("120")}$`) });
        await expect.element(fav).toBeVisible();
        await fav.click();
        await expectResolution("120");
        await clickButton("Interval");
        const row2 = page.getByRole("menuitemradio", { name: longName("120"), exact: true }).element().parentElement!;
        await userEvent.click(row2.querySelector<HTMLElement>('[aria-label="Remove from favorites"]')!, {
            force: true,
        });
        await press("{Escape}");
        expect(w.state().favorites).not.toContain("120");
        expect(fav.query()).toBeNull();
        w.unmount();
    });

    for (const mode of ["data", "datafeed"] as const) {
        it(`renders every chart type from the chart type menu (${mode} mode)`, async () => {
            const w = await mountWidget(
                mode === "data"
                    ? { defaultIndicators: ["ema", "rsi"] }
                    : { datafeed: memoryFeed(), defaultSymbol: "AAA", defaultIndicators: ["ema", "rsi"] },
            );
            const symbol = mode === "data" ? "TEST" : "AAA";
            const source = w.engine().data.length;
            for (const t of CHART_TYPES) {
                await button(/^Chart type/).click();
                await menuitem(t.label).click();
                await frames(3);
                expect(page.getByRole("menu").query()).toBeNull();
                expect(w.state().chartType).toBe(t.id);
                expect(
                    button(/^Chart type/)
                        .element()
                        .getAttribute("title"),
                ).toBe(`Chart type: ${t.label}`);
                const e = w.engine();
                expect(e.data.length, `${t.id} has data`).toBeGreaterThan(t.timeBased ? source - 1 : 3);
                const n = e.data.length - 1;
                // main series, EMA overlay and the RSI pane all have legend values at the last bar
                const main = e.legendItems("price", n).find((i) => i.name === symbol);
                expect(main, `${t.id} main series legend`).toBeTruthy();
                expect(main!.values.length, `${t.id} legend values`).toBeGreaterThan(0);
                expect(legendRow(w.host, symbol), `${t.id} legend row`).toBeTruthy();
                expect(e.legendItems("pane-rsi-1", n).length).toBe(1);
                // the canvas really drew something in the plot
                expect(e.getScale("price").max).toBeGreaterThan(e.getScale("price").min);
            }
            w.unmount();
        });
    }

    it("toggles the theme (chrome + canvas) and the fullscreen mode", async () => {
        const w = await mountWidget({ theme: "light" });
        const root = w.host.querySelector<HTMLElement>(".rc-widget")!;
        const chart = w.host.querySelector<HTMLElement>(".rc-chart")!;
        const lightBg = getComputedStyle(root).backgroundColor;
        const lightCanvas = chart.style.background;
        await clickButton("Dark theme");
        expect(root.dataset.theme).toBe("dark");
        expect(w.state().theme).toBe("dark");
        expect(w.engine().theme.name).toBe("dark");
        expect(getComputedStyle(root).backgroundColor).not.toBe(lightBg);
        expect(chart.style.background).not.toBe(lightCanvas);
        await expect.element(button("Light theme")).toBeVisible();
        await clickButton("Light theme");
        expect(root.dataset.theme).toBe("light");
        expect(w.engine().theme.name).toBe("light");

        await clickButton("Fullscreen");
        await until(() => document.fullscreenElement === root, "fullscreen");
        await until(() => root.hasAttribute("data-fullscreen"), "data-fullscreen");
        await until(() => w.engine().width > 1200, "chart grows to the screen");
        await clickButton("Exit fullscreen");
        await until(() => !document.fullscreenElement, "fullscreen exit");
        await until(() => !root.hasAttribute("data-fullscreen"), "data-fullscreen removed");
        await until(() => w.engine().width < 1200, "chart shrinks back");
        await expect.element(button("Fullscreen")).toBeVisible();
        w.unmount();
    });

    it("downloads a PNG snapshot of the chart", async () => {
        const w = await mountWidget({ defaultIndicators: ["rsi"] });
        const clicks: { href: string; download: string }[] = [];
        const spy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
            this: HTMLAnchorElement,
        ) {
            clicks.push({ href: this.href, download: this.download });
        });
        try {
            await clickButton("Take a snapshot");
            expect(clicks).toHaveLength(1);
            expect(clicks[0].download).toBe("TEST.png");
            expect(clicks[0].href).toMatch(/^data:image\/png;base64,/);
            const img = new Image();
            img.src = clicks[0].href;
            await img.decode();
            const e = w.engine();
            expect(img.naturalWidth).toBe(e.width);
            expect(img.naturalHeight).toBe(e.height);
        } finally {
            spy.mockRestore();
        }
        w.unmount();
    });

    it("hides secondary buttons in narrow widgets and keeps the essentials", async () => {
        const w = await mountWidget({ datafeed: randomFeed(), defaultSymbol: "AAPL" }, { width: 480, height: 500 });
        await expect.element(button(/^Symbol search/)).toBeVisible();
        await expect.element(button("Indicators")).toBeVisible();
        await expect.element(button("Settings")).toBeVisible();
        expect(button("Layout").query()?.checkVisibility()).toBeFalsy();
        // nothing overflows the toolbar
        const bar = w.host.querySelector<HTMLElement>(".rc-w-toolbar")!;
        expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth + 1);
        expect(chartCanvas(w.host)).toBeTruthy();
        w.unmount();
    });

    it("collapses the toolbar step by step so it never overflows", async () => {
        const w = await mountWidget({ datafeed: randomFeed(), defaultSymbol: "AAPL" }, { width: 1400, height: 500 });
        const bar = w.host.querySelector<HTMLElement>(".rc-w-toolbar")!;
        expect(bar.dataset.compact).toBeUndefined();
        let last = 0;
        for (const width of [1000, 840, 700, 560, 400]) {
            w.host.style.width = `${width}px`;
            await frames();
            expect(bar.scrollWidth, `${width}px`).toBeLessThanOrEqual(bar.clientWidth + 1);
            const level = Number(bar.dataset.compact ?? 0);
            expect(level).toBeGreaterThanOrEqual(last);
            last = level;
        }
        expect(last).toBeGreaterThan(0);
        await expect.element(button("Take a snapshot")).toBeVisible();
        // widening restores the full toolbar
        w.host.style.width = "1400px";
        await frames();
        expect(bar.dataset.compact).toBeUndefined();
        w.unmount();
    });
});

/** Long interval label of the dropdown / favorite button titles. */
const longName = (r: string) => formatResolution(r, "long");
