import type { ChartEngine } from "./engine";
import type { ChartPointerEvent, HitTarget, Region } from "./types";

type DragKind = "pan" | "target" | "listeners" | "priceAxis" | "timeAxis" | "separator" | "pinch";

interface Drag {
    kind: DragKind;
    paneId: string | null;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    moved: boolean;
    yPan: boolean;
    target?: HitTarget;
    scale?: string;
    samples: { x: number; t: number }[];
    pinch?: { d0: number; logical: number; span: number };
}

const CLICK_TOLERANCE = 3;

/** Cursor over (and while dragging) the axes and pane separators. */
const RESIZE_CURSORS: Partial<Record<DragKind | Region["type"], string>> = {
    priceAxis: "ns-resize",
    timeAxis: "ew-resize",
    separator: "row-resize",
};

/**
 * Translates DOM pointer / wheel / keyboard input into chart behaviour:
 * hit targets first, then chart event listeners, then pan & zoom.
 */
export class Interaction<T> {
    private drag: Drag | null = null;
    private readonly pointers = new Map<number, { x: number; y: number; type: string }>();
    private hovered: HitTarget | null = null;
    private hoverCursor: string | null = null;
    private kinetic = 0;
    private settleTimer: ReturnType<typeof setTimeout> | undefined;

    public constructor(
        private readonly engine: ChartEngine<T>,
        private readonly el: HTMLElement,
        private readonly container: HTMLElement,
    ) {}

    public attach() {
        const el = this.el;
        const listeners: [EventTarget, string, (e: any) => void][] = [
            [el, "pointerdown", this.onPointerDown],
            [el, "pointermove", this.onPointerMove],
            [el, "pointerup", this.onPointerUp],
            [el, "pointercancel", this.onPointerUp],
            [el, "pointerleave", this.onPointerLeave],
            [el, "wheel", this.onWheel],
            [el, "dblclick", this.onDoubleClick],
            [el, "contextmenu", this.onContextMenu],
            [this.container, "keydown", this.onKeyDown],
        ];
        for (const [target, type, fn] of listeners) {
            // not passive: wheel scrolling over the chart must not scroll the page
            target.addEventListener(type, fn, { passive: false });
        }
        el.style.touchAction = "none";
        return () => {
            for (const [target, type, fn] of listeners) {
                target.removeEventListener(type, fn);
            }
            cancelAnimationFrame(this.kinetic);
            clearTimeout(this.settleTimer);
        };
    }

    private get enabled() {
        return this.engine.options.interactive !== false;
    }

    // ------------------------------------------------------------ geometry

    private local(e: MouseEvent) {
        const rect = this.el.getBoundingClientRect();
        return { cx: e.clientX - rect.left, cy: e.clientY - rect.top };
    }

    public region(cx: number, cy: number): Region {
        const { layout } = this.engine;
        if (layout.timeAxis && cy >= layout.timeAxis.top) {
            return { type: "timeAxis" };
        }
        for (let i = 0; i < layout.panes.length; i++) {
            const p = layout.panes[i];
            if (p.height <= 0) {
                continue;
            }
            if (i > 0 && Math.abs(cy - p.top) <= 3 && layout.panes.slice(0, i).some((q) => q.height > 0)) {
                return { type: "separator", paneId: p.id };
            }
            if (cy >= p.top && cy < p.top + p.height) {
                if (cx < layout.plotLeft) {
                    return { type: "priceAxis", paneId: p.id, side: "left" };
                }
                if (cx > layout.plotLeft + layout.plotWidth) {
                    return { type: "priceAxis", paneId: p.id, side: "right" };
                }
                return { type: "plot", paneId: p.id };
            }
        }
        return { type: "none" };
    }

