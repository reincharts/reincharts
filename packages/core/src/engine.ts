import { font } from "./canvas";
import {
    decimalsFor,
    clamp,
    formatNumber,
    isFiniteNumber,
    lowerBound,
    nearestIndex,
    niceStep,
    niceTicks,
    upperBound,
} from "./math";
import { PriceScale } from "./priceScale";
import type { PriceScaleOptions } from "./priceScale";
import { joinSync, type SyncMessage } from "./sync";
import { computeTimeTicks, TimeFormatter, type TimeFormatterOptions, type TimeTick } from "./time";
import { lightTheme, type Theme } from "./theme";
import type {
    AxisRegistration,
    ChartEventMap,
    CrosshairState,
    DrawScope,
    HitTarget,
    Layer,
    Layout,
    LegendItem,
    PaneLayout,
    PaneOptions,
    Renderable,
    VisibleRange,
} from "./types";

export type XMode = "index" | "linear";
export type XType = "time" | "number" | "category";
export type ZoomAnchor = "mouse" | "right" | "lastVisible";
export type Clamp =
    boolean | "left" | "right" | "both" | ((range: [number, number], data: [number, number]) => [number, number]);

export interface ChartOptions<T = any> extends TimeFormatterOptions {
    /** X value of a datum. Default: `d.date ?? d.time ?? d.x ?? index`. */
    xAccessor?: (d: T, index: number) => Date | number | string;
    /** "index": evenly spaced slots (bars, categories). "linear": continuous numeric / time axis. */
    xMode?: XMode;
    /** Force the x value type. Auto-detected from the first datum otherwise. */
    xType?: XType;
    /** Resolved theme (`<ChartCanvas theme>` also accepts "light" / "dark" / partial overrides). */
    theme?: Theme;
    /** Empty bars kept right of the last bar (index mode). Default 3 for time data, 0 otherwise. */
    rightOffset?: number;
    /** Initial pixel spacing between bars when showing the latest data. Default 8. */
    barSpacing?: number;
    /** Smallest bar spacing in pixels when zooming out. Default 0.5. */
    minBarSpacing?: number;
    /** Largest bar spacing in pixels when zooming in. Default 60. */
    maxBarSpacing?: number;
    /** "latest" anchors the newest bars on the right (default for time data), "fit" shows everything. */
    initialView?: "latest" | "fit";
    /** Initial visible x range (data x values). */
    defaultVisibleRange?:
        readonly [Date | number, Date | number] | ((data: readonly T[]) => readonly [Date | number, Date | number]);
    /** Prevent scrolling past the data edges. */
    clamp?: Clamp;
    /** Draw the x axis right to left. */
    flipX?: boolean;
    /** Allow panning by dragging, wheel / trackpad and keyboard. Default true. */
    pan?: boolean;
    /** Allow zooming with the wheel, pinch, keyboard and axis drag. Default true. */
    zoom?: boolean;
    /** Disables every pointer / keyboard interaction (still renders). */
    interactive?: boolean;
    /** Point kept fixed when zooming: under the mouse (default), the right edge, the last visible bar, or custom. */
    zoomAnchor?: ZoomAnchor | ((args: { mouseX: number; engine: ChartEngine<T> }) => number);
    /** Zoom factor per wheel step. Default 1.1. */
    zoomMultiplier?: number;
    /** Keep scrolling after a touch fling. Default true. */
    kineticScroll?: boolean;
    /** Charts sharing a syncId share crosshair position (and the visible range with `syncRange`). */
    syncId?: string;
    /** Also share pan / zoom with charts of the same `syncId`. */
    syncRange?: boolean;
    /** Changing this resets the view (e.g. pass the symbol). */
    resetKey?: unknown;
    /** Called when the visible range changes (logical bounds and first / last visible index). */
    onVisibleRangeChange?: (range: { from: number; to: number; start: number; end: number }) => void;
    /** Called once when the user scrolls past the first bar (load older history here). */
    onReachStart?: (firstX: number) => void;
    /** Called once when the user scrolls past the last bar. */
    onReachEnd?: (lastX: number) => void;
    /** Called when the crosshair moves or hides (null). */
    onCrosshairMove?: (crosshair: CrosshairState | null) => void;
}

/** Immutable snapshot consumed by React (`useChartState`). */
export interface ChartState {
    readonly layout: Layout;
    readonly range: VisibleRange;
    readonly crosshair: CrosshairState | null;
    readonly theme: Theme;
    readonly dataLength: number;
    readonly version: number;
}

interface PaneState {
    id: string;
    seq: number;
    /** Created implicitly for components outside any <Pane>. */
    implicit?: boolean;
    options: PaneOptions;
    /** Stretch factor changed by the user dragging separators. */
    size?: number;
    collapsed: boolean;
    scales: Map<string, PriceScale>;
}

type Listener = (e: any) => void;

const defaultX = (d: any, i: number) => d?.date ?? d?.time ?? d?.x ?? i;
const toNumber = (v: unknown) => (v instanceof Date ? v.getTime() : typeof v === "number" ? v : NaN);
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * The chart engine: data mapping, viewport, panes, layout, render loop and events.
 * Framework agnostic; React components talk to it through hooks.
 */
export class ChartEngine<T = any> {
    /** Current options (set by `<ChartCanvas>` props). */
    public options: ChartOptions<T> = {};
    /** Resolved theme. */
    public theme: Theme = lightTheme;
    /** The chart data. */
    public data: readonly T[] = [];
    /** Logical x of each datum (index in index mode, numeric x in linear mode). */
    public xs: Float64Array = new Float64Array(0);
    /** Numeric x value of each datum (timestamps for time data). */
    public times: Float64Array = new Float64Array(0);
    /** Category labels when the x values are strings. */
    public categories: string[] = [];
    /** Detected (or forced) type of the x values. */
    public xType: XType = "number";
    /** Whether the x values are ascending (unsorted linear data is drawn whole). */
    public sorted = true;
    /** Typical x distance between consecutive data points. */
    public step = 1;
    /** Time data with bars shorter than a day (affects time labels). */
    public intraday = false;
    /** Left edge of the viewport in logical units. */
    public from = 0;
    /** Right edge of the viewport in logical units. */
    public to = 1;
    /** Chart width in CSS pixels. */
    public width = 0;
    /** Chart height in CSS pixels. */
    public height = 0;
    /** Device pixel ratio used for the canvases. */
    public ratio = 1;
    /** Time zone aware date formatting for axis and crosshair labels. */
    public time = new TimeFormatter();
    /** Current layout: plot area, axis bands and pane rectangles. */
    public layout: Layout = emptyLayout;
    /** Current crosshair position, or null when the pointer is outside the plot. */
    public crosshair: CrosshairState | null = null;
    /** Cursor requested by tools (e.g. drawing mode); null = default. */
    public toolCursor: string | null = null;

