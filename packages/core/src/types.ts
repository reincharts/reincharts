import type { ChartEngine } from "./engine";
import type { PriceScale, PriceScaleOptions } from "./priceScale";
import type { Theme } from "./theme";

export type Layer = "scene" | "top";

export interface PaneLayout {
    readonly id: string;
    /** Top of the pane in canvas pixels. */
    readonly top: number;
    readonly height: number;
    /** Left of the plot area in canvas pixels (= left price axis width). */
    readonly left: number;
    /** Width of the plot area. */
    readonly width: number;
    readonly collapsed: boolean;
    readonly maximized: boolean;
}

export interface Layout {
    readonly width: number;
    readonly height: number;
    readonly plotLeft: number;
    readonly plotWidth: number;
    readonly axisLeft: number;
    readonly axisRight: number;
    /** Time axis band (null when no XAxis is mounted). */
    readonly timeAxis: { readonly top: number; readonly height: number } | null;
    readonly panes: readonly PaneLayout[];
}

export interface CrosshairState {
    /** Plot-relative x / pane-relative y in pixels. */
    readonly x: number;
    readonly y: number;
    readonly paneId: string | null;
    /** Nearest data index. */
    readonly index: number;
    readonly logical: number;
    /** True when driven by another chart in the same sync group (no y line). */
    readonly synced?: boolean;
}

export interface VisibleRange {
    /** Logical bounds of the viewport (bar index units in index mode, x values in continuous mode). */
    readonly from: number;
    readonly to: number;
    /** First / last data index that intersects the viewport (inclusive). end < start when empty. */
    readonly start: number;
    readonly end: number;
}

/** Everything a renderable needs to draw one frame. */
export interface DrawScope<T = any> {
    readonly engine: ChartEngine<T>;
    readonly theme: Theme;
    readonly data: readonly T[];
    /** First / last visible data index (inclusive). */
    readonly start: number;
    readonly end: number;
    /** Pixel x (plot-relative) of data index i. */
    readonly x: (index: number) => number;
    /** Pixel spacing between neighbouring bars. */
    readonly barSpacing: number;
    /** Plot-relative pixel y of a raw value on this renderable's scale. */
    readonly y: (value: number) => number;
    /** The renderable's price scale (undefined for whole-canvas renderables). */
    readonly scale: PriceScale | undefined;
    readonly pane: PaneLayout | null;
    readonly layout: Layout;
    readonly crosshair: CrosshairState | null;
    readonly ratio: number;
}

export interface LegendValue {
    readonly label?: string;
    readonly value: string;
    readonly color?: string;
}

export interface LegendItem {
    readonly id: string;
    readonly name: string;
    readonly color?: string;
    /** True when the user hid the series (e.g. by clicking it in a legend). */
    readonly hidden?: boolean;
    readonly values: readonly LegendValue[];
}

export interface Renderable<T = any> {
    /** Pane id, or null to draw on the whole canvas (axes, watermark...). */
    pane: string | null;
    layer: Layer;
    zIndex: number;
    /** Clip to the pane plot area (default true for pane renderables). */
    clip?: boolean;
    visible?: boolean;
    /** Price scale id inside the pane. Default "right". */
    scale?: string;
    draw(ctx: CanvasRenderingContext2D, scope: DrawScope<T>): void;
    /** Raw [min, max] over bars start..end for autoscale. */
    extent?(start: number, end: number): readonly [number, number] | undefined;
    /** Base value for percent / indexed scale modes (usually the first visible close). */
    baseValue?(start: number): number | undefined;
    /** Values the magnet crosshair / drawings can snap to at a bar (e.g. OHLC). */
    snapValues?(index: number): readonly number[] | undefined;
    /** Name and values shown by legends at a bar. */
    legend?(index: number): LegendItem | undefined;
    /** Last value + color for price-axis last value labels. */
    lastValue?(): { value: number; color: string } | undefined;
    /** Raw [min, max] on the x axis (linear x mode), e.g. [0, maxValue] for horizontal bars. */
    xExtent?(): readonly [number, number] | undefined;
    /** Overrides which data index is "hovered" at a plot point (scatter: nearest point, horizontal bars: by y). */
    indexAt?(x: number, y: number): number | undefined;
    /**
     * Price axis labels this renderable draws (pane-relative y per scale), so axes can skip tick labels that
     * would end up underneath them (last value labels, price lines).
     */
    axisLabels?(paneId: string): readonly { readonly scale: string; readonly y: number }[];
}

