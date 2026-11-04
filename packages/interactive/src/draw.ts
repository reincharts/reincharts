import { applyStroke, drawLabel, font, withAlpha, contrastText } from "@reincharts/core";
import type { Geometry, Pt } from "./types";

/** Canvas helpers shared by the built-in tools (also handy for custom tools). */

/** Applies the drawing's color / width / dash. */
export const strokeOf = (
    ctx: CanvasRenderingContext2D,
    g: Geometry,
    color = g.color,
    width = g.drawing.style.width ?? 1,
) => applyStroke(ctx, { color, width, dash: g.drawing.style.dash });

/** Strokes a straight line between two points (uses the current stroke style). */
export const segment = (ctx: CanvasRenderingContext2D, a: Pt, b: Pt) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
};

/** Traces a polyline through points into the current path. */
export const polyline = (ctx: CanvasRenderingContext2D, pts: readonly Pt[], closed = false) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    if (closed) {
        ctx.closePath();
    }
};

/** Fills a closed polygon through points with a color. */
export const fillPolygon = (ctx: CanvasRenderingContext2D, pts: readonly Pt[], color: string) => {
    polyline(ctx, pts, true);
    ctx.fillStyle = color;
    ctx.fill();
};

/** Filled arrow head at `to`, pointing away from `from`. */
export const arrowHead = (ctx: CanvasRenderingContext2D, from: Pt, to: Pt, color: string, size = 10) => {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 7), to.y - size * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 7), to.y - size * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
};

/** A filled label box. */
export const label = (
    ctx: CanvasRenderingContext2D,
    g: Geometry,
    text: string,
    x: number,
    y: number,
    o: {
        background?: string;
        color?: string;
        align?: "left" | "center" | "right";
        baseline?: "top" | "middle" | "bottom";
        size?: number;
    } = {},
) => {
    const background = o.background ?? g.color;
    return drawLabel(ctx, {
        text,
        x,
        y,
        background,
        color: o.color ?? contrastText(background),
        font: font(g.theme, o.size ?? g.theme.fontSize + 1),
        align: o.align ?? "center",
        baseline: o.baseline ?? "middle",
        paddingX: 7,
        paddingY: 4,
        radius: 4,
    });
};

/** Multi-line label box (measure / position stats). Returns the box. */
export const multiLabel = (
    ctx: CanvasRenderingContext2D,
    g: Geometry,
    lines: readonly string[],
    x: number,
    y: number,
    background: string,
    baseline: "top" | "bottom" | "middle" = "top",
) => {
    const size = g.theme.fontSize + 1;
    ctx.font = font(g.theme, size);
    const lh = size + 5;
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 16;
    const h = lines.length * lh + 8;
    const top = baseline === "top" ? y : baseline === "bottom" ? y - h : y - h / 2;
    // keep the box inside the pane
    x = Math.max(w / 2 + 2, Math.min(g.width - w / 2 - 2, x));
    ctx.fillStyle = background;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, top, w, h, 4);
    ctx.fill();
    ctx.fillStyle = contrastText(background);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((l, i) => ctx.fillText(l, x, top + 4 + lh * i + lh / 2 + 0.5));
    return { left: x - w / 2, top, width: w, height: h };
};

/** Plain text (no box). */
export const text = (
    ctx: CanvasRenderingContext2D,
    g: Geometry,
    value: string,
    x: number,
    y: number,
    color: string,
    align: CanvasTextAlign = "left",
    baseline: CanvasTextBaseline = "middle",
    size = g.theme.fontSize,
    halo = true,
) => {
    ctx.font = font(g.theme, size);
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    if (halo) {
        // keeps labels readable over candles
        ctx.setLineDash([]);
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = withAlpha(g.theme.background, 0.85);
        ctx.strokeText(value, x, y);
        ctx.lineJoin = "miter";
    }
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
};

/** Translucent version of the drawing color for fills. */
export const fillOf = (g: Geometry, alpha = 0.15) => g.drawing.style.fill ?? withAlpha(g.color, alpha);

/** Draws one edit handle. */
export const handle = (ctx: CanvasRenderingContext2D, p: Pt, fill: string, stroke: string, active = false) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, active ? 6 : 5, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = stroke;
    ctx.stroke();
};