    private readonly hidden = new Set<string>();
    private readonly panes = new Map<string, PaneState>();
    /** Pane shown alone at full height, if any. */
    private maximized: string | null = null;
    private paneSeq = 0;
    private readonly renderables = new Set<Renderable<T>>();
    private sortedRenderables: Renderable<T>[] | null = null;
    private readonly hitTargets = new Set<HitTarget>();
    private readonly axes = new Set<AxisRegistration>();
    private readonly listeners = new Map<string, Set<Listener>>();
    private readonly storeListeners = new Set<() => void>();
    private contexts: Partial<Record<Layer, CanvasRenderingContext2D>> = {};
    private dirty = { layout: true, scene: true, top: true, state: true };
    private frame = 0;
    private needsReset = true;
    private autoX = true;
    private axisWidths = { left: 0, right: 0 };
    /** Widest auto-sized price axis seen since the last view reset (auto axes never shrink below it). */
    private axisFloor = { left: 0, right: 0 };
    private reached = { start: false, end: false };
    private lastResetKey: unknown = undefined;
    private snapshot: ChartState | null = null;
    private version = 0;
    private leaveSync?: () => void;
    private syncing = false;
    private lastRange = { from: NaN, to: NaN };

    // ---------------------------------------------------------------- setup

    /** Applies new options (called by `<ChartCanvas>` on every render). */
    public setOptions(options: ChartOptions<T>) {
        const prev = this.options;
        this.options = options;
        this.theme = options.theme ?? lightTheme;
        if (
            prev.timeZone !== options.timeZone ||
            prev.tickFormatter !== options.tickFormatter ||
            prev.crosshairFormatter !== options.crosshairFormatter
        ) {
            this.time = new TimeFormatter(options);
        }
        if (prev.syncId !== options.syncId) {
            this.leaveSync?.();
            this.leaveSync = options.syncId ? joinSync(options.syncId, this, (m) => this.receiveSync(m)) : undefined;
        }
        if (options.resetKey !== this.lastResetKey) {
            this.lastResetKey = options.resetKey;
            this.needsReset = true;
        }
        if (prev.xAccessor !== options.xAccessor || prev.xMode !== options.xMode || prev.xType !== options.xType) {
            this.setData(this.data, true);
        }
        this.invalidate("layout");
    }

    /** Connects the scene and top canvases. */
    public attach(scene: HTMLCanvasElement, top: HTMLCanvasElement) {
        this.contexts = { scene: scene.getContext("2d") ?? undefined, top: top.getContext("2d") ?? undefined };
        this.invalidate("layout");
        if (this.options.syncId && !this.leaveSync) {
            this.leaveSync = joinSync(this.options.syncId, this, (m) => this.receiveSync(m));
        }
    }

    /** Stops rendering and leaves the sync group (the engine can be attached again). */
    public destroy() {
        cancelAnimationFrame(this.frame);
        // reset so a re-attach (React StrictMode mounts twice) can schedule frames again
        this.frame = 0;
        this.leaveSync?.();
        this.leaveSync = undefined;
        this.contexts = {};
    }

    /** Resizes the chart, keeping the bar spacing (a hidden, zero-sized chart keeps its view). */
    public setSize(width: number, height: number, ratio: number) {
        if (width === this.width && height === this.height && ratio === this.ratio) {
            return;
        }
        const oldPlot = this.layout.plotWidth;
        this.width = width;
        this.height = height;
        this.ratio = ratio;
        this.layoutNow();
        // keep bar spacing on resize: grow / shrink from the right edge.
        // Both widths must be real: a hidden chart (0 wide, e.g. an inactive tab) must not collapse the range.
        if (!this.needsReset && oldPlot > 0 && this.layout.plotWidth > 0 && this.options.xMode !== "linear") {
            this.from = this.to - ((this.to - this.from) * this.layout.plotWidth) / oldPlot;
        }
        this.invalidate("layout");
    }

    // ---------------------------------------------------------------- data

    /** Sets new data. Prepended history keeps the view in place; appended bars scroll it when the last bar is visible. */
    public setData(data: readonly T[], force = false) {
        if (data === this.data && !force) {
            return;
        }
        const old = { n: this.data.length, times: this.times, xs: this.xs, from: this.from, to: this.to };
        const accessor = this.options.xAccessor ?? defaultX;
        const linear = this.options.xMode === "linear";
        const n = data.length;
        const first = n > 0 ? accessor(data[0], 0) : undefined;
        // a numeric `time` field (datafeed bars, epoch ms) is time data too
        const numericTime =
            !this.options.xAccessor &&
            n > 0 &&
            (data[0] as any)?.date === undefined &&
            typeof (data[0] as any)?.time === "number";
        this.xType =
            this.options.xType ??
            (first instanceof Date || numericTime ? "time" : typeof first === "string" ? "category" : "number");
        const times = new Float64Array(n);
        const categories: string[] = this.xType === "category" ? new Array(n) : [];
        let sorted = true;
        for (let i = 0; i < n; i++) {
            const v = accessor(data[i], i);
            if (this.xType === "category") {
                categories[i] = String(v);
                times[i] = i;
            } else {
                times[i] = toNumber(v);
                if (i > 0 && times[i] < times[i - 1]) {
                    sorted = false;
                }
            }
        }
        this.data = data;
        this.times = times;
        this.categories = categories;
        this.sorted = sorted;
        if (linear) {
            this.xs = times;
            this.step = n > 1 && sorted ? medianStep(times) : 1;
        } else {
            this.xs = Float64Array.from({ length: n }, (_, i) => i);
            this.step = 1;
        }
        const timeStep = this.xType === "time" && n > 1 ? medianStep(times) : DAY;
        this.intraday = this.xType === "time" && timeStep < DAY;

        let prepended = 0;
        let appended = 0;
        if (old.n === 0 || n === 0) {
            this.needsReset = true;
        } else if (!this.needsReset) {
            if (linear) {
                const oldLast = old.xs[old.n - 1];
                if (old.to >= oldLast && this.sorted) {
                    const delta = this.xs[n - 1] - oldLast;
                    this.from += delta;
                    this.to += delta;
                }
            } else {
                // locate the old first bar in the new data to detect prepends (history loaded)
                prepended = this.xType === "time" ? lowerBound(times, old.times[0]) : 0;
                if (this.xType === "time" && times[prepended] !== old.times[0]) {
                    // unrelated data (e.g. new symbol without resetKey): reset unless the old last bar is still present
                    const lastIdx = lowerBound(times, old.times[old.n - 1]);
                    if (times[lastIdx] !== old.times[old.n - 1]) {
                        this.needsReset = true;
                    }
                    prepended = 0;
                }
                const oldLast = old.n - 1;
                appended = n - 1 - (oldLast + prepended);
                const followRealtime = old.to >= oldLast;
                const shift = prepended + (followRealtime && appended > 0 ? appended : 0);
                this.from += shift;
                this.to += shift;
            }
            if (prepended > 0 || n !== old.n) {
                this.reached.start = false;
                this.reached.end = false;
            }
        }
        if (linear && this.autoX) {
            this.needsReset = true;
        }
        this.emit("datachange", { length: n, prepended, appended: Math.max(0, appended) });
        this.invalidate("layout");
    }

