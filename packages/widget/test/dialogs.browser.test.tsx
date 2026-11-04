import { page, userEvent } from "vitest/browser";
import "../src/styles.css";
import {
    button,
    chartCanvas,
    clickButton,
    frames,
    legendAction,
    legendRow,
    memoryFeed,
    mountWidget,
    press,
    unmountAll,
    until,
} from "./helpers";

afterEach(unmountAll);

const dialog = () => page.getByRole("dialog");

describe("Indicators dialog (real UI)", () => {
    it("searches, adds (click / Enter), lists, hides, opens settings and removes indicators", async () => {
        const w = await mountWidget();
        await clickButton("Indicators");
        await expect.element(dialog()).toBeVisible();
        expect(document.activeElement).toBe(dialog().getByRole("textbox").element());

        // category groups are listed
        for (const g of ["Trend", "Momentum", "Volatility", "Volume"]) {
            await expect.element(dialog().getByRole("group", { name: g })).toBeVisible();
        }
        // search + click
        await userEvent.type(dialog().getByRole("textbox"), "relative strength");
        await expect
            .poll(
                () =>
                    dialog()
                        .getByRole("button", { name: /Relative Strength Index/ })
                        .elements().length,
            )
            .toBe(1);
        await dialog()
            .getByRole("button", { name: /Relative Strength Index/ })
            .click();
        await frames();
        expect(w.state().indicators.map((i) => i.id)).toEqual(["rsi-1"]);
        expect(w.engine().paneIds).toEqual(["price", "pane-rsi-1"]);
        // the dialog stays open, the count badge shows 1
        expect(
            dialog()
                .getByRole("button", { name: /Relative Strength Index/ })
                .element().textContent,
        ).toContain("1");

        // Enter adds the first match
        await userEvent.clear(dialog().getByRole("textbox"));
        await userEvent.type(dialog().getByRole("textbox"), "bollinger");
        await press("{Enter}");
        expect(w.state().indicators.map((i) => i.id)).toEqual(["rsi-1", "bollinger-1"]);

        // no match
        await userEvent.clear(dialog().getByRole("textbox"));
        await userEvent.type(dialog().getByRole("textbox"), "zzzz");
        await expect.element(dialog().getByText("No indicators match your criteria")).toBeVisible();
        await press("{Enter}"); // nothing to add
        expect(w.state().indicators).toHaveLength(2);

        // "On chart" section (empty query): hide, show, settings, remove
        await dialog().getByRole("button", { name: "Clear" }).click();
        const onChart = dialog().getByRole("group", { name: "On chart" });
        await expect.element(onChart).toBeVisible();
        await onChart.getByRole("button", { name: "Hide RSI 14 close" }).click();
        expect(w.state().indicators[0].hidden).toBe(true);
        expect(legendRow(w.host, "RSI")?.querySelector(".rc-w-lg-name[data-hidden]")).toBeTruthy();
        await onChart.getByRole("button", { name: "Show RSI 14 close" }).click();
        expect(w.state().indicators[0].hidden).toBe(false);
        await onChart.getByRole("button", { name: "Remove BB 20 close 2" }).click();
        expect(w.state().indicators.map((i) => i.id)).toEqual(["rsi-1"]);
        await onChart.getByRole("button", { name: "RSI 14 close settings" }).click();
        await expect.element(page.getByRole("dialog", { name: "RSI 14 close" })).toBeVisible();
        await clickButton("Cancel");
        expect(dialog().query()).toBeNull();

        // close button
        await clickButton("Indicators");
        await dialog().getByRole("button", { name: "Close" }).click();
        expect(dialog().query()).toBeNull();
        // backdrop click closes too
        await clickButton("Indicators");
        await userEvent.click(w.host.querySelector(".rc-w-backdrop")!, { position: { x: 10, y: 10 } });
        expect(dialog().query()).toBeNull();
        w.unmount();
    });

    it("traps focus inside dialogs and restores it on close", async () => {
        const w = await mountWidget();
        const trigger = button("Settings").element() as HTMLElement;
        trigger.focus();
        await press("{Enter}");
        await expect.element(page.getByRole("dialog", { name: "Chart settings" })).toBeVisible();
        const d = dialog().element();
        for (let i = 0; i < 20; i++) {
            await userEvent.tab();
            expect(d.contains(document.activeElement), "focus stays in the dialog").toBe(true);
        }
        for (let i = 0; i < 5; i++) {
            await userEvent.tab({ shift: true });
            expect(d.contains(document.activeElement)).toBe(true);
        }
        await press("{Escape}");
        expect(dialog().query()).toBeNull();
        expect(document.activeElement).toBe(trigger);
        w.unmount();
    });
});