export type Region =
    | { type: "plot"; paneId: string }
    | { type: "priceAxis"; paneId: string; side: "left" | "right" }
    | { type: "timeAxis" }
    | { type: "separator"; paneId: string }
    | { type: "none" };

export interface ChartPointerEvent {
    readonly type: string;
    readonly native: Event;
    /** Plot-relative x and pane-relative y. */
    readonly x: number;
    readonly y: number;
    readonly canvasX: number;
    readonly canvasY: number;
    readonly region: Region;
    readonly paneId: string | null;
    /** Nearest data index, or -1 without data. */
    readonly index: number;
    readonly logical: number;
    /** Time / x value under the pointer (extrapolated outside the data). */
    readonly time: number;
    /** Raw price under the pointer on a scale of the pane (default "right"). */
    price(scaleId?: string): number;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly altKey: boolean;
    readonly metaKey: boolean;
    readonly pointerType: string;
    /** Pixel distance from the drag start (drag events). */
    readonly dx: number;
    readonly dy: number;
    preventDefault(): void;
    readonly defaultPrevented: boolean;
}

export interface HitTarget {
    pane: string | null;
    zIndex: number;
    /** Return a CSS cursor (or true for "pointer") when the point hits this target. */
    hitTest(x: number, y: number): boolean | string | undefined;
    /** Return false to let the chart pan instead of dragging this target. */
    onPointerDown?(e: ChartPointerEvent): boolean | void;
    onDrag?(e: ChartPointerEvent): void;
    onDragEnd?(e: ChartPointerEvent): void;
    onClick?(e: ChartPointerEvent): void;
    onDoubleClick?(e: ChartPointerEvent): void;
    onContextMenu?(e: ChartPointerEvent): void;
    onHover?(hovered: boolean): void;
}

export type ChartEventType =
    | "pointerdown"
    | "pointermove"
    | "pointerup"
    | "pointerleave"
    | "drag"
    | "dragend"
    | "click"
    | "dblclick"
    | "contextmenu";

export interface ChartEventMap {
    pointerdown: ChartPointerEvent;
    pointermove: ChartPointerEvent;
    pointerup: ChartPointerEvent;
    pointerleave: ChartPointerEvent;
    drag: ChartPointerEvent;
    dragend: ChartPointerEvent;
    click: ChartPointerEvent;
    dblclick: ChartPointerEvent;
    contextmenu: ChartPointerEvent;
    keydown: KeyboardEvent;
    rangechange: VisibleRange;
    crosshair: CrosshairState | null;
    datachange: { readonly length: number; readonly prepended: number; readonly appended: number };
}

export interface PaneOptions {
    /** Stretch factor relative to other panes (default 1). */
    readonly size?: number;
    /** Fixed height in pixels (overrides size). */
    readonly height?: number;
    readonly minHeight?: number;
    /** Order among panes (default: mount order). */
    readonly order?: number;
    /**
     * Allow vertical panning once the price scale was adjusted manually (default true). While a scale autoscales,
     * dragging only pans in time, so the data always stays in view. Double-click the price axis to autoscale again.
     */
    readonly yPan?: boolean;
    /** Options per price scale id, e.g. `{ right: { mode: "log" }, volume: { margins: { top: 0.8, bottom: 0 } } }`. */
    readonly scales?: Readonly<Record<string, PriceScaleOptions>>;
}

export interface AxisRegistration {
    readonly kind: "price" | "time";
    readonly paneId?: string;
    readonly side?: "left" | "right";
    readonly scale?: string;
    /** Fixed width (price) or height (time). Price axes default to auto width. */
    readonly size?: number;
}
