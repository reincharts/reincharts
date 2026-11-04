import { ChartCanvas, type ChartEngine } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { flushFrames, generateBars } from "@reincharts/testing";
import { act, fireEvent, render } from "@testing-library/react";
import * as React from "react";
import {
    Brush,
    Drawings,
    DrawingStyleToolbar,
    DrawingToolbar,
    useDrawings,
    ZoomButtons,
    type DrawingController,
    type UseDrawingsOptions,
} from "../src";

const pointer = (type: string, x: number, y: number, extra: Record<string, unknown> = {}) => {
    const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, button: 0, ...extra });
    Object.assign(e, { pointerId: 1, pointerType: "mouse" });
    return e;
};

const data = generateBars(100);

interface Setup {
    options?: UseDrawingsOptions;
    data?: any[];
    children?: (c: DrawingController) => React.ReactNode;
    outside?: (c: DrawingController) => React.ReactNode;
}

const setup = async ({ options, data: d = data, children, outside }: Setup = {}) => {
    const ref = React.createRef<ChartEngine>();
    let controller!: DrawingController;
    const App = ({ bars }: { bars: any[] }) => {
        controller = useDrawings(options);
        return (
            <>
                {outside?.(controller)}
                <ChartCanvas ref={ref} data={bars} width={800} height={400} ratio={1}>
                    <CandlestickSeries />
                    <Drawings controller={controller} />
                    {children?.(controller)}
                </ChartCanvas>
            </>
        );
    };
    const utils = render(<App bars={d} />);
    await act(flushFrames);
    const top = utils.container.querySelectorAll("canvas")[1];
    const chart = utils.container.querySelector(".rc-chart")!;
    const run = async (...events: Event[]) => {
        await act(async () => {
            for (const e of events) {
                top.dispatchEvent(e);
            }
            await flushFrames();
        });
    };
    const key = async (k: string, extra: KeyboardEventInit = {}) => {
        await act(async () => {
            chart.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...extra }));
            await flushFrames();
        });
    };
    const engine = ref.current!;
    const scale = () => engine.getScale("main");
    /** Expected data point for a canvas pixel (bar snapped). */
    const at = (x: number, y: number) => ({
        time: engine.timeOfLogical(Math.round(engine.logicalOfX(x))),
        price: scale().fromY(y),
    });
    /** Pixel of a data point. */
    const px = (p: { time: number; price: number }) => ({
        x: engine.xOfLogical(engine.logicalOfTime(p.time)),
        y: scale().toY(p.price),
    });
    return {
        ...utils,
        engine,
        get controller() {
            return controller;
        },
        run,
        key,
        at,
        px,
        top,
        rerender: (bars: any[]) => utils.rerender(<App bars={bars} />),
    };
};