    // ---------------------------------------------------------------- panes, scales, registries

    /** Adds or updates a pane (called by `<Pane>`). */
    public registerPane(id: string, options: PaneOptions = {}) {
        const existing = this.panes.get(id);
        if (existing) {
            if (existing.options.size !== options.size || existing.options.height !== options.height) {
                existing.size = undefined; // an explicit new size wins over a dragged one
            }
            existing.options = options;
            existing.implicit = false;
        } else {
            this.panes.set(id, { id, seq: this.paneSeq++, options, collapsed: false, scales: new Map() });
        }
        const pane = this.panes.get(id)!;
        for (const [scaleId, scaleOptions] of Object.entries(options.scales ?? {})) {
            this.getScale(id, scaleId).options = scaleOptions;
        }
        for (const [scaleId, scale] of pane.scales) {
            if (!options.scales?.[scaleId]) {
                scale.options = {};
            }
        }
        this.invalidate("layout");
    }

    /** Creates a pane with default options if no `<Pane>` registered it (charts without explicit panes). */
    public ensurePane(id: string) {
        if (!this.panes.has(id)) {
            this.registerPane(id);
            this.panes.get(id)!.implicit = true;
        }
    }

    /** Removes a pane. */
    public unregisterPane(id: string) {
        this.panes.delete(id);
        this.invalidate("layout");
    }

    /** Ids of the panes in display order. */
    public get paneIds(): string[] {
        return this.orderedPanes().map((p) => p.id);
    }

    /** The price scale `scaleId` of a pane (created on first use). */
    public getScale(paneId: string, scaleId = "right"): PriceScale {
        const pane = this.panes.get(paneId);
        if (!pane) {
            return new PriceScale(scaleId);
        }
        let scale = pane.scales.get(scaleId);
        if (!scale) {
            scale = new PriceScale(scaleId);
            scale.options = pane.options.scales?.[scaleId] ?? {};
            scale.height = this.layout.panes.find((p) => p.id === paneId)?.height ?? 0;
            pane.scales.set(scaleId, scale);
        }
        return scale;
    }

    /** Options a pane was registered with. */
    public paneOptions(paneId: string): PaneOptions | undefined {
        return this.panes.get(paneId)?.options;
    }

    /** All price scales of a pane. */
    public paneScales(paneId: string): PriceScale[] {
        return [...(this.panes.get(paneId)?.scales.values() ?? [])];
    }

    /** Replaces the options of one price scale. */
    public setScaleOptions(paneId: string, scaleId: string, options: PriceScaleOptions) {
        this.getScale(paneId, scaleId).options = options;
        this.invalidate("scene");
    }

    /** Sets new stretch factors from a pixel delta on the separator above `paneId`. */
    public resizePane(paneId: string, dy: number) {
        const panes = this.layout.panes.filter((p) => !p.collapsed);
        const i = panes.findIndex((p) => p.id === paneId);
        if (i <= 0) {
            return;
        }
        const above = panes[i - 1];
        const below = panes[i];
        const min = 30;
        const d = clamp(dy, min - above.height, below.height - min);
        const total = panes.reduce((s, p) => s + p.height, 0) || 1;
        // keep the existing weight scale so panes added later (weight 1) still get their usual share
        const weights = panes.reduce((s, p) => s + this.paneWeight(p.id), 0);
        for (const p of panes) {
            const h = p.id === above.id ? p.height + d : p.id === below.id ? p.height - d : p.height;
            this.panes.get(p.id)!.size = (h / total) * weights;
        }
        this.invalidate("layout");
    }

    /** Current stretch weight of a pane (user-resized size, else the `size` option, else 1). */
    public paneWeight(paneId: string) {
        const pane = this.panes.get(paneId);
        return pane ? (pane.size ?? pane.options.size ?? 1) : 0;
    }

    /** Drops sizes set by dragging separators, restoring each pane's `size` / `height` options. */
    public resetPaneSizes() {
        for (const pane of this.panes.values()) {
            pane.size = undefined;
        }
        this.invalidate("layout");
    }

    /** Collapses a pane to a thin strip, or restores it. */
    public toggleCollapsePane(paneId: string) {
        const pane = this.panes.get(paneId);
        if (pane) {
            pane.collapsed = !pane.collapsed;
            this.invalidate("layout");
        }
    }

    /** Gives a pane the whole height, or restores the layout. */
    public toggleMaximizePane(paneId: string) {
        this.maximized = this.maximized === paneId ? null : paneId;
        this.invalidate("layout");
    }

    /** Registers a renderable; returns a function that removes it. */
    public addRenderable(r: Renderable<T>) {
        return this.track(this.renderables, r);
    }

    /** Registers an interactive hit target; returns a function that removes it. */
    public addHitTarget(t: HitTarget) {
        return this.track(this.hitTargets, t);
    }

    /** Reserves space for an axis (price axes are auto-sized); returns a function that removes it. */
    public registerAxis(axis: AxisRegistration) {
        return this.track(this.axes, axis);
    }

    /** Adds an item to a registry and relayouts; returns a function that removes it again. */
    private track<V>(registry: Set<V>, item: V) {
        registry.add(item);
        this.invalidate("layout");
        return () => {
            registry.delete(item);
            this.invalidate("layout");
        };
    }

    /** Hit targets ordered top-most first. */
    public get targets(): HitTarget[] {
        return [...this.hitTargets].sort((a, b) => b.zIndex - a.zIndex);
    }

    /** Registered price axes. */
    public get priceAxes(): AxisRegistration[] {
        return [...this.axes].filter((a) => a.kind === "price");
    }