describe("Indicator settings dialog (real UI)", () => {
    it("applies inputs on Ok, discards them on Cancel, edits styles and restores defaults", async () => {
        const w = await mountWidget({ defaultIndicators: ["ema", "macd"] });
        await until(() => legendRow(w.host, "EMA 9"), "EMA legend");

        // Cancel: nothing changes
        await legendAction(w.host, "EMA 9", "Settings");
        let d = page.getByRole("dialog", { name: "EMA 9 close" });
        await expect.element(d).toBeVisible();
        await userEvent.fill(d.getByLabelText("Length"), "21");
        await expect.element(page.getByRole("dialog", { name: "EMA 21 close" })).toBeVisible(); // live title
        await clickButton("Cancel");
        expect(w.state().indicators[0].inputs).toEqual({});
        expect(legendRow(w.host, "EMA 9")).toBeTruthy();

        // Ok: the legend name changes
        await legendAction(w.host, "EMA 9", "Settings");
        d = dialog();
        const length = d.getByLabelText("Length");
        // the number field can be cleared and retyped
        await userEvent.clear(length);
        expect((length.element() as HTMLInputElement).value).toBe("");
        await userEvent.type(length, "50");
        await d.getByLabelText("Source").selectOptions("high");
        await clickButton("Ok");
        expect(dialog().query()).toBeNull();
        expect(w.state().indicators[0].inputs).toEqual({ period: 50, source: "high" });
        await until(() => legendRow(w.host, "EMA 50 high"), "renamed legend");

        // style tab: color, width, visibility of MACD outputs
        await legendAction(w.host, "MACD", "Settings");
        d = dialog();
        await d.getByRole("tab", { name: "Style" }).click();
        await userEvent.fill(d.getByLabelText("MACD color"), "#ff0000");
        await d.getByLabelText("Signal width").selectOptions("3");
        await d.getByRole("checkbox", { name: "Histogram" }).click();
        await clickButton("Ok");
        const macd = w.state().indicators[1];
        expect(macd.styles.macd?.color).toBe("#ff0000");
        expect(macd.styles.signal?.width).toBe(3);
        expect(macd.styles.histogram?.visible).toBe(false);
        const item = w.engine().legendItems("pane-macd-1", w.engine().data.length - 1)[0];
        // MACD (red) and signal remain, the hidden histogram has no value
        expect(item.values.map((v) => v.color)).toEqual(["#ff0000", expect.any(String)]);

        // Defaults resets inputs and styles
        await legendAction(w.host, "EMA 50", "Settings");
        await clickButton("Defaults");
        await clickButton("Ok");
        expect(w.state().indicators[0].inputs).toEqual({});
        await until(() => legendRow(w.host, "EMA 9 close"), "default legend");

        // double click on a legend name opens the settings too
        const name = legendRow(w.host, "MACD")!.querySelector(".rc-w-lg-name")!;
        await userEvent.dblClick(name, { force: true });
        await expect.element(page.getByRole("dialog", { name: /^MACD/ })).toBeVisible();
        await press("{Escape}");
        w.unmount();
    });
});

