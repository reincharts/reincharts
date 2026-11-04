import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import { page, userEvent } from "vitest/browser";
import { TradingChart, type TradingChartState } from "../src";
import "../src/styles.css";

const data = generateBars(300, { seed: 5 });
const frames = (n = 3) =>
    new Promise<void>((resolve) => {
        const step = (left: number) => (left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
        step(n);
    });

describe("TradingChart indicator removal (real UI)", () => {
    it("removes indicators from the dialog, the legend, the object tree and the context menu", async () => {
        let state: TradingChartState | undefined;
        const { host, unmount } = await mountChart(
            <TradingChart data={data} theme="light" onStateChange={(s) => (state = s)} />,
            { width: 1200, height: 700 },
        );
        await frames(4);
        const count = () => state?.indicators.length ?? 0;
        const openIndicators = async () => {
            await page.getByRole("button", { name: "Indicators", exact: true }).first().click();
            await frames();
        };
        const add = async (name: string) => {
            await page
                .getByRole("button", { name: new RegExp(`^${name}`) })
                .first()
                .click();
            await frames();
        };
        const closeDialog = async () => {
            await userEvent.keyboard("{Escape}");
            await frames();
        };

        // 1. the dialog lists what is on the chart, with a remove button per instance
        await openIndicators();
        await add("Moving Average Exponential");
        await add("Moving Average Exponential");
        await add("Relative Strength Index");
        expect(count()).toBe(3);
        const onChart = page.getByRole("group", { name: "On chart" });
        await expect.element(onChart).toBeVisible();
        await onChart.getByRole("button", { name: /^Remove RSI/ }).click();
        await frames();
        expect(count()).toBe(2);
        expect(state!.indicators.every((i) => i.definitionId === "ema")).toBe(true);
        // Escape still closes the dialog after the focused row was removed
        await closeDialog();
        expect(host.querySelector(".rc-w-backdrop")).toBeNull();

        // 2. legend: hover an indicator row, click its × (TradingView's main way)
        // (legend values follow the pointer, so skip Playwright's "element is stable" wait)
        const legendRow = [...host.querySelectorAll<HTMLElement>(".rc-legend-item")].find((r) =>
            r.textContent?.startsWith("EMA"),
        )!;
        await userEvent.hover(legendRow, { force: true });
        await frames();
        const legendRemove = legendRow.querySelector<HTMLElement>('[aria-label="Remove"]');
        expect(legendRemove, "legend shows a remove button on hover").toBeTruthy();
        await userEvent.click(legendRemove!, { force: true });
        await frames();
        expect(count()).toBe(1);

        // 3. object tree: remove button on the indicator row
        await page.getByRole("button", { name: "Object tree" }).first().click();
        await frames();
        const tree = host.querySelector(".rc-w-tree") as HTMLElement;
        const emaRow = [...tree.querySelectorAll(".rc-w-tree-row")].find((r) => r.textContent?.startsWith("EMA"))!;
        await userEvent.hover(emaRow as HTMLElement, { force: true });
        await page
            .elementLocator(emaRow as HTMLElement)
            .getByRole("button", { name: /^Remove EMA/ })
            .click({ force: true });
        await frames();
        expect(count()).toBe(0);

        // 4. context menu: "Remove all indicators"
        await openIndicators();
        await add("Moving Average Exponential");
        await add("Bollinger Bands");
        await closeDialog();
        expect(count()).toBe(2);
        const canvas = host.querySelectorAll(".rc-chart canvas")[1] as HTMLCanvasElement;
        await userEvent.click(canvas, { button: "right", position: { x: 400, y: 200 } });
        await frames();
        await page.getByRole("menuitem", { name: "Remove all indicators" }).click();
        await frames();
        expect(count()).toBe(0);
        unmount();
    });
});