    private event(
        type: string,
        native: Event,
        cx: number,
        cy: number,
        paneOverride?: string | null,
    ): ChartPointerEvent {
        const engine = this.engine;
        const region = this.region(cx, cy);
        const paneId = paneOverride !== undefined ? paneOverride : "paneId" in region ? region.paneId : null;
        const pane = engine.layout.panes.find((p) => p.id === paneId);
        const x = cx - engine.layout.plotLeft;
        const y = cy - (pane?.top ?? 0);
        const logical = engine.logicalOfX(x);
        const m = native as MouseEvent;
        let prevented = false;
        const drag = this.drag;
        return {
            type,
            native,
            x,
            y,
            canvasX: cx,
            canvasY: cy,
            region,
            paneId,
            index: this.hoverIndex(paneId, x, y),
            logical,
            time: engine.timeOfLogical(logical),
            price: (scaleId = "right") => (paneId ? engine.getScale(paneId, scaleId).fromY(y) : NaN),
            shiftKey: !!m.shiftKey,
            ctrlKey: !!m.ctrlKey,
            altKey: !!m.altKey,
            metaKey: !!m.metaKey,
            pointerType: (native as PointerEvent).pointerType ?? "mouse",
            dx: drag ? cx - drag.startX : 0,
            dy: drag ? cy - drag.startY : 0,
            preventDefault() {
                prevented = true;
            },
            get defaultPrevented() {
                return prevented;
            },
        };
    }

    private hoverIndex(paneId: string | null, x: number, y: number) {
        if (paneId) {
            for (const r of this.engine.ordered()) {
                if (r.pane === paneId && r.indexAt && r.visible !== false) {
                    const i = r.indexAt(x, y);
                    if (i !== undefined) {
                        return i;
                    }
                }
            }
        }
        return this.engine.indexOfX(x);
    }

    /** Id of the price scale shown by the axis on one side of a pane. */
    private axisScale(paneId: string, side: "left" | "right") {
        return this.engine.priceAxes.find((a) => a.paneId === paneId && (a.side ?? "right") === side)?.scale ?? "right";
    }

    /** Fires `settle` (onReachStart / onReachEnd) once wheel or keyboard scrolling pauses. */
    private settleSoon() {
        clearTimeout(this.settleTimer);
        this.settleTimer = setTimeout(() => this.engine.settle(), 150);
    }

    private hit(paneId: string | null, x: number, y: number): { target: HitTarget; cursor: string } | null {
        for (const target of this.engine.targets) {
            if (target.pane !== null && target.pane !== paneId) {
                continue;
            }
            const r = target.hitTest(x, y);
            if (r) {
                return { target, cursor: typeof r === "string" ? r : "pointer" };
            }
        }
        return null;
    }

    // ------------------------------------------------------------ pointer

    private onPointerDown = (e: PointerEvent) => {
        if (!this.enabled || e.button === 2) {
            return;
        }
        this.container.focus({ preventScroll: true });
        this.el.setPointerCapture?.(e.pointerId);
        cancelAnimationFrame(this.kinetic);
        const { cx, cy } = this.local(e);
        this.pointers.set(e.pointerId, { x: cx, y: cy, type: e.pointerType });
        const engine = this.engine;
        const base = {
            startX: cx,
            startY: cy,
            lastX: cx,
            lastY: cy,
            moved: false,
            yPan: false,
            samples: [{ x: cx, t: e.timeStamp }],
        };

        const touches = [...this.pointers.values()].filter((p) => p.type === "touch");
        if (touches.length === 2 && engine.options.zoom !== false) {
            const [a, b] = touches;
            const midX = (a.x + b.x) / 2 - engine.layout.plotLeft;
            this.drag = {
                ...base,
                kind: "pinch",
                paneId: null,
                pinch: {
                    d0: Math.hypot(a.x - b.x, a.y - b.y) || 1,
                    logical: engine.logicalOfX(midX),
                    span: engine.to - engine.from,
                },
            };
            return;
        }

        const region = this.region(cx, cy);
        const paneId = "paneId" in region ? region.paneId : null;
        if (region.type === "separator") {
            this.drag = { ...base, kind: "separator", paneId };
        } else if (region.type === "priceAxis") {
            this.drag = { ...base, kind: "priceAxis", paneId, scale: this.axisScale(region.paneId, region.side) };
        } else if (region.type === "timeAxis") {
            this.drag = engine.options.zoom !== false ? { ...base, kind: "timeAxis", paneId: null } : null;
        } else if (region.type === "plot") {
            const ev = this.event("pointerdown", e, cx, cy);
            const hit = this.hit(paneId, ev.x, ev.y);
            if (hit && hit.target.onPointerDown?.(ev) !== false) {
                this.drag = { ...base, kind: "target", paneId, target: hit.target };
            } else {
                // listeners (e.g. a drawing tool) that prevent the default receive the drag instead of panning
                engine.emit("pointerdown", ev);
                const pan = !ev.defaultPrevented && engine.options.pan !== false;
                this.drag = { ...base, kind: pan ? "pan" : "listeners", paneId };
            }
        }
        this.updateCursor();
    };

