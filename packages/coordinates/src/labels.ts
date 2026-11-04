import { clamp, font, type AxisRegistration, type ChartEngine, type Layout, type Theme } from "@reincharts/core";

/** Height in pixels of a price axis label box for a theme. */
export const axisLabelHeight = (theme: Theme) => theme.fontSize + 10;

export interface AxisLabelOptions {
    /** Left edge and width of the axis band (in the ctx coordinate system). */
    readonly left: number;
    readonly width: number;
    /** Vertical center of the label. */
    readonly y: number;
    /** Lower / upper bound for the label center (keeps it inside its pane). */
    readonly min?: number;
    readonly max?: number;
    readonly side: "left" | "right";
    readonly text: string;
    readonly background: string;
    readonly color: string;
    readonly theme: Theme;
}

/** Draws a label filling the price axis band at a y. Returns the label box. */
export const drawAxisLabel = (ctx: CanvasRenderingContext2D, o: AxisLabelOptions) => {
    const h = axisLabelHeight(o.theme);
    const lo = (o.min ?? -Infinity) + h / 2;
    const hi = (o.max ?? Infinity) - h / 2;
    const cy = lo <= hi ? clamp(o.y, lo, hi) : o.y;
    const top = Math.round(cy - h / 2);
    ctx.fillStyle = o.background;
    ctx.beginPath();
    ctx.roundRect(o.left, top, o.width, h, o.side === "right" ? [0, 2, 2, 0] : [2, 0, 0, 2]);
    ctx.fill();
    ctx.font = font(o.theme);
    ctx.fillStyle = o.color;
    ctx.textBaseline = "middle";
    ctx.textAlign = o.side === "right" ? "left" : "right";
    ctx.fillText(o.text, o.side === "right" ? o.left + 8 : o.left + o.width - 8, top + h / 2 + 0.5);
    return { top, height: h };
};

/** Price axes registered for a scale of a pane. */
export const axesOf = (engine: ChartEngine, paneId: string, scaleId?: string): AxisRegistration[] =>
    engine.priceAxes.filter((a) => a.paneId === paneId && (scaleId === undefined || (a.scale ?? "right") === scaleId));

/**
 * Left edge and width of a price axis band relative to the pane plot origin
 * (use `plotOrigin = layout.plotLeft` for whole-canvas coordinates).
 */
export const axisBand = (layout: Layout, side: "left" | "right", plotOrigin = 0) =>
    side === "right"
        ? { left: plotOrigin + layout.plotWidth, width: layout.axisRight }
        : { left: plotOrigin - layout.axisLeft, width: layout.axisLeft };