    // ---------------------------------------------------------------- events

    /** Listens to a chart event; returns the unsubscribe function. */
    public on<K extends keyof ChartEventMap>(type: K, fn: (e: ChartEventMap[K]) => void): () => void {
        let set = this.listeners.get(type);
        if (!set) {
            set = new Set();
            this.listeners.set(type, set);
        }
        set.add(fn);
        return () => set!.delete(fn);
    }

    /** Dispatches a chart event to its listeners. */
    public emit<K extends keyof ChartEventMap>(type: K, e: ChartEventMap[K]) {
        const set = this.listeners.get(type);
        if (set) {
            for (const fn of [...set]) {
                fn(e);
            }
        }
    }

    /** Whether anything listens to an event type. */
    public hasListeners(type: keyof ChartEventMap) {
        return (this.listeners.get(type)?.size ?? 0) > 0;
    }

    // ---------------------------------------------------------------- coordinates

    /** Pixels per logical unit. */
    public get pxPerUnit() {
        return this.layout.plotWidth / (this.to - this.from || 1);
    }

    /** Pixel distance between neighbouring bars. */
    public get barSpacing() {
        return this.pxPerUnit * this.step;
    }

    /** Plot x (pixels) of a logical position. */
    public xOfLogical(l: number) {
        const x = (l - this.from) * this.pxPerUnit;
        return this.options.flipX ? this.layout.plotWidth - x : x;
    }

    /** Logical position at a plot x (pixels). */
    public logicalOfX(x: number) {
        const px = this.options.flipX ? this.layout.plotWidth - x : x;
        return this.from + px / this.pxPerUnit;
    }

    /** Plot x (pixels) of data index `i`. */
    public xOfIndex(i: number) {
        return this.xOfLogical(this.xs[i]);
    }

    /** Nearest data index at a plot x, or -1 without data. */
    public indexOfX(x: number) {
        const n = this.data.length;
        if (n === 0) {
            return -1;
        }
        const l = this.logicalOfX(x);
        if (this.sorted) {
            return nearestIndex(this.xs, l);
        }
        let best = 0;
        for (let i = 1; i < n; i++) {
            if (Math.abs(this.xs[i] - l) < Math.abs(this.xs[best] - l)) {
                best = i;
            }
        }
        return best;
    }

    /** Converts a data x value (timestamp / number) to a logical position, extrapolating beyond the data. */
    public logicalOfTime(t: number) {
        if (this.options.xMode === "linear" || this.xType === "category") {
            return t;
        }
        const times = this.times;
        const n = times.length;
        if (n < 2) {
            return 0;
        }
        const step = (times[n - 1] - times[0]) / (n - 1) || 1;
        if (t <= times[0]) {
            return (t - times[0]) / step;
        }
        if (t >= times[n - 1]) {
            return n - 1 + (t - times[n - 1]) / step;
        }
        const i = lowerBound(times, t);
        const a = times[i - 1];
        const b = times[i];
        return i - 1 + (t - a) / (b - a || 1);
    }

    /** Inverse of `logicalOfTime`. */
    public timeOfLogical(l: number) {
        if (this.options.xMode === "linear" || this.xType === "category") {
            return l;
        }
        const times = this.times;
        const n = times.length;
        if (n < 2) {
            return n === 1 ? times[0] : l;
        }
        const step = (times[n - 1] - times[0]) / (n - 1) || 1;
        if (l <= 0) {
            return times[0] + l * step;
        }
        if (l >= n - 1) {
            return times[n - 1] + (l - (n - 1)) * step;
        }
        const i = Math.floor(l);
        return times[i] + (l - i) * (times[i + 1] - times[i]);
    }

    /** Value to snap to (magnet) at a bar: the closest of the snap values in the pane to price `y`. */
    public snap(paneId: string, index: number, y: number, scaleId = "right"): number | undefined {
        const scale = this.getScale(paneId, scaleId);
        let best: number | undefined;
        let bestDist = Infinity;
        for (const r of this.renderables) {
            if (r.pane !== paneId || (r.scale ?? "right") !== scaleId || r.visible === false || !r.snapValues) {
                continue;
            }
            const base = r.baseValue?.(this.range.start);
            for (const v of r.snapValues(index) ?? []) {
                const d = Math.abs(scale.toY(v, base) - y);
                if (d < bestDist) {
                    bestDist = d;
                    best = v;
                }
            }
        }
        return best;
    }

    /** Pane-relative y of the axis labels other renderables draw on a scale (axes skip ticks underneath them). */
    public reservedAxisY(paneId: string, scaleId = "right"): number[] {
        const out: number[] = [];
        for (const r of this.renderables) {
            if (r.pane === paneId && r.visible !== false && r.axisLabels) {
                for (const label of r.axisLabels(paneId)) {
                    if (label.scale === scaleId && isFiniteNumber(label.y)) {
                        out.push(label.y);
                    }
                }
            }
        }
        return out;
    }

    /** Whether a series (by legend id) was hidden by the user. */
    public isHidden(id: string) {
        return this.hidden.has(id);
    }

    /** Shows / hides a series by its legend id (legend click, object tree eye button). */
    public setHidden(id: string, hidden = !this.hidden.has(id)) {
        if (hidden) {
            this.hidden.add(id);
        } else {
            this.hidden.delete(id);
        }
        this.dirty.state = true;
        this.invalidate("scene");
    }

    /** Legend items for every visible series in a pane at a bar (crosshair or last bar). */
    public legendItems(paneId: string, index: number): LegendItem[] {
        const out: LegendItem[] = [];
        // mount order (not zIndex), so a volume series drawn underneath doesn't become the legend's first row
        for (const r of this.renderables) {
            if (r.pane === paneId && r.legend) {
                const item = r.legend(index);
                if (item) {
                    out.push(this.hidden.has(item.id) ? { ...item, hidden: true } : item);
                }
            }
        }
        return out;
    }

    /** Renderables (sorted by zIndex). */
    public ordered(): Renderable<T>[] {
        if (!this.sortedRenderables) {
            this.sortedRenderables = [...this.renderables].sort((a, b) => a.zIndex - b.zIndex);
        }
        return this.sortedRenderables;
    }

    // ---------------------------------------------------------------- viewport

    /** The visible range: logical bounds and the first / last visible data index. */
    public get range(): VisibleRange {
        const n = this.data.length;
        if (n === 0) {
            return { from: this.from, to: this.to, start: 0, end: -1 };
        }
        if (!this.sorted) {
            return { from: this.from, to: this.to, start: 0, end: n - 1 };
        }
        const start = Math.max(0, lowerBound(this.xs, this.from) - 1);
        const end = Math.min(n - 1, upperBound(this.xs, this.to));
        return { from: this.from, to: this.to, start, end };
    }