    private onPointerMove = (e: PointerEvent) => {
        if (!this.enabled) {
            return;
        }
        const { cx, cy } = this.local(e);
        if (this.pointers.has(e.pointerId)) {
            this.pointers.set(e.pointerId, { x: cx, y: cy, type: e.pointerType });
        }
        const engine = this.engine;
        const drag = this.drag;
        if (drag?.kind === "pinch") {
            this.pinch();
            return;
        }
        if (drag) {
            const dx = cx - drag.lastX;
            const dy = cy - drag.lastY;
            if (!drag.moved && Math.hypot(cx - drag.startX, cy - drag.startY) > CLICK_TOLERANCE) {
                drag.moved = true;
            }
            drag.samples.push({ x: cx, t: e.timeStamp });
            if (drag.samples.length > 8) {
                drag.samples.shift();
            }
            switch (drag.kind) {
                case "pan":
                    if (drag.moved) {
                        engine.panBy(dx);
                        this.panY(drag, cy, dy);
                    }
                    break;
                case "target":
                    if (drag.moved) {
                        drag.target!.onDrag?.(this.event("drag", e, cx, cy, drag.paneId));
                        engine.invalidate("scene");
                    }
                    break;
                case "listeners":
                    if (drag.moved) {
                        engine.emit("drag", this.event("drag", e, cx, cy, drag.paneId));
                    }
                    break;
                case "priceAxis":
                    if (drag.paneId) {
                        engine.getScale(drag.paneId, drag.scale).scaleBy(Math.exp(dy * 0.005));
                        engine.invalidate("scene");
                    }
                    break;
                case "timeAxis":
                    engine.zoomAt(Math.exp(-dx * 0.005));
                    break;
                case "separator":
                    engine.resizePane(drag.paneId!, dy);
                    break;
            }
            drag.lastX = cx;
            drag.lastY = cy;
        } else {
            this.updateHover(cx, cy);
        }

        const region = this.region(cx, cy);
        const touchPanning = e.pointerType === "touch" && drag?.kind === "pan";
        if (region.type === "plot" && !touchPanning) {
            const ev = this.event("pointermove", e, cx, cy, drag?.paneId);
            engine.setCrosshair({ x: ev.x, y: ev.y, paneId: ev.paneId, index: ev.index, logical: ev.logical });
            engine.emit("pointermove", ev);
        } else if (!drag) {
            engine.setCrosshair(null);
        }
        this.updateCursor(region);
    };

    private panY(drag: Drag, cy: number, dy: number) {
        const engine = this.engine;
        if (!drag.paneId) {
            return;
        }
        const pane = engine.layout.panes.find((p) => p.id === drag.paneId);
        const paneOptions = pane ? engine.paneOptions(pane.id) : undefined;
        if (!pane || paneOptions?.yPan === false) {
            return;
        }
        const scales = engine.paneScales(pane.id).filter((s) => !s.options.domain);
        // like TradingView: while a scale autoscales, dragging only pans in time so the data can't be lost.
        // Once the user adjusted the price scale (axis drag / wheel), vertical panning moves it freely.
        if (!drag.yPan) {
            drag.yPan = scales.some((s) => !s.isAuto);
            if (!drag.yPan) {
                return;
            }
            dy = cy - drag.startY;
        }
        for (const s of scales) {
            s.panBy(dy);
        }
        engine.invalidate("scene");
    }

    private pinch() {
        const engine = this.engine;
        const touches = [...this.pointers.values()].filter((p) => p.type === "touch");
        const p = this.drag?.pinch;
        if (touches.length < 2 || !p) {
            return;
        }
        const [a, b] = touches;
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const midX = (a.x + b.x) / 2 - engine.layout.plotLeft;
        const span = (p.span * p.d0) / d;
        const w = engine.layout.plotWidth || 1;
        const from = p.logical - (midX / w) * span;
        engine.setLogicalRange(from, from + span);
    }

