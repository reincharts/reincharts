import { builtinTools } from "@reincharts/interactive";
import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import { TradingChart, type TradingChartState } from "../src";
import "../src/styles.css";

const data = generateBars(300, { seed: 11 });
const frames = (n = 2) =>
    new Promise<void>((resolve) => {
        const step = (left: number) => (left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
        step(n);
    });

const pointer = (el: Element, type: string, x: number, y: number) =>
    el.dispatchEvent(
        new PointerEvent(type, {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            button: 0,
            pointerType: "mouse",
        }),
    );

/** Element under the center of a rect is inside `el` (i.e. it is visible, not clipped or covered). */
const visibleOnScreen = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(20, r.height / 2));
    return (
        r.width > 0 &&
        r.height > 0 &&
        r.right <= window.innerWidth &&
        r.bottom <= window.innerHeight &&
        !!hit &&
        el.contains(hit)
    );
};

describe("TradingChart drawing toolbar (real UI)", () => {
    it("opens every flyout visibly and creates every built-in tool from the toolbar", async () => {
        let state: TradingChartState | undefined;
        const { host, unmount } = await mountChart(
            <TradingChart data={data} theme="light" onStateChange={(s) => (state = s)} />,
            { width: 1200, height: 700 },
        );
        await frames(4);
        const toolbar = host.querySelector(".rc-dt") as HTMLElement;
        expect(toolbar).toBeTruthy();
        const arrows = () => [...toolbar.querySelectorAll<HTMLButtonElement>(".rc-dt-arrow")];
        expect(arrows().length).toBeGreaterThanOrEqual(6); // cursor, 5 tool groups, magnet

        // every flyout opens on screen
        const labelsByArrow: string[][] = [];
        for (let i = 0; i < arrows().length; i++) {
            arrows()[i].click();
            await frames();
            const flyout = toolbar.querySelector(".rc-dt-flyout") as HTMLElement;
            expect(flyout, `flyout ${arrows()[i].getAttribute("aria-label")}`).toBeTruthy();
            expect(visibleOnScreen(flyout), `flyout ${i} visible`).toBe(true);
            labelsByArrow.push([...flyout.querySelectorAll(".rc-dt-menuitem")].map((b) => b.textContent?.trim() ?? ""));
            arrows()[i].click(); // close
            await frames();
        }

        // pick every tool through its flyout and draw it on the chart
        const canvas = host.querySelectorAll(".rc-chart canvas")[1] as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const at = (fx: number, fy: number): [number, number] => [
            rect.left + rect.width * fx,
            rect.top + rect.height * fy,
        ];
        for (const tool of builtinTools) {
            // index 0 is the cursor menu (its "Arrow" is a cursor mode, not the arrow drawing tool)
            const arrowIndex = labelsByArrow.findIndex(
                (labels, i) => i > 0 && labels.some((l) => l.startsWith(tool.label)),
            );
            expect(arrowIndex, `${tool.type} is in a flyout`).toBeGreaterThanOrEqual(0);
            arrows()[arrowIndex].click();
            await frames();
            const item = [...toolbar.querySelectorAll<HTMLButtonElement>(".rc-dt-flyout .rc-dt-menuitem")].find((b) =>
                b.textContent?.trim().startsWith(tool.label),
            )!;
            item.click();
            await frames();
            const pts = [at(0.3, 0.3), at(0.5, 0.45), at(0.6, 0.25)];
            if (tool.freehand) {
                pointer(canvas, "pointerdown", ...pts[0]);
                for (let k = 1; k <= 10; k++) {
                    pointer(canvas, "pointermove", ...at(0.3 + k * 0.02, 0.3 + (k % 2) * 0.03));
                }
                pointer(canvas, "pointerup", ...at(0.5, 0.3));
            } else {
                const n = tool.points === "multi" ? 3 : tool.points;
                for (let k = 0; k < n; k++) {
                    pointer(canvas, "pointermove", ...pts[k]);
                    pointer(canvas, "pointerdown", ...pts[k]);
                    pointer(canvas, "pointerup", ...pts[k]);
                    await frames(1);
                }
                if (tool.points === "multi") {
                    canvas
                        .closest(".rc-chart")!
                        .dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
                }
            }
            await frames();
            // leave inline text editors / selection
            if (document.activeElement instanceof HTMLTextAreaElement) {
                document.activeElement.blur();
            }
            canvas
                .closest(".rc-chart")!
                .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
            await frames();
        }
        await frames(4);
        const created = new Set((state?.drawings as { type: string }[] | undefined)?.map((d) => d.type));
        const missing = builtinTools.map((t) => t.type).filter((t) => !created.has(t));
        expect(missing).toEqual([]);
        unmount();
    });
});