    /** Shows a logical range (bar indices in index mode, x values in linear mode). */
    public setLogicalRange(from: number, to: number, fromUser = true) {
        if (!isFiniteNumber(from) || !isFiniteNumber(to) || to <= from) {
            return;
        }
        this.from = from;
        this.to = to;
        if (fromUser) {
            this.autoX = false;
        }
        this.constrain();
        this.invalidate("scene");
    }

    /** Shows the given data x range (Dates, timestamps or numbers). */
    public setVisibleRange(from: Date | number, to: Date | number) {
        this.setLogicalRange(this.logicalOfTime(toNumber(from)), this.logicalOfTime(toNumber(to)));
        this.needsReset = false;
    }

    /** Visible range in data x units. */
    public getVisibleRange() {
        return { from: this.timeOfLogical(this.from), to: this.timeOfLogical(this.to) };
    }

    /** Scrolls the viewport by a pixel distance (positive moves the content right). */
    public panBy(dxPixels: number) {
        const d = dxPixels / this.pxPerUnit;
        const sign = this.options.flipX ? -1 : 1;
        this.setLogicalRange(this.from - d * sign, this.to - d * sign);
    }

    /** Zooms around plot x (factor > 1 zooms out). */
    public zoomAt(factor: number, anchorX?: number) {
        if (this.layout.plotWidth <= 0) {
            return;
        }
        const anchor = this.zoomAnchor(anchorX);
        const span = this.to - this.from;
        const w = this.layout.plotWidth;
        const minSpan = (w / (this.options.maxBarSpacing ?? 60)) * this.step;
        const maxSpan = (w / (this.options.minBarSpacing ?? 0.5)) * this.step;
        let newSpan = span * factor;
        if (this.options.xMode !== "linear") {
            newSpan = clamp(newSpan, Math.min(minSpan, span), Math.max(maxSpan, span));
        }
        const r = (anchor - this.from) / span;
        this.setLogicalRange(anchor - r * newSpan, anchor + (1 - r) * newSpan);
    }

    /** Zooms in one step. */
    public zoomIn() {
        this.zoomAt(1 / 1.25);
    }

    /** Zooms out one step. */
    public zoomOut() {
        this.zoomAt(1.25);
    }

    /** Scrolls so the last bar is visible with the default right offset, keeping zoom. */
    public scrollToRealtime() {
        const n = this.data.length;
        if (n === 0) {
            return;
        }
        const span = this.to - this.from;
        const to = this.xs[n - 1] + this.rightOffset * this.step;
        this.setLogicalRange(to - span, to);
    }

    /** Resets zoom, pan and price scales to the initial view. */
    public resetView() {
        this.needsReset = true;
        this.autoX = true;
        for (const pane of this.panes.values()) {
            for (const s of pane.scales.values()) {
                s.resetAuto();
            }
        }
        this.invalidate("layout");
    }

    /** Fits all data in view. */
    public fitContent() {
        this.applyFit();
        this.invalidate("scene");
    }

    private get rightOffset() {
        return this.options.rightOffset ?? (this.xType === "time" && this.options.xMode !== "linear" ? 3 : 0);
    }

    private zoomAnchor(mouseX?: number) {
        const a = this.options.zoomAnchor ?? "mouse";
        if (typeof a === "function") {
            return a({ mouseX: mouseX ?? this.layout.plotWidth, engine: this });
        }
        const n = this.data.length;
        if (a === "lastVisible" && n > 0) {
            return Math.min(this.to, this.xs[Math.min(n - 1, this.range.end)]);
        }
        if (a === "right" || mouseX === undefined) {
            // keep the realtime edge fixed when it is visible
            return n > 0 && this.xs[n - 1] <= this.to && this.xs[n - 1] >= this.from
                ? this.to
                : this.logicalOfX(this.layout.plotWidth / 2);
        }
        return this.logicalOfX(mouseX);
    }

    private applyFit() {
        const n = this.data.length;
        if (n === 0) {
            this.from = 0;
            this.to = 1;
            return;
        }
        if (this.options.xMode === "linear") {
            let min = Infinity;
            let max = -Infinity;
            // renderables with their own x extent (e.g. horizontal bars) replace the data's x values
            const own = [...this.renderables].some((r) => r.visible !== false && r.xExtent?.());
            for (let i = 0; i < n && !own; i++) {
                const v = this.xs[i];
                if (isFiniteNumber(v)) {
                    min = Math.min(min, v);
                    max = Math.max(max, v);
                }
            }
            for (const r of this.renderables) {
                const e = r.visible !== false ? r.xExtent?.() : undefined;
                if (e) {
                    min = Math.min(min, e[0]);
                    max = Math.max(max, e[1]);
                }
            }
            if (!isFiniteNumber(min)) {
                min = 0;
                max = 1;
            }
            const pad = (max - min || Math.abs(max) || 1) * 0.04;
            this.from = min - pad;
            this.to = max + pad;
        } else {
            this.from = -0.5;
            this.to = n - 0.5 + this.rightOffset;
        }
    }

    private reset() {
        const n = this.data.length;
        const w = this.layout.plotWidth;
        this.needsReset = false;
        this.axisFloor = { left: 0, right: 0 };
        this.autoX = true;
        const dvr = this.options.defaultVisibleRange;
        if (dvr && n > 0) {
            const [a, b] = typeof dvr === "function" ? dvr(this.data) : dvr;
            this.from = this.logicalOfTime(toNumber(a));
            this.to = this.logicalOfTime(toNumber(b));
            this.autoX = false;
            return;
        }
        const view =
            this.options.initialView ?? (this.xType === "time" && this.options.xMode !== "linear" ? "latest" : "fit");
        if (view === "fit" || n === 0 || w <= 0) {
            this.applyFit();
            return;
        }
        const spacing = this.options.barSpacing ?? 8;
        this.to = this.xs[n - 1] + 0.5 + this.rightOffset;
        this.from = this.to - w / spacing;
    }