describe("<Drawings>", () => {
    it("renders drawings from defaultDrawings with their tool defaults (highlighter width)", async () => {
        const t = (i: number) => (data[i].date as Date).getTime();
        const { container } = await setup({
            options: {
                defaultDrawings: [
                    {
                        id: "h",
                        type: "highlighter",
                        pane: "main",
                        points: [10, 20, 30].map((i) => ({ time: t(i), price: data[i].close })),
                        style: {},
                    },
                ],
            },
        });
        const scene = container.querySelector("canvas")!;
        const widths = (scene.getContext("2d") as any)
            .__getEvents()
            .filter((e: any) => e.type === "lineWidth")
            .map((e: any) => e.props.value);
        expect(widths).toContain(14); // the highlighter's default width, though the stored style is empty
    });

    it("creates a trend line with press-drag-release", async () => {
        const onCreate = vi.fn();
        const s = await setup({ options: { onCreate } });
        act(() => s.controller.setTool("trendLine"));
        expect(s.engine.toolCursor).toBe("crosshair");
        const from = s.engine.from;
        await s.run(pointer("pointerdown", 100, 100), pointer("pointermove", 300, 200), pointer("pointerup", 300, 200));
        expect(s.engine.from).toBe(from); // no pan
        const [d] = s.controller.drawings;
        expect(d.type).toBe("trendLine");
        expect(d.pane).toBe("main");
        expect(d.points[0]).toEqual(s.at(100, 100));
        expect(d.points[1]).toEqual(s.at(300, 200));
        expect(s.controller.activeTool).toBeNull();
        expect(s.controller.selectedIds).toEqual([d.id]);
        expect(onCreate).toHaveBeenCalledWith(d);
        expect(s.engine.toolCursor).toBeNull();
    });

    it("creates with click-click, keeps drawing mode and cancels with Escape", async () => {
        const s = await setup();
        act(() => {
            s.controller.setTool("ray");
            s.controller.setKeepDrawing(true);
        });
        await s.run(pointer("pointerdown", 100, 100), pointer("pointerup", 100, 100), pointer("pointermove", 200, 150));
        expect(s.controller.drawings).toHaveLength(0);
        await s.run(pointer("pointerdown", 200, 150), pointer("pointerup", 200, 150));
        expect(s.controller.drawings).toHaveLength(1);
        expect(s.controller.drawings[0].points[1]).toEqual(s.at(200, 150));
        expect(s.controller.activeTool).toBe("ray");
        await s.run(pointer("pointerdown", 300, 100), pointer("pointerup", 300, 100));
        await s.key("Escape");
        expect(s.controller.drawings).toHaveLength(1);
        expect(s.controller.activeTool).toBe("ray");
        await s.key("Escape");
        expect(s.controller.activeTool).toBeNull();
    });

    it("creates three point tools and one point tools", async () => {
        const s = await setup();
        act(() => s.controller.setTool("parallelChannel"));
        await s.run(pointer("pointerdown", 100, 200), pointer("pointermove", 300, 100), pointer("pointerup", 300, 100));
        expect(s.controller.drawings).toHaveLength(0);
        await s.run(pointer("pointermove", 200, 250), pointer("pointerdown", 200, 250), pointer("pointerup", 200, 250));
        const [d] = s.controller.drawings;
        expect(d.points).toHaveLength(3);
        expect(d.points[2].time).toBe(d.points[0].time);
        act(() => s.controller.setTool("horizontalLine"));
        await s.run(pointer("pointerdown", 400, 120), pointer("pointerup", 400, 120));
        expect(s.controller.drawings[1].type).toBe("horizontalLine");
        expect(s.controller.drawings[1].points[0].price).toBeCloseTo(s.at(400, 120).price);
    });

    it("draws a path until double click and a brush stroke by dragging", async () => {
        const s = await setup();
        act(() => s.controller.setTool("path"));
        for (const [x, y] of [
            [100, 100],
            [200, 150],
            [300, 120],
        ]) {
            await s.run(pointer("pointermove", x, y), pointer("pointerdown", x, y), pointer("pointerup", x, y));
        }
        await s.run(new MouseEvent("dblclick", { clientX: 300, clientY: 120, bubbles: true }));
        expect(s.controller.drawings[0].points).toHaveLength(3);
        act(() => s.controller.setTool("brush"));
        await s.run(
            pointer("pointerdown", 100, 300),
            pointer("pointermove", 120, 310),
            pointer("pointermove", 140, 305),
            pointer("pointerup", 140, 305),
        );
        expect(s.controller.drawings[1].type).toBe("brush");
        expect(s.controller.drawings[1].points.length).toBeGreaterThanOrEqual(3);
    });

    it("snaps to OHLC with the magnet", async () => {
        const s = await setup({ options: { defaultMagnet: "strong" } });
        act(() => s.controller.setTool("horizontalLine"));
        await s.run(pointer("pointerdown", 400, 5), pointer("pointerup", 400, 5));
        const index = Math.round(s.engine.logicalOfX(400));
        const bar = data[index];
        expect([bar.open, bar.high, bar.low, bar.close]).toContain(s.controller.drawings[0].points[0].price);
    });

    it("selects, drags a handle, moves the body, undoes and deletes with the keyboard", async () => {
        const onUpdate = vi.fn();
        const s = await setup({ options: { onUpdate } });
        const created = await act(() =>
            s.controller.add({ type: "trendLine", points: [s.at(200, 100), s.at(400, 200)] }),
        );
        act(() => s.controller.clearSelection());
        await act(flushFrames);
        const a = s.px(created.points[0]);
        // drag handle 0
        await s.run(
            pointer("pointermove", a.x, a.y),
            pointer("pointerdown", a.x, a.y),
            pointer("pointermove", a.x - 50, a.y + 40),
            pointer("pointerup", a.x - 50, a.y + 40),
        );
        let d = s.controller.drawings[0];
        expect(s.controller.selectedIds).toEqual([d.id]);
        expect(d.points[0]).toEqual(s.at(a.x - 50, a.y + 40));
        expect(d.points[1]).toEqual(created.points[1]);
        expect(onUpdate).toHaveBeenCalledTimes(1);
        // drag the body by ~3 bars
        const m = {
            x: (s.px(d.points[0]).x + s.px(d.points[1]).x) / 2,
            y: (s.px(d.points[0]).y + s.px(d.points[1]).y) / 2,
        };
        const before = d;
        const dx = s.engine.barSpacing * 3;
        await s.run(
            pointer("pointerdown", m.x, m.y),
            pointer("pointermove", m.x + dx, m.y + 30),
            pointer("pointerup", m.x + dx, m.y + 30),
        );
        d = s.controller.drawings[0];
        expect(s.engine.logicalOfTime(d.points[1].time) - s.engine.logicalOfTime(before.points[1].time)).toBeCloseTo(3);
        expect(s.px(d.points[1]).y).toBeCloseTo(s.px(before.points[1]).y + 30, 1);
        await s.key("z", { ctrlKey: true });
        expect(s.controller.drawings[0]).toEqual(before);
        await s.key("y", { metaKey: true });
        expect(s.controller.drawings[0]).toEqual(d);
        await s.key("Delete");
        expect(s.controller.drawings).toHaveLength(0);
        await s.key("z", { metaKey: true });
        expect(s.controller.drawings).toHaveLength(1);
    });

    it("does not move locked drawings, clears selection on empty click, shift multi-selects", async () => {
        const s = await setup();
        await act(() => {
            s.controller.add({ type: "horizontalLine", points: [s.at(100, 100)], locked: true });
            s.controller.add({ type: "horizontalLine", points: [s.at(100, 250)] });
        });
        const [l1, l2] = s.controller.drawings;
        await s.run(pointer("pointerdown", 300, 100), pointer("pointermove", 300, 150), pointer("pointerup", 300, 150));
        expect(s.controller.drawings[0]).toEqual(l1);
        expect(s.controller.selectedIds).toEqual([l1.id]);
        await s.run(
            pointer("pointerdown", 300, 250, { shiftKey: true }),
            pointer("pointerup", 300, 250, { shiftKey: true }),
        );
        expect(s.controller.selectedIds).toEqual([l1.id, l2.id]);
        await s.run(pointer("pointerdown", 300, 350), pointer("pointerup", 300, 350));
        expect(s.controller.selectedIds).toEqual([]);
        // copy / paste
        await s.run(pointer("pointerdown", 300, 250), pointer("pointerup", 300, 250));
        await s.key("c", { ctrlKey: true });
        await s.key("v", { ctrlKey: true });
        expect(s.controller.drawings).toHaveLength(3);
    });

    it("erases with the eraser cursor and removes price lines with their close button", async () => {
        const s = await setup();
        await act(() => {
            s.controller.add({ type: "priceLine", points: [s.at(100, 100)], style: { text: "Alert" } });
            s.controller.add({ type: "horizontalLine", points: [s.at(100, 250)] });
        });
        // find the close button by hit testing along the label
        const priceLine = s.controller.getTool("priceLine")!;
        const editor = { x: 20 };
        const g = {
            ...(await import("../src")).createGeometry(s.controller.drawings[0], {
                engine: s.engine,
                scale: s.engine.getScale("main"),
                theme: s.engine.theme,
                width: s.engine.layout.plotWidth,
                height: 400,
            }),
        };
        while (priceLine.hitTest(g, editor.x, g.points[0].y) !== "remove" && editor.x < 300) {
            editor.x++;
        }
        await s.run(
            pointer("pointerdown", editor.x + 2, g.points[0].y),
            pointer("pointerup", editor.x + 2, g.points[0].y),
        );
        expect(s.controller.drawings.map((d) => d.type)).toEqual(["horizontalLine"]);
        act(() => s.controller.setCursor("eraser"));
        await s.run(pointer("pointerdown", 300, 250), pointer("pointerup", 300, 250));
        expect(s.controller.drawings).toHaveLength(0);
    });

    it("edits text inline", async () => {
        const s = await setup();
        act(() => s.controller.setTool("text"));
        await s.run(pointer("pointerdown", 200, 200), pointer("pointerup", 200, 200));
        const textarea = s.container.querySelector("textarea")!;
        expect(textarea).toBeTruthy();
        expect(textarea.style.left).toBe(`${Math.round(s.px(s.controller.drawings[0].points[0]).x)}px`);
        fireEvent.change(textarea, { target: { value: "Breakout" } });
        fireEvent.keyDown(textarea, { key: "Enter" });
        await act(flushFrames);
        expect(s.controller.drawings[0].style.text).toBe("Breakout");
        expect(s.container.querySelector("textarea")).toBeNull();
        // double click reopens, Escape cancels
        const p = s.px(s.controller.drawings[0].points[0]);
        await s.run(new MouseEvent("dblclick", { clientX: p.x + 5, clientY: p.y + 5, bubbles: true }));
        const again = s.container.querySelector("textarea")!;
        fireEvent.change(again, { target: { value: "nope" } });
        fireEvent.keyDown(again, { key: "Escape" });
        await act(flushFrames);
        expect(s.controller.drawings[0].style.text).toBe("Breakout");
    });

    it("renders drawings, handles and axis labels", async () => {
        const s = await setup();
        await act(() => {
            s.controller.add({ type: "fibRetracement", points: [s.at(100, 300), s.at(400, 100)] });
        });
        await act(flushFrames);
        const sceneCtx = s.container.querySelectorAll("canvas")[0].getContext("2d") as any;
        const topCtx = s.top.getContext("2d") as any;
        const sceneTexts = sceneCtx
            .__getEvents()
            .filter((e: any) => e.type === "fillText")
            .map((e: any) => e.props.text);
        expect(sceneTexts.some((t: string) => t.startsWith("0.618"))).toBe(true);
        const arcs = topCtx.__getEvents().filter((e: any) => e.type === "arc");
        expect(arcs.length).toBeGreaterThanOrEqual(2);
        act(() => s.controller.hideAll());
        await act(flushFrames);
        sceneCtx.__clearEvents();
        s.engine.invalidate("scene");
        s.engine.render();
        expect(
            sceneCtx
                .__getEvents()
                .filter((e: any) => e.type === "fillText" && String(e.props.text).startsWith("0.618")),
        ).toHaveLength(0);
    });

    it("fires onCross when new data crosses a line", async () => {
        const onCross = vi.fn();
        const bars = generateBars(50);
        const s = await setup({ options: { onCross }, data: bars });
        const last = bars[49].close;
        await act(() => {
            s.controller.add({ type: "horizontalLine", points: [{ time: bars[0].date.getTime(), price: last + 1 }] });
        });
        const next = {
            ...bars[49],
            date: new Date(bars[49].date.getTime() + 86_400_000),
            open: last,
            high: last + 3,
            low: last,
            close: last + 2,
        };
        await act(async () => {
            s.rerender([...bars, next]);
            await flushFrames();
        });
        expect(onCross).toHaveBeenCalledWith(expect.objectContaining({ type: "horizontalLine" }), "up", next);
    });

    it("supports controlled drawings through useDrawings", async () => {
        const changes: any[] = [];
        const Controlled = () => {
            const [drawings, setDrawings] = React.useState<readonly any[]>([]);
            const c = useDrawings({ drawings, onChange: (next) => (changes.push(next), setDrawings(next)) });
            return (
                <>
                    <span data-testid="count">{drawings.length}</span>
                    <button type="button" onClick={() => c.add({ type: "trendLine", points: [] })}>
                        add
                    </button>
                </>
            );
        };
        const { getByText, getByTestId } = render(<Controlled />);
        fireEvent.click(getByText("add"));
        fireEvent.click(getByText("add"));
        expect(getByTestId("count").textContent).toBe("2");
        expect(changes).toHaveLength(2);
    });
});

