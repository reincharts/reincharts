import { generateBars } from "@reincharts/testing";
import { ChartEngine } from "../src";

const make = (options = {}, data: any[] = generateBars(500)) => {
    const engine = new ChartEngine<any>();
    engine.setOptions({ timeZone: "UTC", ...options });
    engine.registerPane("main");
    engine.setData(data);
    engine.setSize(800, 400, 1);
    engine.render();
    return engine;
};

describe("ChartEngine viewport", () => {
    it("shows the latest bars with right offset for time data", () => {
        const e = make();
        expect(e.xType).toBe("time");
        expect(e.barSpacing).toBeCloseTo(8);
        expect(e.to).toBeCloseTo(499 + 0.5 + 3);
        const { start, end } = e.range;
        expect(end).toBe(499);
        expect(start).toBeGreaterThan(390);
    });

    it("treats a numeric `time` field as time data", () => {
        const e = make({}, [{ time: Date.UTC(2024, 0, 1) }, { time: Date.UTC(2024, 0, 2) }]);
        expect(e.xType).toBe("time");
        expect(make({}, [{ x: 1 }, { x: 2 }]).xType).toBe("number");
    });

    it("fits non-time data and detects categories", () => {
        const e = make({}, [
            { x: "a", y: 1 },
            { x: "b", y: 2 },
            { x: "c", y: 3 },
        ]);
        expect(e.xType).toBe("category");
        expect(e.from).toBe(-0.5);
        expect(e.to).toBe(2.5);
        expect(e.xTicks().map((t) => t.label)).toEqual(["a", "b", "c"]);
    });

    it("zooms around an anchor and respects bar spacing limits", () => {
        const e = make();
        const anchor = e.logicalOfX(400);
        e.zoomAt(0.5, 400);
        expect(e.logicalOfX(400)).toBeCloseTo(anchor);
        expect(e.barSpacing).toBeCloseTo(16);
        for (let i = 0; i < 50; i++) {
            e.zoomAt(0.5, 400);
        }
        expect(e.barSpacing).toBeLessThanOrEqual(60.01);
    });

    it("pans and keeps some bars visible", () => {
        const e = make();
        e.panBy(-100000);
        expect(e.from).toBeLessThanOrEqual(499);
        e.panBy(100000);
        expect(e.to).toBeGreaterThanOrEqual(0);
    });

    it("clamps to the data", () => {
        const e = make({ clamp: "left" });
        e.panBy(100000);
        expect(e.from).toBeCloseTo(-0.5);
    });

    it("follows realtime appends and keeps the view on prepends", () => {
        const all = generateBars(600);
        const e = make({}, all.slice(100, 500));
        const to = e.to;
        e.setData(all.slice(100, 501));
        expect(e.to).toBeCloseTo(to + 1);
        const from = e.from;
        e.setData(all.slice(0, 501));
        expect(e.from).toBeCloseTo(from + 100);
        expect(e.timeOfLogical(Math.round(e.to - 3.5))).toBe(all[500].date.getTime());
    });

    it("keeps the visible range when hidden (0 width) and shown again", () => {
        const e = make();
        const { from, to } = e;
        e.setSize(0, 0, 1);
        e.setSize(800, 400, 1);
        e.render();
        expect(e.from).toBeCloseTo(from);
        expect(e.to).toBeCloseTo(to);
    });

    it("resets when resetKey changes", () => {
        const e = make({ resetKey: "A" });
        e.panBy(300);
        e.setOptions({ timeZone: "UTC", resetKey: "B" });
        e.render();
        expect(e.to).toBeCloseTo(502.5);
    });

    it("fires reach callbacks once per crossing", () => {
        const onReachStart = vi.fn();
        const e = make({ onReachStart });
        e.panBy(10000);
        e.settle();
        e.settle();
        expect(onReachStart).toHaveBeenCalledTimes(1);
    });

    it("converts between time and logical positions, extrapolating", () => {
        const data = generateBars(10);
        const e = make({}, data);
        const t = data[4].date.getTime();
        expect(e.logicalOfTime(t)).toBe(4);
        expect(e.timeOfLogical(4)).toBe(t);
        expect(e.logicalOfTime(data[9].date.getTime() + 2 * 86_400_000)).toBeCloseTo(11);
        expect(e.timeOfLogical(-1)).toBe(data[0].date.getTime() - 86_400_000);
    });

    it("supports linear x with unsorted data and renderable x extents", () => {
        const data = [{ x: 5 }, { x: 1 }, { x: 3 }];
        const e = make({ xMode: "linear" }, data);
        expect(e.sorted).toBe(false);
        expect(e.range).toMatchObject({ start: 0, end: 2 });
        expect(e.from).toBeLessThan(1);
        expect(e.to).toBeGreaterThan(5);
        e.addRenderable({ pane: "main", layer: "scene", zIndex: 0, draw() {}, xExtent: () => [0, 100] });
        e.render();
        expect(e.to).toBeGreaterThan(100);
    });
});