    private constrain() {
        const n = this.data.length;
        if (n === 0) {
            return;
        }
        const first = this.xs[0];
        const last = this.xs[n - 1];
        let { from, to } = this;
        const span = to - from;
        const c = this.options.clamp;
        if (typeof c === "function") {
            [from, to] = c([from, to], [first, last]);
        } else if (this.sorted) {
            // always keep a couple of bars on screen
            const keep = Math.min(span / 2, 2 * this.step);
            if (to < first + keep) {
                to = first + keep;
                from = to - span;
            }
            if (from > last - keep) {
                from = last - keep;
                to = from + span;
            }
            const half = this.options.xMode === "linear" ? 0 : 0.5;
            if ((c === true || c === "left" || c === "both") && from < first - half) {
                from = first - half;
                to = from + span;
            }
            if ((c === true || c === "right" || c === "both") && to > last + half + this.rightOffset * this.step) {
                to = last + half + this.rightOffset * this.step;
                from = Math.max(to - span, c === true || c === "both" ? first - half : -Infinity);
            }
        }
        this.from = from;
        this.to = to;
    }

    /** Called when a user gesture ends: fires onReachStart / onReachEnd once per crossing. */
    public settle() {
        const n = this.data.length;
        if (n === 0) {
            return;
        }
        const first = this.xs[0];
        const last = this.xs[n - 1];
        if (this.from < first && !this.reached.start) {
            this.reached.start = true;
            this.options.onReachStart?.(this.timeOfLogical(first));
        } else if (this.from >= first) {
            this.reached.start = false;
        }
        if (this.to > last + this.rightOffset * this.step + 0.5 && !this.reached.end) {
            this.reached.end = true;
            this.options.onReachEnd?.(this.timeOfLogical(last));
        } else if (this.to <= last) {
            this.reached.end = false;
        }
    }

    // ---------------------------------------------------------------- crosshair & sync

    /** Moves (or hides with null) the crosshair; broadcasts it to the sync group by default. */
    public setCrosshair(c: CrosshairState | null, broadcast = true) {
        const prev = this.crosshair;
        if (
            prev === c ||
            (prev && c && prev.x === c.x && prev.y === c.y && prev.paneId === c.paneId && prev.index === c.index)
        ) {
            return;
        }
        this.crosshair = c;
        this.dirty.state = true;
        this.invalidate("top");
        this.emit("crosshair", c);
        this.options.onCrosshairMove?.(c);
        if (broadcast && this.options.syncId && !this.syncing) {
            this.broadcast({ type: "crosshair", time: c && !c.synced ? this.timeOfLogical(c.logical) : null });
        }
    }

    private broadcast(m: SyncMessage) {
        if (this.options.syncId) {
            joinSync.publish(this.options.syncId, this, m);
        }
    }

    private receiveSync(m: SyncMessage) {
        this.syncing = true;
        try {
            if (m.type === "crosshair") {
                if (m.time === null) {
                    this.setCrosshair(null, false);
                } else {
                    const logical = this.logicalOfTime(m.time);
                    const index = this.sorted && this.data.length ? nearestIndex(this.xs, logical) : -1;
                    const x = this.xOfLogical(index >= 0 ? this.xs[index] : logical);
                    this.setCrosshair({ x, y: -1, paneId: null, index, logical, synced: true }, false);
                }
            } else if (m.type === "range" && this.options.syncRange) {
                this.setLogicalRange(this.logicalOfTime(m.from), this.logicalOfTime(m.to));
            }
        } finally {
            this.syncing = false;
        }
    }

    // ---------------------------------------------------------------- store (React)

    /** Subscribes to state snapshots (for `useSyncExternalStore`); returns the unsubscribe function. */
    public subscribe = (fn: () => void) => {
        this.storeListeners.add(fn);
        return () => {
            this.storeListeners.delete(fn);
        };
    };

    /** The current immutable state snapshot (layout, range, crosshair, theme). */
    public getState = (): ChartState => {
        if (!this.snapshot) {
            this.snapshot = {
                layout: this.layout,
                range: this.range,
                crosshair: this.crosshair,
                theme: this.theme,
                dataLength: this.data.length,
                version: this.version,
            };
        }
        return this.snapshot;
    };

    // ---------------------------------------------------------------- render loop

    /** Marks work for the next frame. "layout" implies "scene" implies "top". */
    public invalidate(level: "layout" | Layer = "scene") {
        if (level === "layout") {
            this.dirty.layout = true;
        }
        if (level !== "top") {
            this.dirty.scene = true;
            this.sortedRenderables = null;
        }
        this.dirty.top = true;
        if (!this.frame && typeof requestAnimationFrame !== "undefined") {
            this.frame = requestAnimationFrame(this.render);
        }
    }

    /** Renders synchronously (used by tests and screenshots). */
    public render = () => {
        this.frame = 0;
        if (this.width <= 0 || this.height <= 0) {
            return;
        }
        if (this.dirty.layout) {
            this.layoutNow();
        }
        if (this.needsReset && this.layout.plotWidth > 0) {
            this.reset();
        }
        if (this.dirty.scene) {
            this.ensureScales();
            // price axis width depends on the labels, which depend on the plot width: iterate until stable
            for (let pass = 0; pass < 3; pass++) {
                if (this.options.xMode === "linear" && this.autoX) {
                    this.applyFit();
                }
                this.autoscale();
                if (!this.updateAxisWidths()) {
                    break;
                }
                this.layoutNow();
            }
        }
        const rangeChanged = this.from !== this.lastRange.from || this.to !== this.lastRange.to;
        if (this.dirty.scene) {
            this.draw("scene");
        }
        if (this.dirty.top) {
            this.draw("top");
        }
        if (rangeChanged) {
            this.lastRange = { from: this.from, to: this.to };
            const range = this.range;
            this.emit("rangechange", range);
            this.options.onVisibleRangeChange?.(range);
            if (this.options.syncRange && !this.syncing) {
                const r = this.getVisibleRange();
                this.broadcast({ type: "range", from: r.from, to: r.to });
            }
        }
        if (this.dirty.scene || this.dirty.state || rangeChanged) {
            this.version++;
            this.snapshot = null;
            for (const fn of [...this.storeListeners]) {
                fn();
            }
        }
        this.dirty = { layout: false, scene: false, top: false, state: false };
    };

    private orderedPanes() {
        if (this.panes.size === 0) {
            this.ensurePane("main");
        }
        // implicit panes nothing draws on are dropped once explicit panes exist
        const used = new Set<string | null>(
            [...this.renderables].map((r) => r.pane).concat([...this.hitTargets].map((t) => t.pane)),
        );
        const hasExplicit = [...this.panes.values()].some((p) => !p.implicit);
        return [...this.panes.values()]
            .filter((p) => !p.implicit || !hasExplicit || used.has(p.id))
            .sort((a, b) => (a.options.order ?? a.seq) - (b.options.order ?? b.seq) || a.seq - b.seq);
    }