    private onPointerUp = (e: PointerEvent) => {
        this.pointers.delete(e.pointerId);
        this.el.releasePointerCapture?.(e.pointerId);
        const drag = this.drag;
        if (!drag || !this.enabled) {
            this.drag = null;
            return;
        }
        const engine = this.engine;
        const { cx, cy } = this.local(e);
        if (drag.kind === "pinch") {
            if (this.pointers.size < 2) {
                this.drag = null;
                engine.settle();
            }
            return;
        }
        const ev = this.event("pointerup", e, cx, cy, drag.paneId);
        switch (drag.kind) {
            case "pan":
                if (drag.moved) {
                    if (e.pointerType === "touch" && engine.options.kineticScroll !== false) {
                        this.startKinetic(drag);
                    } else {
                        engine.settle();
                    }
                } else {
                    if (e.pointerType === "touch") {
                        engine.setCrosshair({
                            x: ev.x,
                            y: ev.y,
                            paneId: ev.paneId,
                            index: ev.index,
                            logical: ev.logical,
                        });
                    }
                    engine.emit("click", { ...ev, type: "click" });
                }
                break;
            case "target":
                if (drag.moved) {
                    drag.target!.onDragEnd?.({ ...ev, type: "dragend" });
                } else {
                    drag.target!.onClick?.({ ...ev, type: "click" });
                }
                engine.invalidate("scene");
                break;
            case "listeners":
                if (drag.moved) {
                    engine.emit("dragend", { ...ev, type: "dragend" });
                } else {
                    engine.emit("click", { ...ev, type: "click" });
                }
                break;
            default:
                engine.settle();
        }
        engine.emit("pointerup", ev);
        this.drag = null;
        this.updateCursor(this.region(cx, cy));
    };

    private startKinetic(drag: Drag) {
        const s = drag.samples;
        const last = s[s.length - 1];
        const first = s.find((p) => last.t - p.t < 100) ?? s[0];
        let v = last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0;
        let prev = performance.now();
        const step = (now: number) => {
            const dt = now - prev;
            prev = now;
            this.engine.panBy(v * dt);
            v *= Math.pow(0.95, dt / 16);
            if (Math.abs(v) > 0.02) {
                this.kinetic = requestAnimationFrame(step);
            } else {
                this.engine.settle();
            }
        };
        if (Math.abs(v) > 0.1) {
            this.kinetic = requestAnimationFrame(step);
        } else {
            this.engine.settle();
        }
    }

    private onPointerLeave = (e: PointerEvent) => {
        if (this.drag || !this.enabled) {
            return;
        }
        this.setHovered(null);
        this.engine.setCrosshair(null);
        const { cx, cy } = this.local(e);
        this.engine.emit("pointerleave", this.event("pointerleave", e, cx, cy));
    };

    private onDoubleClick = (e: MouseEvent) => {
        if (!this.enabled) {
            return;
        }
        const engine = this.engine;
        const { cx, cy } = this.local(e);
        const region = this.region(cx, cy);
        if (region.type === "priceAxis") {
            for (const s of engine.paneScales(region.paneId)) {
                s.resetAuto();
            }
            engine.invalidate("scene");
        } else if (region.type === "timeAxis") {
            engine.resetView();
        } else if (region.type === "separator") {
            engine.toggleMaximizePane(region.paneId);
        } else if (region.type === "plot") {
            const ev = this.event("dblclick", e, cx, cy);
            const hit = this.hit(region.paneId, ev.x, ev.y);
            if (hit?.target.onDoubleClick) {
                hit.target.onDoubleClick(ev);
            } else {
                engine.emit("dblclick", ev);
            }
        }
    };

    private onContextMenu = (e: MouseEvent) => {
        if (!this.enabled) {
            return;
        }
        const { cx, cy } = this.local(e);
        const ev = this.event("contextmenu", e, cx, cy);
        const hit = this.hit(ev.paneId, ev.x, ev.y);
        if (hit?.target.onContextMenu) {
            hit.target.onContextMenu(ev);
            e.preventDefault();
            return;
        }
        this.engine.emit("contextmenu", ev);
        if (ev.defaultPrevented) {
            e.preventDefault();
        }
    };