describe("Settings dialog (real UI)", () => {
    it("applies every option on Ok and discards changes on Cancel", async () => {
        const w = await mountWidget({ theme: "light" });
        const n = () => w.engine().data.length - 1;
        const root = w.host.querySelector<HTMLElement>(".rc-widget")!;
        const renderables = () => w.engine().ordered().length;
        const before = renderables();

        // Cancel discards
        await clickButton("Settings");
        await dialog().getByRole("checkbox", { name: "Volume" }).click();
        await dialog().getByLabelText("Theme").selectOptions("dark");
        await clickButton("Cancel");
        expect(root.dataset.theme).toBe("light");
        expect(
            w
                .engine()
                .legendItems("price", n())
                .some((i) => i.name === "Volume"),
        ).toBe(true);
        expect(w.states.length).toBe(0);

        // Ok with nothing changed doesn't freeze the props into the state
        await clickButton("Settings");
        await clickButton("Ok");
        expect(w.state().settings ?? {}).toEqual({});
        expect(w.state().theme).toBeUndefined();

        await clickButton("Settings");
        for (const label of ["Volume", "Last price line", "Grid lines", "Legend", "Symbol watermark"]) {
            const box = dialog().getByRole("checkbox", { name: label });
            expect((box.element() as HTMLInputElement).checked, `${label} on by default`).toBe(true);
            await box.click();
        }
        await dialog().getByLabelText("Theme").selectOptions("dark");
        await dialog().getByLabelText("Crosshair").selectOptions("magnet");
        await dialog().getByLabelText("Time zone").selectOptions("America/New_York");
        await clickButton("Ok");
        expect(w.state().settings).toEqual({
            volume: false,
            lastPriceLine: false,
            grid: false,
            legend: false,
            watermark: false,
            crosshair: "magnet",
            timeZone: "America/New_York",
        });
        expect(root.dataset.theme).toBe("dark");
        expect(w.engine().theme.name).toBe("dark");
        expect(
            w
                .engine()
                .legendItems("price", n())
                .some((i) => i.name === "Volume"),
        ).toBe(false);
        expect(w.host.querySelector(".rc-w-legend")).toBeNull();
        expect(w.engine().options.timeZone).toBe("America/New_York");
        expect(w.host.querySelector(".rc-w-zone")?.textContent).toBe("New York");
        // grid, watermark, volume, last price line are gone from the canvas
        expect(renderables()).toBeLessThanOrEqual(before - 4);

        // the dialog shows the applied values; turn everything back on
        await clickButton("Settings");
        for (const label of ["Volume", "Last price line", "Grid lines", "Legend", "Symbol watermark"]) {
            const box = dialog().getByRole("checkbox", { name: label });
            expect((box.element() as HTMLInputElement).checked).toBe(false);
            await box.click();
        }
        expect((dialog().getByLabelText("Crosshair").element() as HTMLSelectElement).value).toBe("magnet");
        const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await dialog().getByLabelText("Time zone").selectOptions(browser);
        await clickButton("Ok");
        expect(renderables()).toBe(before);
        expect(w.host.querySelector(".rc-w-legend")).toBeTruthy();
        expect(w.engine().options.timeZone).toBe(browser);
        w.unmount();
    });
});

describe("Compare (real UI)", () => {
    it("adds a compare symbol as an overlay with a legend row and a percent scale, and removes it", async () => {
        const w = await mountWidget({ datafeed: memoryFeed(), defaultSymbol: "AAA" });
        await clickButton("Compare symbol");
        const d = page.getByRole("dialog", { name: "Compare symbol" });
        await expect.poll(() => d.getByRole("option").elements().length).toBe(3);
        // the main symbol can't be compared with itself
        expect((d.getByRole("option", { name: /AAA/ }).element() as HTMLButtonElement).disabled).toBe(true);
        await d.getByRole("option", { name: /BBB/ }).click();
        expect(w.state().compare).toEqual(["BBB"]);
        expect(w.state().scaleMode).toBe("percent");
        await until(() =>
            w
                .engine()
                .legendItems("price", w.engine().data.length - 1)
                .some((i) => i.name === "BBB"),
        );
        expect(w.engine().getScale("price").mode).toBe("percent");
        await until(() => legendRow(w.host, "BBB"), "compare legend row");
        expect(button("Percentage scale").element().getAttribute("aria-pressed")).toBe("true");

        // a second one, then remove both (legend ×, object tree ×)
        await clickButton("Compare symbol");
        await expect.poll(() => d.getByRole("option").elements().length).toBe(3);
        expect((d.getByRole("option", { name: /BBB/ }).element() as HTMLButtonElement).disabled).toBe(true);
        await d.getByRole("option", { name: /CCC/ }).click();
        expect(w.state().compare).toEqual(["BBB", "CCC"]);
        await until(() => legendRow(w.host, "CCC"), "second compare row");

        await legendAction(w.host, "BBB", "Hide");
        const hidden = () =>
            w
                .engine()
                .legendItems("price", w.engine().data.length - 1)
                .find((i) => i.name === "BBB")?.hidden;
        expect(hidden()).toBe(true);
        await legendAction(w.host, "BBB", "Show");
        expect(hidden()).toBeFalsy();
        await legendAction(w.host, "BBB", "Remove");
        expect(w.state().compare).toEqual(["CCC"]);
        await clickButton("Object tree");
        await page.getByRole("tree").getByRole("button", { name: "Remove CCC" }).click({ force: true });
        expect(w.state().compare).toBeUndefined();
        await until(() => !legendRow(w.host, "CCC"), "compare row removed");
        expect(
            w
                .engine()
                .legendItems("price", w.engine().data.length - 1)
                .map((i) => i.name),
        ).toEqual(["AAA", "Volume"]);
        w.unmount();
    });
});