    private layoutNow() {
        const timeAxes = [...this.axes].filter((a) => a.kind === "time");
        const timeAxisHeight = timeAxes.length ? Math.max(...timeAxes.map((a) => a.size ?? 28)) : 0;
        const left = this.axisWidths.left;
        const right = this.axisWidths.right;
        const plotWidth = Math.max(0, this.width - left - right);
        const available = Math.max(0, this.height - timeAxisHeight);
        const panes = this.orderedPanes();
        const COLLAPSED = 24;
        const visible = panes.filter((p) => !this.maximized || p.id === this.maximized);
        const heights = new Map<string, number>();
        let remaining = available;
        let weights = 0;
        for (const p of visible) {
            if (p.collapsed) {
                heights.set(p.id, COLLAPSED);
                remaining -= COLLAPSED;
            } else if (p.options.height !== undefined && p.size === undefined) {
                heights.set(p.id, p.options.height);
                remaining -= p.options.height;
            } else {
                weights += p.size ?? p.options.size ?? 1;
            }
        }
        let top = 0;
        const layouts: PaneLayout[] = [];
        for (const p of panes) {
            const shown = visible.includes(p);
            let h = 0;
            if (shown) {
                h =
                    heights.get(p.id) ??
                    Math.max(
                        p.options.minHeight ?? 0,
                        (Math.max(0, remaining) * (p.size ?? p.options.size ?? 1)) / (weights || 1),
                    );
            }
            h = Math.round(h);
            layouts.push({
                id: p.id,
                top,
                height: h,
                left,
                width: plotWidth,
                collapsed: p.collapsed,
                maximized: this.maximized === p.id,
            });
            for (const s of p.scales.values()) {
                s.height = h;
            }
            top += h;
        }
        // absorb rounding into the last flexible pane so panes fill the space exactly
        if (layouts.length && top !== available) {
            const flexible = (l: PaneLayout) => l.height > 0 && !l.collapsed && heights.get(l.id) === undefined;
            const lastShown = [...layouts].reverse().find(flexible) ?? [...layouts].reverse().find((l) => l.height > 0);
            if (lastShown) {
                const i = layouts.indexOf(lastShown);
                const delta = available - top;
                layouts[i] = { ...lastShown, height: lastShown.height + delta };
                for (let j = i + 1; j < layouts.length; j++) {
                    layouts[j] = { ...layouts[j], top: layouts[j].top + delta };
                }
                for (const s of this.panes.get(lastShown.id)!.scales.values()) {
                    s.height = layouts[i].height;
                }
            }
        }
        this.layout = {
            width: this.width,
            height: this.height,
            plotLeft: left,
            plotWidth,
            axisLeft: left,
            axisRight: right,
            timeAxis: timeAxisHeight ? { top: available, height: timeAxisHeight } : null,
            panes: layouts,
        };
        this.dirty.state = true;
        this.dirty.layout = false;
    }

    private updateAxisWidths() {
        const ctx = this.contexts.scene;
        const widths = { left: 0, right: 0 };
        for (const axis of this.priceAxes) {
            const side = axis.side ?? "right";
            let w = axis.size;
            if (w === undefined) {
                // auto width only grows (until the view resets), so the plot doesn't shift sideways when labels
                // get shorter, e.g. after switching scale modes or panning from "10.00" back to "9.50"
                w = Math.max(50, this.axisFloor[side]);
                if (ctx && axis.paneId) {
                    ctx.font = font(this.theme);
                    const scale = this.getScale(axis.paneId, axis.scale);
                    for (const t of scale.ticks()) {
                        w = Math.max(w, Math.ceil(ctx.measureText(t.label).width) + 18);
                    }
                    const sample = scale.format(scale.untransform(scale.max));
                    w = Math.max(w, Math.ceil(ctx.measureText(sample).width) + 18);
                }
                this.axisFloor[side] = Math.max(this.axisFloor[side], w);
            }
            widths[side] = Math.max(widths[side], w);
        }
        const changed =
            Math.abs(widths.left - this.axisWidths.left) > 1 || Math.abs(widths.right - this.axisWidths.right) > 1;
        if (changed) {
            this.axisWidths = widths;
        }
        return changed;
    }

    /** Creates every scale referenced by renderables and axes before autoscaling. */
    private ensureScales() {
        for (const r of this.renderables) {
            if (r.pane !== null && this.panes.has(r.pane)) {
                this.getScale(r.pane, r.scale);
            }
        }
        for (const a of this.priceAxes) {
            if (a.paneId && this.panes.has(a.paneId)) {
                this.getScale(a.paneId, a.scale);
            }
        }
    }

    private autoscale() {
        const { start, end } = this.range;
        for (const pane of this.panes.values()) {
            for (const scale of pane.scales.values()) {
                const series = this.ordered().filter(
                    (r) => r.pane === pane.id && (r.scale ?? "right") === scale.id && r.visible !== false,
                );
                let base: number | undefined;
                for (const r of series) {
                    base = r.baseValue?.(start);
                    if (isFiniteNumber(base)) {
                        break;
                    }
                }
                scale.base = isFiniteNumber(base) && base !== 0 ? base : 1;
                const o = scale.options;
                if (o.categories) {
                    if (scale.isAuto) {
                        scale.min = -0.5;
                        scale.max = o.categories.length - 0.5;
                    }
                    continue;
                }
                if (o.domain) {
                    scale.setFixedDomain(o.domain);
                    continue;
                }
                if (!scale.isAuto) {
                    continue;
                }
                let min = Infinity;
                let max = -Infinity;
                const add = (v: number, b?: number) => {
                    const t = scale.transform(v, b);
                    if (isFiniteNumber(t)) {
                        min = Math.min(min, t);
                        max = Math.max(max, t);
                    }
                };
                if (o.extentsCalculator) {
                    const [a, b] = o.extentsCalculator({ data: this.data, start, end });
                    add(a);
                    add(b);
                } else if (o.extents) {
                    for (let i = start; i <= end; i++) {
                        const v = o.extents(this.data[i], i);
                        if (Array.isArray(v)) {
                            for (const each of v) {
                                add(each);
                            }
                        } else if (v !== undefined) {
                            add(v as number);
                        }
                    }
                } else {
                    for (const r of series) {
                        const e = r.extent?.(start, end);
                        if (e) {
                            const b = r.baseValue?.(start);
                            add(e[0], b);
                            add(e[1], b);
                        }
                    }
                }
                scale.fit(min, max);
            }
        }
    }