describe("ChartEngine panes and scales", () => {
    it("auto-sized price axes grow when labels need room but don't shrink until the view resets", () => {
        const scene = document.createElement("canvas");
        const e = new ChartEngine<any>();
        e.attach(scene, document.createElement("canvas"));
        e.setOptions({ timeZone: "UTC" });
        e.registerPane("main", { scales: { right: { domain: [0, 10] } } });
        e.registerAxis({ kind: "price", paneId: "main", side: "right" });
        e.setData(generateBars(100));
        e.setSize(800, 400, 1);
        // measure 8px per character: make the labels long, then short again
        const ctx = scene.getContext("2d")!;
        ctx.measureText = (text: string) => ({ width: text.length * 8 }) as TextMetrics;
        e.render();
        const narrow = e.layout.axisRight;
        e.registerPane("main", { scales: { right: { domain: [0, 10_000_000], precision: 4 } } });
        e.render();
        const wide = e.layout.axisRight;
        expect(wide).toBeGreaterThan(narrow);
        e.registerPane("main", { scales: { right: { domain: [0, 10] } } });
        e.render();
        expect(e.layout.axisRight).toBe(wide); // shorter labels: the plot keeps its width
        e.resetView();
        e.render();
        expect(e.layout.axisRight).toBe(narrow); // a reset starts over
    });

    it("lays out panes by size and fixed height", () => {
        const e = make();
        e.registerPane("main", { size: 3 });
        e.registerPane("rsi", { size: 1 });
        e.registerPane("vol", { height: 50 });
        e.registerAxis({ kind: "time" });
        e.render();
        const [main, rsi, vol] = e.layout.panes;
        expect(vol.height).toBe(50);
        expect(main.height + rsi.height + vol.height).toBe(400 - 28);
        expect(main.height / rsi.height).toBeCloseTo(3, 0);
        expect(e.layout.timeAxis).toEqual({ top: 372, height: 28 });
    });

    it("keeps pane weights on resize so new panes get their usual share", () => {
        const e = make();
        e.registerPane("main", { size: 3 });
        e.registerPane("b");
        e.render();
        e.resizePane("b", -20);
        expect(e.paneWeight("main") + e.paneWeight("b")).toBeCloseTo(4);
        e.registerPane("c");
        e.render();
        const [, , c] = e.layout.panes;
        expect(c.height).toBeCloseTo(400 / 5, -1);
        e.resetPaneSizes();
        e.registerPane("main", { size: 2 });
        e.render();
        expect(e.paneWeight("main")).toBe(2);
    });

    it("resizes, collapses and maximizes panes", () => {
        const e = make();
        e.registerPane("b");
        e.render();
        const before = e.layout.panes[1].height;
        e.resizePane("b", -50);
        e.render();
        expect(e.layout.panes[1].height).toBeCloseTo(before + 50, 0);
        e.toggleMaximizePane("b");
        e.render();
        expect(e.layout.panes[0].height).toBe(0);
        e.toggleMaximizePane("b");
        e.toggleCollapsePane("b");
        e.render();
        expect(e.layout.panes[1].height).toBe(24);
    });

    it("autoscales from visible renderable extents in each mode", () => {
        const e = make();
        e.registerPane("main", { scales: { right: { margins: { top: 0, bottom: 0 } } } });
        e.addRenderable({
            pane: "main",
            layer: "scene",
            zIndex: 0,
            draw() {},
            extent: () => [10, 20],
            baseValue: () => 10,
        });
        e.render();
        const s = e.getScale("main");
        expect([s.min, s.max]).toEqual([10, 20]);
        e.registerPane("main", { scales: { right: { mode: "percent", margins: { top: 0, bottom: 0 } } } });
        e.render();
        expect([s.min, s.max]).toEqual([0, 100]);
    });

    it("uses fixed domains, extents functions and calculators", () => {
        const e = make();
        e.registerPane("main", {
            scales: {
                right: { domain: [0, 1] },
                a: { extents: (d) => [d.low, d.high], margins: { top: 0, bottom: 0 } },
                b: { extentsCalculator: () => [5, 6], margins: { top: 0, bottom: 0 } },
            },
        });
        e.render();
        expect([e.getScale("main").min, e.getScale("main").max]).toEqual([0, 1]);
        const { start, end } = e.range;
        const lows = e.data.slice(start, end + 1).map((d: any) => d.low);
        expect(e.getScale("main", "a").min).toBeCloseTo(Math.min(...lows));
        expect(e.getScale("main", "b").max).toBe(6);
    });

    it("draws renderables per layer with pane translation and z-order", () => {
        const e = new ChartEngine();
        const scene = document.createElement("canvas");
        const top = document.createElement("canvas");
        e.attach(scene, top);
        e.setOptions({});
        e.registerPane("p");
        e.setData(generateBars(50));
        e.setSize(400, 200, 2);
        const order: string[] = [];
        e.addRenderable({ pane: "p", layer: "scene", zIndex: 2, draw: () => order.push("b") });
        e.addRenderable({ pane: "p", layer: "scene", zIndex: 1, draw: (_, s) => order.push(`a:${s.end}`) });
        e.addRenderable({ pane: null, layer: "top", zIndex: 0, draw: () => order.push("top") });
        e.render();
        expect(order).toEqual(["a:49", "b", "top"]);
    });

    it("collects legends and snap values", () => {
        const e = make();
        e.addRenderable({
            pane: "main",
            layer: "scene",
            zIndex: 0,
            draw() {},
            snapValues: () => [10, 20],
            legend: (i) => ({ id: "1", name: "S", values: [{ value: String(i) }] }),
        });
        e.registerPane("main", { scales: { right: { domain: [0, 100] } } });
        e.render();
        expect(e.legendItems("main", 3)[0].values[0].value).toBe("3");
        expect(e.snap("main", 0, e.getScale("main").toY(18))).toBe(20);
    });

    it("publishes state snapshots", () => {
        const e = make();
        const listener = vi.fn();
        e.subscribe(listener);
        const s1 = e.getState();
        e.setCrosshair({ x: 1, y: 2, paneId: "main", index: 3, logical: 3 });
        e.render();
        expect(listener).toHaveBeenCalled();
        expect(e.getState()).not.toBe(s1);
        expect(e.getState().crosshair?.index).toBe(3);
    });

    it("syncs crosshair between charts", () => {
        const data = generateBars(100);
        const a = make({ syncId: "g" }, data);
        const b = make({ syncId: "g" }, data);
        a.setCrosshair({ x: 10, y: 10, paneId: "main", index: 50, logical: 50 });
        expect(b.crosshair).toMatchObject({ index: 50, synced: true });
        a.setCrosshair(null);
        expect(b.crosshair).toBeNull();
        a.destroy();
        b.destroy();
    });
});