    private onWheel = (e: WheelEvent) => {
        const engine = this.engine;
        if (!this.enabled || (engine.options.zoom === false && engine.options.pan === false)) {
            return;
        }
        e.preventDefault();
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;
        const dx = e.deltaX * unit;
        const dy = e.deltaY * unit;
        const { cx, cy } = this.local(e);
        const region = this.region(cx, cy);
        if (Math.abs(dx) > Math.abs(dy) && !e.ctrlKey) {
            if (engine.options.pan !== false) {
                engine.panBy(-dx);
            }
        } else if (engine.options.zoom !== false) {
            const factor = e.ctrlKey
                ? Math.exp(dy * 0.01)
                : Math.pow(engine.options.zoomMultiplier ?? 1.1, Math.sign(dy) * Math.min(3, Math.abs(dy) / 50 || 1));
            if (region.type === "priceAxis") {
                engine.getScale(region.paneId, this.axisScale(region.paneId, region.side)).scaleBy(factor);
                engine.invalidate("scene");
            } else {
                engine.zoomAt(factor, cx - engine.layout.plotLeft);
            }
        }
        this.settleSoon();
    };

    private onKeyDown = (e: KeyboardEvent) => {
        const engine = this.engine;
        if (!this.enabled) {
            return;
        }
        engine.emit("keydown", e);
        if (e.defaultPrevented) {
            return;
        }
        const n = engine.data.length;
        switch (e.key) {
            case "ArrowLeft":
                engine.panBy(engine.barSpacing * (e.shiftKey ? 10 : 1));
                break;
            case "ArrowRight":
                engine.panBy(-engine.barSpacing * (e.shiftKey ? 10 : 1));
                break;
            case "ArrowUp":
            case "+":
            case "=":
                engine.zoomIn();
                break;
            case "ArrowDown":
            case "-":
                engine.zoomOut();
                break;
            case "Home":
                if (n) {
                    const span = engine.to - engine.from;
                    engine.setLogicalRange(engine.xs[0] - 0.5, engine.xs[0] - 0.5 + span);
                }
                break;
            case "End":
                engine.scrollToRealtime();
                break;
            default:
                return;
        }
        e.preventDefault();
        this.settleSoon();
    };

    // ------------------------------------------------------------ hover & cursor

    private updateHover(cx: number, cy: number) {
        const region = this.region(cx, cy);
        if (region.type !== "plot") {
            this.setHovered(null);
            return;
        }
        const x = cx - this.engine.layout.plotLeft;
        const pane = this.engine.layout.panes.find((p) => p.id === region.paneId)!;
        const hit = this.hit(region.paneId, x, cy - pane.top);
        this.setHovered(hit?.target ?? null);
        this.hoverCursor = hit?.cursor ?? null;
    }

    private setHovered(target: HitTarget | null) {
        if (this.hovered === target) {
            return;
        }
        this.hovered?.onHover?.(false);
        this.hovered = target;
        target?.onHover?.(true);
        if (!target) {
            this.hoverCursor = null;
        }
        this.engine.invalidate("scene");
    }

    private updateCursor(region?: Region) {
        const drag = this.drag;
        let cursor: string;
        if (drag?.kind === "pan" && drag.moved) {
            cursor = "grabbing";
        } else if (drag && RESIZE_CURSORS[drag.kind]) {
            cursor = RESIZE_CURSORS[drag.kind]!;
        } else if (drag?.kind === "target") {
            // a target's "move" / "ew-resize"... cursor stays while dragging; a plain pointer becomes grabbing
            cursor = !this.hoverCursor || this.hoverCursor === "pointer" ? "grabbing" : this.hoverCursor;
        } else if (this.hoverCursor) {
            cursor = this.hoverCursor;
        } else if (region && RESIZE_CURSORS[region.type]) {
            cursor = RESIZE_CURSORS[region.type]!;
        } else {
            cursor = this.engine.toolCursor ?? "crosshair";
        }
        if (this.el.style.cursor !== cursor) {
            this.el.style.cursor = cursor;
        }
    }
}
