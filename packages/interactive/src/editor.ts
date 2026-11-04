import {
    clamp,
    contrastText,
    font,
    withAlpha,
    type ChartEngine,
    type ChartPointerEvent,
    type DrawScope,
    type PaneLayout,
} from "@reincharts/core";
import { renderOrder, type DrawingController } from "./controller";
import { handle } from "./draw";
import { constrainAngle, createGeometry, defaultSource, dist, formatTime, HANDLE_RADIUS } from "./geometry";
import type { Drawing, DrawingPoint, Geometry, HitPart, Pt, ToolDefinition } from "./types";

/** Options of the drawing editor (props of `<Drawings>`). */
export interface EditorOptions {
    readonly source?: (d: any, index: number) => number | undefined;
    readonly axisLabels?: boolean;
    readonly onContextMenu?: (drawing: Drawing, e: ChartPointerEvent) => void;
    readonly onDoubleClick?: (drawing: Drawing, e: ChartPointerEvent) => void;
}

interface Hit {
    drawing: Drawing;
    tool: ToolDefinition;
    part: HitPart;
}

interface Creating {
    tool: ToolDefinition;
    base: Drawing;
    pane: string;
    /** Placed points + the point following the pointer. */
    points: DrawingPoint[];
    placed: number;
    /** The creation started with a press: releasing after a drag places the next point. */
    dragPlace: boolean;
}

interface Drag {
    ids: string[];
    handle: number | null;
    hit: Hit;
    snapshot: Map<string, Drawing>;
    started: boolean;
    remove: boolean;
    shift: boolean;
    multi: boolean;
}

const samePt = (a: Pt, b: Pt) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;

/**
 * Framework agnostic editing logic of `<Drawings>`: rendering, hit testing, creation,
 * dragging, keyboard shortcuts and alerts. One instance per chart.
 */