describe("Layouts (real UI)", () => {
    it("renders every layout, syncs the crosshair, switches the active cell and sets per-cell symbols", async () => {
        const w = await mountWidget({ datafeed: memoryFeed(), defaultSymbol: "AAA", defaultIndicators: ["rsi"] });
        const layouts: [string, number][] = [
            ["2 charts, side by side", 2],
            ["2 charts, stacked", 2],
            ["3 charts", 3],
            ["4 charts", 4],
            ["1 chart", 1],
        ];
        for (const [label, count] of layouts) {
            await clickButton("Layout");
            await page.getByRole("menuitemradio", { name: label }).click();
            await frames(3);
            expect(page.getByRole("menu").query()).toBeNull();
            const cells = w.host.querySelectorAll(".rc-w-cell");
            expect(cells.length, label).toBe(count);
            for (let c = 0; c < count; c++) {
                await until(
                    () =>
                        cells[c].querySelectorAll("canvas").length === 2 && (cells[c] as HTMLElement).offsetWidth > 100,
                    `${label} cell ${c}`,
                );
            }
        }

        await clickButton("Layout");
        await page.getByRole("menuitemradio", { name: "4 charts" }).click();
        await until(() => w.host.querySelectorAll(".rc-w-cell").length === 4);
        await until(() => w.host.querySelectorAll(".rc-w-cell")[3].querySelector(".rc-legend-item"), "cell 4 legend");
        expect(w.state().layout).toBe("4");
        const cells = () => [...w.host.querySelectorAll<HTMLElement>(".rc-w-cell")];
        expect(cells()[0].hasAttribute("data-active")).toBe(true);

        // crosshair sync: hovering chart 1 shows the crosshair on chart 3
        const c0 = chartCanvas(w.host, 0);
        await userEvent.hover(c0, { position: { x: 200, y: 100 } });
        await frames(3);
        expect(w.engine().crosshair).not.toBeNull();
        const time = w.engine().times[w.engine().crosshair!.index];

        // activate chart 3 (pointer down) and change its symbol
        await userEvent.click(chartCanvas(w.host, 2), { position: { x: 100, y: 80 } });
        await frames();
        expect(cells()[2].hasAttribute("data-active")).toBe(true);
        expect(cells()[0].hasAttribute("data-active")).toBe(false);
        await userEvent.hover(c0, { position: { x: 200, y: 100 } });
        await frames(3);
        const synced = w.engine().crosshair; // engine of the active chart (3)
        expect(synced?.synced).toBe(true);
        expect(w.engine().times[synced!.index]).toBe(time);

        await clickButton(/^Symbol search \(AAA\)/);
        await expect.poll(() => page.getByRole("option").elements().length).toBe(3);
        await page.getByRole("option", { name: /CCC/ }).click();
        expect(w.state().symbol).toBe("AAA");
        expect(w.state().cells).toEqual(["AAA", "CCC"]);
        await until(() => legendRow(w.host, "CCC", 2), "chart 3 shows CCC");
        await expect.element(button(/^Symbol search \(CCC\)/)).toBeVisible();
        expect(w.ref.current!.engine).toBe(w.engine());
        // indicators apply to every chart
        expect(w.engine().paneIds).toEqual(["price", "pane-rsi-1"]);

        // back to one chart: the first chart is active again
        await clickButton("Layout");
        await page.getByRole("menuitemradio", { name: "1 chart" }).click();
        await frames(3);
        expect(cells()).toHaveLength(1);
        await expect.element(button(/^Symbol search \(AAA\)/)).toBeVisible();
        expect(w.ref.current!.engine?.data.length).toBeGreaterThan(0);
        w.unmount();
    });
});
