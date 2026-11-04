import { createDrawingController, defineTool, icons, renderOrder, type Drawing } from "../src";

const line = (id: string, price = 100): Drawing => ({
    id,
    type: "trendLine",
    pane: "main",
    points: [
        { time: 0, price },
        { time: 10, price: price + 10 },
    ],
    style: {},
});

describe("createDrawingController", () => {
    it("adds drawings with tool defaults, selects them and fires create", () => {
        const onCreate = vi.fn();
        const onChange = vi.fn();
        const c = createDrawingController({ onCreate, onChange, defaultStyle: { color: "#ff0000" } });
        const d = c.add({ type: "trendLine", points: [{ time: 1, price: 2 }] });
        expect(d.id).toBeTruthy();
        expect(d.pane).toBe("main");
        expect(d.style).toEqual({ width: 2, extend: "none", color: "#ff0000" });
        expect(c.drawings).toEqual([d]);
        expect(c.selectedIds).toEqual([d.id]);
        expect(onCreate).toHaveBeenCalledWith(d);
        expect(onChange).toHaveBeenCalledWith([d]);
        expect(c.canUndo).toBe(true);
    });

    it("updates one or many drawings and merges style", () => {
        const onUpdate = vi.fn();
        const c = createDrawingController({ defaultDrawings: [line("a"), line("b")], onUpdate });
        c.update("a", { style: { color: "red" } });
        expect(c.drawings[0].style).toEqual({ color: "red" });
        c.update(["a", "b"], (d) => ({ points: d.points.map((p) => ({ ...p, price: p.price + 1 })) }));
        expect(c.drawings.map((d) => d.points[0].price)).toEqual([101, 101]);
        expect(onUpdate).toHaveBeenCalledTimes(3);
        expect(c.update("missing", { locked: true })).toBeUndefined();
    });

    it("undoes and redoes", () => {
        const c = createDrawingController();
        expect(c.canUndo).toBe(false);
        c.add({ type: "trendLine", points: [] });
        c.add({ type: "rectangle", points: [] });
        expect(c.drawings).toHaveLength(2);
        c.undo();
        expect(c.drawings).toHaveLength(1);
        expect(c.canRedo).toBe(true);
        c.undo();
        expect(c.drawings).toHaveLength(0);
        expect(c.canUndo).toBe(false);
        c.redo();
        c.redo();
        expect(c.drawings.map((d) => d.type)).toEqual(["trendLine", "rectangle"]);
        c.undo();
        c.add({ type: "ellipse", points: [] });
        expect(c.canRedo).toBe(false);
    });

    it("records a single undo step for silent drag updates", () => {
        const c = createDrawingController({ defaultDrawings: [line("a")] });
        c.checkpoint();
        for (let i = 0; i < 5; i++) {
            c.update("a", { points: [{ time: i, price: i }] }, { history: false, silent: true });
        }
        c.undo();
        expect(c.drawings[0]).toEqual(line("a"));
        c.undo();
        expect(c.drawings[0]).toEqual(line("a"));
    });

    it("removes drawings and cleans the selection", () => {
        const onRemove = vi.fn();
        const c = createDrawingController({ defaultDrawings: [line("a"), line("b"), line("c")], onRemove });
        c.select(["a", "b"]);
        c.removeSelected();
        expect(c.drawings.map((d) => d.id)).toEqual(["c"]);
        expect(c.selectedIds).toEqual([]);
        expect(onRemove).toHaveBeenCalledTimes(2);
        c.removeAll();
        expect(c.drawings).toEqual([]);
        c.remove("nope");
        expect(onRemove).toHaveBeenCalledTimes(3);
    });

    it("selects with additive toggling and fires onSelect", () => {
        const onSelect = vi.fn();
        const c = createDrawingController({ defaultDrawings: [line("a"), line("b")], onSelect });
        c.select("a");
        c.select("b", true);
        expect(c.selectedIds).toEqual(["a", "b"]);
        c.select("a", true);
        expect(c.selectedIds).toEqual(["b"]);
        expect(c.selected.map((d) => d.id)).toEqual(["b"]);
        c.select("b");
        expect(onSelect).toHaveBeenCalledTimes(3);
        c.clearSelection();
        expect(c.selectedIds).toEqual([]);
        c.select("missing");
        expect(c.selectedIds).toEqual([]);
    });

    it("copies, pastes and duplicates with new ids", () => {
        const c = createDrawingController({ defaultDrawings: [line("a"), { ...line("b"), locked: true }] });
        c.select(["a", "b"]);
        expect(c.copy()).toHaveLength(2);
        const pasted = c.paste();
        expect(pasted).toHaveLength(2);
        expect(pasted.every((d) => d.id !== "a" && d.id !== "b" && !d.locked)).toBe(true);
        expect(c.selectedIds).toEqual(pasted.map((d) => d.id));
        const dup = c.duplicate("a");
        expect(dup[0].points).toEqual(line("a").points);
        expect(c.drawings).toHaveLength(5);
    });

    it("toggles lock all / hide all and per drawing lock", () => {
        const c = createDrawingController({ defaultDrawings: [line("a")] });
        c.select("a");
        c.lockAll();
        expect(c.getState().locked).toBe(true);
        c.lockAll(false);
        expect(c.getState().locked).toBe(false);
        c.hideAll();
        expect(c.getState().hidden).toBe(true);
        expect(c.selectedIds).toEqual([]);
        c.update("a", { locked: true, hidden: true });
        expect(c.drawings[0]).toMatchObject({ locked: true, hidden: true });
    });

    it("orders drawings with bringToFront / sendToBack", () => {
        const c = createDrawingController({ defaultDrawings: [line("a"), line("b"), line("c")] });
        c.bringToFront("a");
        expect(renderOrder(c.drawings).map((d) => d.id)).toEqual(["b", "c", "a"]);
        c.sendToBack("c");
        expect(renderOrder(c.drawings).map((d) => d.id)).toEqual(["c", "b", "a"]);
    });

    it("round-trips through JSON", () => {
        const a = createDrawingController({
            defaultDrawings: [line("a"), { ...line("b"), style: { color: "#123456" }, z: 3 }],
        });
        const json = JSON.stringify(a);
        const b = createDrawingController();
        b.load(json);
        expect(b.toJSON()).toEqual(a.toJSON());
        b.load([line("x")]);
        expect(b.drawings.map((d) => d.id)).toEqual(["x"]);
        b.undo();
        expect(b.drawings).toHaveLength(2);
        b.load({ version: 1, drawings: [] });
        expect(b.drawings).toEqual([]);
    });

    it("supports controlled mode", () => {
        let external: readonly Drawing[] = [line("a")];
        const onChange = vi.fn((next: readonly Drawing[]) => {
            external = next;
        });
        const c = createDrawingController({ drawings: external, onChange });
        c.add({ type: "rectangle", points: [] });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(external).toHaveLength(2);
        // the parent decides: it passes a different array
        const replaced = [line("z")];
        c.setOptions({ drawings: replaced, onChange });
        expect(c.drawings).toBe(replaced);
        // same props again do not reset optimistic changes
        c.update("z", { locked: true });
        c.setOptions({ drawings: replaced, onChange });
        expect(c.drawings[0].locked).toBe(true);
    });

    it("manages tool, magnet, cursor, keep drawing and edit state", () => {
        const onTool = vi.fn();
        const c = createDrawingController();
        c.on("tool", onTool);
        c.setTool("fibRetracement");
        expect(c.activeTool).toBe("fibRetracement");
        c.setTool("unknown");
        expect(c.activeTool).toBe("fibRetracement");
        c.setCursor("eraser");
        expect(c.activeTool).toBeNull();
        expect(c.cursor).toBe("eraser");
        expect(onTool).toHaveBeenCalledTimes(2);
        c.setMagnet("strong");
        c.setKeepDrawing(true);
        expect(c.magnet).toBe("strong");
        expect(c.keepDrawing).toBe(true);
        c.edit("x");
        expect(c.getState().editingId).toBe("x");
    });

    it("registers custom tools", () => {
        const custom = defineTool({
            type: "dot",
            label: "Dot",
            group: "custom",
            icon: icons.trendLine,
            points: 1,
            defaults: { width: 5 },
            draw: () => {},
            hitTest: () => false,
        });
        const c = createDrawingController({ tools: [custom] });
        expect(c.getTool("dot")).toBe(custom);
        expect(c.tools.at(-1)).toBe(custom);
        expect(c.add({ type: "dot", points: [] }).style.width).toBe(5);
        expect(createDrawingController({ tools: [custom], builtinTools: false }).tools).toEqual([custom]);
    });

    it("fires cross alerts for horizontal and trend lines", () => {
        const onCross = vi.fn();
        const c = createDrawingController({
            onCross,
            defaultDrawings: [
                { id: "h", type: "horizontalLine", pane: "main", points: [{ time: 0, price: 100 }], style: {} },
                line("t", 90),
                {
                    id: "hidden",
                    type: "horizontalLine",
                    pane: "main",
                    points: [{ time: 0, price: 100 }],
                    style: {},
                    hidden: true,
                },
                { id: "r", type: "rectangle", pane: "main", points: [], style: {} },
            ],
        });
        const logicalOf = (t: number) => t;
        const bar = { close: 101 };
        // trend line at x=5 is 95
        const events = c.checkCrosses(94, 101, 5, logicalOf, bar);
        expect(events.map((e) => [e.drawing.id, e.direction])).toEqual([
            ["h", "up"],
            ["t", "up"],
        ]);
        expect(onCross).toHaveBeenCalledWith(expect.objectContaining({ id: "h" }), "up", bar);
        expect(c.checkCrosses(101, 99, 5, logicalOf, bar).map((e) => e.direction)).toEqual(["down"]);
        // beyond the (non extended) trend line end: no value
        expect(c.checkCrosses(90, 120, 20, logicalOf, bar).map((e) => e.drawing.id)).toEqual(["h"]);
        c.update("t", { style: { extend: "right" } });
        expect(c.checkCrosses(90, 120, 20, logicalOf, bar).map((e) => e.drawing.id)).toEqual(["h", "t"]);
    });

    it("unsubscribes listeners", () => {
        const c = createDrawingController();
        const fn = vi.fn();
        const off = c.on("change", fn);
        const unsub = c.subscribe(fn);
        c.add({ type: "ray", points: [] });
        off();
        unsub();
        c.add({ type: "ray", points: [] });
        expect(fn).toHaveBeenCalledTimes(3);
    });
});