export function createEditor(engine: ChartEngine, controller: DrawingController, getOptions: () => EditorOptions) {
    let hovered: string | null = null;
    let creating: Creating | null = null;
    let drag: Drag | null = null;
    let last: { time: number; value: number } | null = null;

    const paneLayout = (id: string): PaneLayout | undefined => engine.layout.panes.find((p) => p.id === id);
    const st = () => controller.getState();
    const isLocked = (d: Drawing) => !!d.locked || st().locked;

    const geometry = (d: Drawing, pane?: PaneLayout): Geometry | null => {
        const p = pane ?? paneLayout(d.pane);
        if (!p || p.height <= 0) {
            return null;
        }
        // tool defaults fill style keys the drawing doesn't set (drawings from defaultDrawings / load / controlled
        // state look the same as ones created with the toolbar); stored drawings stay untouched
        const defaults = controller.getTool(d.type)?.defaults;
        const effective =
            defaults && Object.keys(defaults).some((k) => (d.style as any)[k] === undefined)
                ? { ...d, style: { ...defaults, ...d.style } }
                : d;
        return createGeometry(effective, {
            engine,
            scale: engine.getScale(d.pane, d.scale ?? "right"),
            theme: engine.theme,
            width: p.width,
            height: p.height,
            source: getOptions().source,
        });
    };

    /** The tool of a drawing and its geometry, or null when either is unavailable or there is nothing to draw. */
    const resolve = (d: Drawing, pane?: PaneLayout) => {
        const tool = controller.getTool(d.type);
        const g = tool && geometry(d, pane);
        return tool && g && g.points.length > 0 ? { tool, g } : null;
    };

    /** Converts pixel points back to data points, keeping untouched points exact. */
    const fromPixels = (g: Geometry, d: Drawing, pts: readonly Pt[]): DrawingPoint[] =>
        pts.map((p, i) =>
            g.points[i] && d.points[i] && samePt(p, g.points[i])
                ? d.points[i]
                : { time: g.time(p.x), price: g.price(p.y) },
        );

    const roundLogical = (tool: ToolDefinition, l: number) =>
        tool.snapX !== false && engine.options.xMode !== "linear" ? Math.round(l) : l;

    /** Data point under the pointer for a tool: bar snapping, magnet and shift constraint. */
    const pointAt = (
        e: ChartPointerEvent,
        pane: string,
        tool: ToolDefinition,
        scaleId = "right",
        from?: DrawingPoint,
    ): DrawingPoint => {
        const layout = paneLayout(pane);
        const scale = engine.getScale(pane, scaleId);
        let x = e.x;
        let y = e.canvasY - (layout?.top ?? 0);
        if (e.shiftKey && from) {
            const p = constrainAngle(
                { x: engine.xOfLogical(engine.logicalOfTime(from.time)), y: scale.toY(from.price) },
                { x, y },
            );
            x = p.x;
            y = p.y;
        }
        const logical = roundLogical(tool, engine.logicalOfX(x));
        let price = scale.fromY(y);
        let magnet = st().magnet;
        if (e.ctrlKey || e.metaKey) {
            magnet = magnet === "off" ? "strong" : "off";
        }
        const n = engine.data.length;
        if (magnet !== "off" && tool.snapX !== false && n > 0) {
            const index = engine.options.xMode === "linear" ? engine.indexOfX(x) : Math.round(logical);
            if (index >= 0 && index < n) {
                const v = engine.snap(pane, index, y, scaleId);
                if (v !== undefined && (magnet === "strong" || Math.abs(scale.toY(v) - y) <= 12)) {
                    price = v;
                }
            }
        }
        return { time: engine.timeOfLogical(logical), price };
    };

    // ------------------------------------------------------------ hit testing

    const visible = (paneId: string) =>
        st().hidden
            ? []
            : renderOrder(st().drawings).filter((d) => d.pane === paneId && !d.hidden && d.id !== st().editingId);

    const handlesOf = (tool: ToolDefinition, g: Geometry) => tool.handles?.(g) ?? g.points;

    const findHit = (paneId: string, x: number, y: number): Hit | null => {
        const drawings = visible(paneId);
        const pane = paneLayout(paneId);
        for (let i = drawings.length - 1; i >= 0; i--) {
            const d = drawings[i];
            const r = resolve(d, pane);
            if (!r) {
                continue;
            }
            const { tool, g } = r;
            if (!isLocked(d)) {
                const hs = handlesOf(tool, g);
                for (let h = hs.length - 1; h >= 0; h--) {
                    if (dist(hs[h], { x, y }) <= HANDLE_RADIUS) {
                        return { drawing: d, tool, part: h };
                    }
                }
            }
            const part = tool.hitTest(g, x, y);
            if (part !== false) {
                return { drawing: d, tool, part: part === true ? "body" : part };
            }
        }
        return null;
    };

    const setHovered = (id: string | null) => {
        if (hovered !== id) {
            hovered = id;
            engine.invalidate("scene");
        }
    };

    // ------------------------------------------------------------ rendering

    const drawOne = (ctx: CanvasRenderingContext2D, d: Drawing, pane: PaneLayout, preview = false) => {
        const r = resolve(d, pane);
        if (!r) {
            return;
        }
        ctx.save();
        try {
            r.tool.draw(ctx, r.g, d, { selected: st().selectedIds.includes(d.id), hovered: hovered === d.id, preview });
        } finally {
            ctx.restore();
        }
    };

    const drawHandles = (ctx: CanvasRenderingContext2D, d: Drawing, pane: PaneLayout, active: number | null = null) => {
        const r = resolve(d, pane);
        if (!r) {
            return;
        }
        const theme = engine.theme;
        const stroke = isLocked(d) ? theme.textMuted : r.g.color;
        handlesOf(r.tool, r.g).forEach((p, i) => handle(ctx, p, theme.drawing.handleFill, stroke, i === active));
    };

    const drawScene = (paneId: string, ctx: CanvasRenderingContext2D, scope: DrawScope) => {
        if (!scope.pane) {
            return;
        }
        for (const d of visible(paneId)) {
            drawOne(ctx, d, scope.pane);
        }
    };

    const previewDrawing = (c = creating): Drawing | null => {
        if (!c) {
            return null;
        }
        let points: readonly DrawingPoint[] = c.points;
        if (c.tool.build) {
            const g = geometry({ ...c.base, points }, paneLayout(c.pane));
            if (g) {
                const built = c.tool.build(g.points);
                points = fromPixels(g, { ...c.base, points }, built);
            }
        }
        return { ...c.base, points };
    };

    const drawTop = (paneId: string, ctx: CanvasRenderingContext2D, scope: DrawScope) => {
        const pane = scope.pane;
        if (!pane) {
            return;
        }
        const s = st();
        if (!s.hidden) {
            for (const d of visible(paneId)) {
                const selected = s.selectedIds.includes(d.id);
                if ((selected || (d.id === hovered && !s.activeTool)) && !(drag?.started && !selected)) {
                    drawHandles(ctx, d, pane, drag?.started && drag.ids.includes(d.id) ? drag.handle : null);
                }
            }
        }
        const p = previewDrawing();
        if (p && p.pane === paneId) {
            drawOne(ctx, p, pane, true);
            if (!creating?.tool.freehand) {
                drawHandles(ctx, p, pane);
            }
        }
    };

    /** Price / time labels on the axes (always-on labels + highlight of selected drawings). */
    const drawAxes = (ctx: CanvasRenderingContext2D) => {
        if (getOptions().axisLabels === false || st().hidden) {
            return;
        }
        const { layout, theme } = engine;
        const s = st();
        const preview = previewDrawing();
        const selected = new Set(s.selectedIds);
        const items = s.drawings.filter((d) => !d.hidden);
        if (preview) {
            items.push(preview);
            selected.add(preview.id);
        }
        const right = layout.axisRight > 0;
        const axisW = right ? layout.axisRight : layout.axisLeft;
        const axisX = right ? layout.plotLeft + layout.plotWidth : 0;
        ctx.font = font(theme);
        const priceLabel = (pane: PaneLayout, y: number, text: string, color: string) => {
            if (axisW <= 0 || y < 0 || y > pane.height) {
                return;
            }
            const top = clamp(pane.top + y - 10, pane.top, pane.top + pane.height - 20);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(axisX + (right ? 1 : 0), top, axisW - 1, 20, right ? [0, 3, 3, 0] : [3, 0, 0, 3]);
            ctx.fill();
            ctx.fillStyle = contrastText(color);
            ctx.textAlign = right ? "left" : "right";
            ctx.textBaseline = "middle";
            ctx.fillText(text, right ? axisX + 8 : axisW - 8, top + 10.5);
        };
        const timeLabel = (x: number, text: string, color: string) => {
            const axis = layout.timeAxis;
            if (!axis || x < 0 || x > layout.plotWidth) {
                return;
            }
            const w = ctx.measureText(text).width + 16;
            const left = clamp(layout.plotLeft + x - w / 2, layout.plotLeft, layout.plotLeft + layout.plotWidth - w);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(left, axis.top + 1, w, Math.min(22, axis.height - 2), 3);
            ctx.fill();
            ctx.fillStyle = contrastText(color);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, left + w / 2, axis.top + 1 + Math.min(22, axis.height - 2) / 2 + 0.5);
        };
        for (const d of items) {
            const pane = paneLayout(d.pane);
            const r = pane && resolve(d, pane);
            if (!pane || !r) {
                continue;
            }
            const { tool, g } = r;
            const isSelected = selected.has(d.id);
            // always-on labels of the tool, plus every point of a selected drawing
            const always = tool.axisLabels?.(d) ?? {};
            const prices = [...(always.prices ?? []), ...(isSelected ? d.points.map((p) => p.price) : [])];
            const times = [...(always.times ?? []), ...(isSelected ? d.points.map((p) => p.time) : [])];
            if (isSelected && tool.points !== "multi") {
                const ys = prices.map(g.y);
                const xs = times.map(g.x);
                ctx.fillStyle = withAlpha(g.color, 0.18);
                if (axisW > 0 && ys.length > 1) {
                    const top = clamp(Math.min(...ys), 0, pane.height);
                    ctx.fillRect(
                        axisX + (right ? 1 : 0),
                        pane.top + top,
                        axisW - 1,
                        clamp(Math.max(...ys), 0, pane.height) - top,
                    );
                }
                if (layout.timeAxis && xs.length > 1) {
                    const l = clamp(Math.min(...xs), 0, layout.plotWidth);
                    ctx.fillRect(
                        layout.plotLeft + l,
                        layout.timeAxis.top,
                        clamp(Math.max(...xs), 0, layout.plotWidth) - l,
                        layout.timeAxis.height,
                    );
                }
            }
            if (isSelected || tool.points !== "multi") {
                for (const p of new Set(prices)) {
                    priceLabel(pane, g.y(p), g.formatPrice(p), g.color);
                }
                for (const t of new Set(times)) {
                    timeLabel(g.x(t), formatTime(engine, t), g.color);
                }
            }
        }
    };

    // ------------------------------------------------------------ creation

    const startCreation = (e: ChartPointerEvent, type: string) => {
        const tool = controller.getTool(type);
        const pane = e.paneId;
        if (!tool || !pane) {
            return;
        }
        const base = controller.create({ type, pane, points: [] });
        const p = pointAt(e, pane, tool, base.scale);
        creating = { tool, base, pane, points: [p], placed: 1, dragPlace: true };
        if (tool.points === 1) {
            finish();
            return;
        }
        if (!tool.freehand) {
            creating.points.push(p);
        }
        engine.invalidate("top");
    };

    const moveLast = (e: ChartPointerEvent) => {
        const c = creating!;
        const from = c.points[c.placed - 1];
        c.points[c.points.length - 1] = pointAt(e, c.pane, c.tool, c.base.scale, from);
        engine.invalidate("top");
    };

    const place = (e: ChartPointerEvent) => {
        const c = creating!;
        moveLast(e);
        c.placed++;
        const n = c.tool.points;
        if (n !== "multi" && c.placed >= n) {
            finish();
        } else {
            c.points.push(c.points[c.points.length - 1]);
        }
    };

    const finish = () => {
        const c = creating;
        creating = null;
        engine.invalidate("top");
        if (!c) {
            return;
        }
        let points = previewDrawing(c)!.points.slice(
            0,
            c.tool.points === "multi" && !c.tool.freehand ? c.placed : undefined,
        );
        if (c.tool.points === "multi") {
            const g = geometry({ ...c.base, points });
            points = points.filter((_p, i) => i === 0 || !g || dist(g.points[i], g.points[i - 1]) >= 2);
            if (points.length < 2) {
                return;
            }
        }
        const d = controller.add({ ...c.base, points });
        if (!st().keepDrawing) {
            controller.setTool(null);
        }
        if (c.tool.editableText) {
            controller.edit(d.id);
        }
    };

    const cancel = () => {
        if (creating) {
            creating = null;
            engine.invalidate("top");
            return true;
        }
        return false;
    };

    // ------------------------------------------------------------ chart events

    const onPointerDown = (e: ChartPointerEvent) => {
        const tool = st().activeTool;
        if (!tool) {
            return;
        }
        e.preventDefault();
        if (!creating) {
            startCreation(e, tool);
        } else if (!creating.tool.freehand) {
            creating.dragPlace = false;
            place(e);
        }
    };

    const onPointerMove = (e: ChartPointerEvent) => {
        if (creating && !creating.tool.freehand) {
            moveLast(e);
        }
    };

    const onDrag = (e: ChartPointerEvent) => {
        const c = creating;
        if (!c) {
            return;
        }
        if (c.tool.freehand) {
            const p = pointAt(e, c.pane, c.tool, c.base.scale);
            const g = geometry({ ...c.base, points: [c.points[c.points.length - 1], p] });
            if (!g || dist(g.points[0], g.points[1]) >= 2) {
                c.points.push(p);
                engine.invalidate("top");
            }
        } else {
            moveLast(e);
        }
    };

    const onDragEnd = (e: ChartPointerEvent) => {
        const c = creating;
        if (!c) {
            return;
        }
        if (c.tool.freehand) {
            finish();
        } else if (c.dragPlace && c.tool.points !== "multi") {
            c.dragPlace = false;
            place(e);
        }
    };

    const onClick = () => {
        if (!st().activeTool && !creating) {
            controller.clearSelection();
        }
    };

    const onDoubleClick = () => {
        if (creating?.tool.points === "multi") {
            finish();
        }
    };

    const onKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (e.defaultPrevented || (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
            return;
        }
        const mod = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();
        let handled = true;
        if (key === "escape") {
            if (!cancel()) {
                if (st().activeTool) {
                    controller.setTool(null);
                } else if (st().selectedIds.length) {
                    controller.clearSelection();
                } else {
                    handled = false;
                }
            }
        } else if (key === "enter" && creating?.tool.points === "multi") {
            finish();
        } else if ((key === "delete" || key === "backspace") && st().selectedIds.length) {
            controller.removeSelected();
        } else if (mod && key === "z") {
            if (e.shiftKey) {
                controller.redo();
            } else {
                controller.undo();
            }
        } else if (mod && key === "y") {
            controller.redo();
        } else if (mod && key === "c" && st().selectedIds.length) {
            controller.copy();
        } else if (mod && key === "v") {
            controller.paste();
        } else if (mod && key === "d" && st().selectedIds.length) {
            controller.duplicate();
        } else {
            handled = false;
        }
        if (handled) {
            e.preventDefault();
        }
    };

    /** New data: fire `cross` alerts when the last value crosses a line. */
    const onDataChange = (e: { length: number; prepended: number; appended: number }) => {
        const n = engine.data.length;
        if (n === 0) {
            last = null;
            return;
        }
        const value = getOptions().source?.(engine.data[n - 1], n - 1) ?? defaultSource(engine.data[n - 1]);
        const time = engine.times[n - 1];
        if (value === undefined) {
            return;
        }
        if (last && e.prepended === 0 && e.appended <= 1 && time >= last.time) {
            controller.checkCrosses(
                last.value,
                value,
                engine.xs[n - 1],
                (t) => engine.logicalOfTime(t),
                engine.data[n - 1],
            );
        }
        last = { time, value };
    };

    // ------------------------------------------------------------ hit target (per pane)

    const target = (paneId: string) => ({
        hitTest(x: number, y: number) {
            if (st().activeTool || creating) {
                setHovered(null);
                return false;
            }
            const hit = findHit(paneId, x, y);
            setHovered(hit?.drawing.id ?? null);
            if (!hit) {
                return false;
            }
            if (st().cursor === "eraser" || hit.part === "remove") {
                return "pointer";
            }
            if (typeof hit.part === "number") {
                return "move";
            }
            return isLocked(hit.drawing) ? "default" : "pointer";
        },
        onPointerDown(e: ChartPointerEvent) {
            const hit = findHit(paneId, e.x, e.y);
            if (!hit) {
                return false;
            }
            const id = hit.drawing.id;
            const s = st();
            const already = s.selectedIds.includes(id);
            if (e.shiftKey) {
                controller.select(id, true);
            } else if (!already) {
                controller.select(id);
            }
            const ids = (already && !e.shiftKey ? s.selectedIds : [id]).filter((each) => {
                const d = s.drawings.find((x) => x.id === each);
                return d && !isLocked(d);
            });
            drag = {
                ids,
                handle: typeof hit.part === "number" && ids.length ? hit.part : null,
                hit,
                snapshot: new Map(s.drawings.filter((d) => ids.includes(d.id)).map((d) => [d.id, d])),
                started: false,
                remove: st().cursor === "eraser" || hit.part === "remove",
                shift: e.shiftKey,
                multi: already && s.selectedIds.length > 1,
            };
            return true;
        },
        onDrag(e: ChartPointerEvent) {
            const dr = drag;
            if (!dr || dr.remove || !dr.ids.length) {
                return;
            }
            if (!dr.started) {
                dr.started = true;
                controller.checkpoint();
            }
            if (dr.handle !== null) {
                const d0 = dr.snapshot.get(dr.hit.drawing.id);
                const g = d0 && geometry(d0);
                if (!d0 || !g) {
                    return;
                }
                const tool = dr.hit.tool;
                const anchor =
                    tool.points === 2 && g.points.length === 2 && dr.handle < 2 ? d0.points[1 - dr.handle] : undefined;
                const p = pointAt(e, d0.pane, tool, d0.scale, anchor);
                const px = { x: g.x(p.time), y: g.y(p.price) };
                const index = dr.handle;
                const next = tool.dragHandle
                    ? tool.dragHandle(g, index, px)
                    : g.points.map((q, i) => (i === index ? px : q));
                const points = fromPixels(g, d0, next).map((q, i) => (samePt(next[i], px) ? p : q));
                controller.update(d0.id, { points }, { history: false, silent: true });
                return;
            }
            const x0 = e.x - e.dx;
            const dl = engine.logicalOfX(e.x) - engine.logicalOfX(x0);
            controller.update(
                dr.ids,
                (d) => {
                    const d0 = dr.snapshot.get(d.id)!;
                    const tool = controller.getTool(d.type);
                    const scale = engine.getScale(d.pane, d.scale ?? "right");
                    const shift = tool ? roundLogical(tool, dl) : dl;
                    return {
                        points: d0.points.map((p) => ({
                            time: engine.timeOfLogical(engine.logicalOfTime(p.time) + shift),
                            price: scale.fromY(scale.toY(p.price) + e.dy),
                        })),
                    };
                },
                { history: false, silent: true },
            );
        },
        onDragEnd() {
            if (drag?.started) {
                controller.notifyUpdate(drag.ids);
            }
            drag = null;
        },
        onClick(e: ChartPointerEvent) {
            const dr = drag;
            drag = null;
            if (!dr) {
                return;
            }
            const id = dr.hit.drawing.id;
            if (dr.remove) {
                controller.remove(id);
            } else if (dr.multi && !e.shiftKey) {
                controller.select(id);
            }
        },
        onDoubleClick(e: ChartPointerEvent) {
            const hit = findHit(paneId, e.x, e.y);
            if (!hit) {
                return;
            }
            if (hit.tool.editableText && !isLocked(hit.drawing)) {
                controller.edit(hit.drawing.id);
            }
            getOptions().onDoubleClick?.(hit.drawing, e);
        },
        onContextMenu(e: ChartPointerEvent) {
            const hit = findHit(paneId, e.x, e.y);
            if (hit) {
                controller.select(hit.drawing.id);
                getOptions().onContextMenu?.(hit.drawing, e);
            }
        },
        onHover(h: boolean) {
            if (!h) {
                setHovered(null);
            }
        },
    });

    return {
        geometry,
        findHit,
        drawScene,
        drawTop,
        drawAxes,
        target,
        onPointerDown,
        onPointerMove,
        onDrag,
        onDragEnd,
        onClick,
        onDoubleClick,
        onKeyDown,
        onDataChange,
        cancel,
        /** Drawing currently being created (preview), if any. */
        get preview() {
            return previewDrawing();
        },
        get hovered() {
            return hovered;
        },
    };
}

export type DrawingEditor = ReturnType<typeof createEditor>;