describe("toolbars", () => {
    it("DrawingToolbar activates tools, opens flyouts and toggles modes", async () => {
        const onFavoritesChange = vi.fn();
        const s = await setup({
            outside: (c) => (
                <DrawingToolbar
                    controller={c}
                    favorites={["rectangle"]}
                    onFavoritesChange={onFavoritesChange}
                    theme="dark"
                />
            ),
        });
        const toolbar = s.container.querySelector(".rc-dt")!;
        expect(toolbar.getAttribute("data-theme")).toBe("dark");
        fireEvent.click(s.getAllByTitle("Trend Line")[0]);
        expect(s.controller.activeTool).toBe("trendLine");
        fireEvent.click(s.getAllByTitle("Trend Line")[0]);
        expect(s.controller.activeTool).toBeNull();
        fireEvent.click(s.getByLabelText("Fib Retracement options"));
        expect(s.container.querySelector(".rc-dt-flyout")?.textContent).toContain("Gann Fan");
        fireEvent.click(s.getByText("Gann Fan"));
        expect(s.controller.activeTool).toBe("gannFan");
        expect(s.container.querySelector(".rc-dt-flyout")).toBeNull();
        // group button now shows the last used tool
        expect(s.getAllByTitle("Gann Fan")).toHaveLength(1);
        fireEvent.click(s.getByLabelText("Lines options".replace("Lines", "Trend Line")));
        fireEvent.click(s.getByLabelText("Favorite Ray"));
        expect(onFavoritesChange).toHaveBeenCalledWith(["rectangle", "ray"]);
        fireEvent.click(s.getAllByTitle("Rectangle")[0]);
        expect(s.controller.activeTool).toBe("rectangle");
        fireEvent.click(s.getByTitle("Magnet Mode"));
        expect(s.controller.magnet).toBe("weak");
        fireEvent.click(s.getByTitle("Stay in Drawing Mode"));
        expect(s.controller.keepDrawing).toBe(true);
        fireEvent.click(s.getByTitle("Lock All Drawings"));
        expect(s.controller.getState().locked).toBe(true);
        fireEvent.click(s.getByTitle("Hide All Drawings"));
        expect(s.controller.getState().hidden).toBe(true);
        act(() => {
            s.controller.add({ type: "ray", points: [] });
        });
        fireEvent.click(s.getByTitle("Remove All Drawings"));
        expect(s.controller.drawings).toHaveLength(0);
        fireEvent.click(s.getByLabelText("Cross options"));
        fireEvent.click(s.getByText("Eraser"));
        expect(s.controller.cursor).toBe("eraser");
    });

    it("DrawingStyleToolbar edits the selected drawing", async () => {
        const s = await setup({ children: (c) => <DrawingStyleToolbar controller={c} /> });
        expect(s.container.querySelector(".rc-dst")).toBeNull();
        await act(() => {
            s.controller.add({ type: "trendLine", points: [s.at(200, 200), s.at(400, 150)] });
        });
        const bar = s.container.querySelector(".rc-dst") as HTMLElement;
        expect(bar).toBeTruthy();
        expect(parseFloat(bar.style.top)).toBeLessThan(150);
        fireEvent.click(s.getByTitle("Color"));
        fireEvent.click(s.getByLabelText("#f23645"));
        expect(s.controller.drawings[0].style.color).toBe("#f23645");
        fireEvent.click(s.getByTitle("Line width"));
        fireEvent.click(s.getByText("4px"));
        expect(s.controller.drawings[0].style.width).toBe(4);
        fireEvent.click(s.getByTitle("Line style"));
        fireEvent.click(s.getByText("Dotted"));
        expect(s.controller.drawings[0].style.dash).toBe("dotted");
        fireEvent.click(s.getByTitle("Extend"));
        fireEvent.click(s.getByText("Extend right"));
        expect(s.controller.drawings[0].style.extend).toBe("right");
        fireEvent.click(s.getByTitle("Text"));
        const input = s.container.querySelector(".rc-dst-input") as HTMLInputElement;
        fireEvent.keyDown(input, { key: "Enter", currentTarget: { value: "x" } });
        fireEvent.click(s.getByTitle("Lock"));
        expect(s.controller.drawings[0].locked).toBe(true);
        fireEvent.click(s.getByTitle("Clone"));
        expect(s.controller.drawings).toHaveLength(2);
        fireEvent.click(s.getByTitle("Remove"));
        expect(s.controller.drawings).toHaveLength(1);
    });

    it("ZoomButtons zoom, scroll and reset", async () => {
        const onReset = vi.fn();
        const s = await setup({ children: () => <ZoomButtons onReset={onReset} autoHide={false} /> });
        const span = s.engine.to - s.engine.from;
        fireEvent.click(s.getByTitle("Zoom In"));
        expect(s.engine.to - s.engine.from).toBeLessThan(span);
        fireEvent.click(s.getByTitle("Zoom Out"));
        const from = s.engine.from;
        fireEvent.click(s.getByTitle("Scroll Left"));
        expect(s.engine.from).toBeLessThan(from);
        fireEvent.click(s.getByTitle("Scroll Right"));
        fireEvent.click(s.getByTitle("Reset Chart"));
        expect(onReset).toHaveBeenCalled();
    });

    it("Brush selects and zooms to a range", async () => {
        const onSelect = vi.fn();
        const s = await setup({ children: () => <Brush onSelect={onSelect} /> });
        const l0 = s.engine.logicalOfX(200);
        await s.run(pointer("pointerdown", 200, 100), pointer("pointermove", 400, 200), pointer("pointerup", 400, 200));
        expect(onSelect).toHaveBeenCalledTimes(1);
        const range = onSelect.mock.calls[0][0];
        expect(range.endIndex).toBeGreaterThan(range.startIndex);
        expect(range.priceTo).toBeGreaterThan(range.priceFrom);
        expect(s.engine.from).toBeCloseTo(l0, 5);
    });
});