    private draw(layer: Layer) {
        const ctx = this.contexts[layer];
        if (!ctx) {
            return;
        }
        const { ratio, layout, theme } = this;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, this.width, this.height);
        if (layer === "scene") {
            ctx.fillStyle = theme.background;
            ctx.fillRect(0, 0, this.width, this.height);
        }
        const range = this.range;
        // hot path (called for every visible bar by every series): precomputed, no getters
        const xs = this.xs;
        const from = this.from;
        const k = this.pxPerUnit;
        const plotWidth = layout.plotWidth;
        const x = this.options.flipX
            ? (i: number) => plotWidth - (xs[i] - from) * k
            : (i: number) => (xs[i] - from) * k;
        const panes = new Map(layout.panes.map((p) => [p.id, p]));
        for (const r of this.ordered()) {
            if (r.layer !== layer || r.visible === false) {
                continue;
            }
            const pane = r.pane === null ? null : panes.get(r.pane);
            if (pane === undefined || (pane && pane.height <= 0)) {
                continue;
            }
            const scale = pane ? this.getScale(pane.id, r.scale) : undefined;
            const base = scale ? r.baseValue?.(range.start) : undefined;
            ctx.save();
            if (pane) {
                ctx.translate(pane.left, pane.top);
                if (r.clip !== false) {
                    ctx.beginPath();
                    ctx.rect(0, 0, pane.width, pane.height);
                    ctx.clip();
                }
            }
            const scope: DrawScope<T> = {
                engine: this,
                theme,
                data: this.data,
                start: range.start,
                end: range.end,
                x,
                barSpacing: this.barSpacing,
                y: scale ? (v: number) => scale.toY(v, base) : (v: number) => v,
                scale,
                pane,
                layout,
                crosshair: this.crosshair,
                ratio,
            };
            try {
                r.draw(ctx, scope);
            } catch (error) {
                console.error("[reincharts] renderable failed to draw", error);
            }
            ctx.restore();
        }
        if (layer === "scene") {
            ctx.fillStyle = theme.paneSeparator;
            // a separator only between two visible panes (not above the first visible one, e.g. when maximized)
            let above = false;
            for (const p of layout.panes) {
                if (p.height <= 0) {
                    continue;
                }
                if (above) {
                    ctx.fillRect(0, p.top, this.width, 1);
                }
                above = true;
            }
        }
    }

    // ---------------------------------------------------------------- x axis ticks

    /** Ticks for the x axis (time-aware, numeric or category). */
    public xTicks(minSpacing = 80): TimeTick[] {
        const { start, end } = this.range;
        const w = this.layout.plotWidth;
        if (this.xType === "time" && this.sorted) {
            return computeTimeTicks(this.times, start, end, (i) => this.xOfIndex(i), this.time, minSpacing).filter(
                (t) => t.x >= 0 && t.x <= w,
            );
        }
        if (this.xType === "category") {
            const every = Math.max(1, Math.ceil(minSpacing / 1.6 / Math.max(1e-9, this.barSpacing)));
            const out: TimeTick[] = [];
            for (let i = Math.max(0, start - (start % every)); i <= end; i += every) {
                const x = this.xOfIndex(i);
                if (x >= 0 && x <= w) {
                    out.push({ index: i, x, label: this.categories[i], weight: 0 });
                }
            }
            return out;
        }
        // numeric (or unsorted time) axis: nice ticks on the value domain
        const isLinear = this.options.xMode === "linear";
        const a = isLinear ? this.from : this.timeOfLogical(this.from);
        const b = isLinear ? this.to : this.timeOfLogical(this.to);
        const count = Math.max(2, Math.floor(w / minSpacing));
        if (this.xType === "time") {
            const step = niceTimeStep((b - a) / count);
            const out: TimeTick[] = [];
            for (let t = Math.ceil(a / step) * step; t <= b; t += step) {
                out.push({
                    index: -1,
                    x: this.xOfLogical(this.logicalOfTime(t)),
                    label: this.time.tickLabel(t, step >= DAY ? 70 : step >= MINUTE ? 30 : 10),
                    weight: 0,
                });
            }
            return out;
        }
        const decimals = decimalsFor(niceStep(b - a, count));
        return niceTicks(a, b, count).map((v) => ({
            index: -1,
            x: this.xOfLogical(this.logicalOfTime(v)),
            label: formatNumber(v, decimals),
            weight: 0,
        }));
    }

    /** Label for an x position (crosshair). */
    public formatX(index: number, logical?: number) {
        if (this.xType === "category") {
            return this.categories[index] ?? "";
        }
        const v = logical !== undefined && this.options.xMode === "linear" ? logical : this.times[index];
        if (!isFiniteNumber(v)) {
            return "";
        }
        if (this.xType === "time") {
            return this.time.format(v, this.intraday);
        }
        // one decimal more than the axis ticks show
        const tickStep = niceStep(Math.abs(this.to - this.from) || 1, Math.max(2, this.layout.plotWidth / 80));
        return formatNumber(v, Math.min(6, decimalsFor(tickStep) + 1));
    }

    /** Composites both canvases into a PNG data URL. */
    public screenshot(type = "image/png"): string {
        const canvas = document.createElement("canvas");
        canvas.width = this.width * this.ratio;
        canvas.height = this.height * this.ratio;
        const ctx = canvas.getContext("2d")!;
        for (const layer of ["scene", "top"] as const) {
            const c = this.contexts[layer]?.canvas;
            if (c) {
                ctx.drawImage(c, 0, 0);
            }
        }
        return canvas.toDataURL(type);
    }
}

const emptyLayout: Layout = {
    width: 0,
    height: 0,
    plotLeft: 0,
    plotWidth: 0,
    axisLeft: 0,
    axisRight: 0,
    timeAxis: null,
    panes: [],
};

const medianStep = (values: Float64Array) => {
    const n = Math.min(values.length - 1, 200);
    const diffs: number[] = [];
    for (let i = values.length - n; i < values.length; i++) {
        const d = values[i] - values[i - 1];
        if (d > 0) {
            diffs.push(d);
        }
    }
    diffs.sort((a, b) => a - b);
    return diffs[diffs.length >> 1] || 1;
};

const TIME_STEPS = [
    ...[1, 5, 15, 30].map((n) => n * SECOND),
    ...[1, 5, 15, 30].map((n) => n * MINUTE),
    ...[1, 3, 6, 12].map((n) => n * HOUR),
    ...[1, 2, 7, 30, 91, 182, 365].map((n) => n * DAY),
];

const niceTimeStep = (raw: number) => TIME_STEPS.find((s) => s >= raw) ?? Math.ceil(raw / (365 * DAY)) * 365 * DAY;
