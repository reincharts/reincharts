import { withAlpha } from "@reincharts/core";
import { fillPolygon, polyline, strokeOf, text } from "../draw";
import { inPolygon, inRect, nearPolyline, TOLERANCE } from "../geometry";
import { icons } from "../icons";
import type { Geometry, Pt } from "../types";
import { defineTool } from "./common";

const shapeFill = (g: Geometry) => g.drawing.style.fill ?? withAlpha(g.color, 0.15);

const corners = (a: Pt, b: Pt): Pt[] => [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }];

/** Rectangle handles: 0 a, 1 b, 2 (b.x, a.y), 3 (a.x, b.y), 4..7 mid top / bottom / left / right. */
const rectHandles = (a: Pt, b: Pt): Pt[] => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    return [
        a,
        b,
        { x: b.x, y: a.y },
        { x: a.x, y: b.y },
        { x: mx, y: a.y },
        { x: mx, y: b.y },
        { x: a.x, y: my },
        { x: b.x, y: my },
    ];
};

const dragRect = (a: Pt, b: Pt, i: number, p: Pt): Pt[] => {
    switch (i) {
        case 0:
            return [p, b];
        case 1:
            return [a, p];
        case 2:
            return [
                { x: a.x, y: p.y },
                { x: p.x, y: b.y },
            ];
        case 3:
            return [
                { x: p.x, y: a.y },
                { x: b.x, y: p.y },
            ];
        case 4:
            return [{ x: a.x, y: p.y }, b];
        case 5:
            return [a, { x: b.x, y: p.y }];
        case 6:
            return [{ x: p.x, y: a.y }, b];
        default:
            return [a, { x: p.x, y: b.y }];
    }
};

/** Centered multi-line text inside a box (rectangle / ellipse text). */
const centerText = (ctx: CanvasRenderingContext2D, g: Geometry, a: Pt, b: Pt) => {
    const value = g.drawing.style.text;
    if (!value) {
        return;
    }
    const size = g.drawing.style.fontSize ?? 13;
    const color = g.drawing.style.textColor ?? g.color;
    const lines = value.split("\n");
    const cy = (a.y + b.y) / 2 - ((lines.length - 1) * (size + 4)) / 2;
    lines.forEach((l, i) => text(ctx, g, l, (a.x + b.x) / 2, cy + i * (size + 4), color, "center", "middle", size));
};

export const rectangle = defineTool({
    type: "rectangle",
    label: "Rectangle",
    group: "shapes",
    icon: icons.rectangle,
    points: 2,
    defaults: { width: 1 },
    styleControls: ["color", "width", "dash", "fill", "text"],
    draw(ctx, g) {
        const [a, b] = g.points;
        const pts = corners(a, b);
        fillPolygon(ctx, pts, shapeFill(g));
        strokeOf(ctx, g);
        polyline(ctx, pts, true);
        ctx.stroke();
        centerText(ctx, g, a, b);
    },
    hitTest(g, x, y) {
        const [a, b] = g.points;
        return inRect(x, y, a, b, TOLERANCE);
    },
    handles: (g) => rectHandles(g.points[0], g.points[1]),
    dragHandle: (g, i, p) => dragRect(g.points[0], g.points[1], i, p),
});

export const ellipse = defineTool({
    type: "ellipse",
    label: "Ellipse",
    group: "shapes",
    icon: icons.ellipse,
    points: 2,
    defaults: { width: 1 },
    styleControls: ["color", "width", "dash", "fill", "text"],
    draw(ctx, g) {
        const [a, b] = g.points;
        ctx.beginPath();
        ctx.ellipse(
            (a.x + b.x) / 2,
            (a.y + b.y) / 2,
            Math.abs(b.x - a.x) / 2,
            Math.abs(b.y - a.y) / 2,
            0,
            0,
            Math.PI * 2,
        );
        ctx.fillStyle = shapeFill(g);
        ctx.fill();
        strokeOf(ctx, g);
        ctx.stroke();
        centerText(ctx, g, a, b);
    },
    hitTest(g, x, y) {
        const [a, b] = g.points;
        const rx = Math.abs(b.x - a.x) / 2 + TOLERANCE;
        const ry = Math.abs(b.y - a.y) / 2 + TOLERANCE;
        const dx = (x - (a.x + b.x) / 2) / rx;
        const dy = (y - (a.y + b.y) / 2) / ry;
        return dx * dx + dy * dy <= 1;
    },
    handles: (g) => rectHandles(g.points[0], g.points[1]).slice(4),
    dragHandle: (g, i, p) => dragRect(g.points[0], g.points[1], i + 4, p),
});

export const triangle = defineTool({
    type: "triangle",
    label: "Triangle",
    group: "shapes",
    icon: icons.triangle,
    points: 3,
    defaults: { width: 1 },
    styleControls: ["color", "width", "dash", "fill"],
    draw(ctx, g) {
        if (g.points.length > 2) {
            fillPolygon(ctx, g.points, shapeFill(g));
        }
        strokeOf(ctx, g);
        polyline(ctx, g.points, true);
        ctx.stroke();
    },
    hitTest: (g, x, y) => nearPolyline(x, y, g.points, true) || (g.points.length > 2 && inPolygon(x, y, g.points)),
});

export const path = defineTool({
    type: "path",
    label: "Path",
    group: "shapes",
    icon: icons.path,
    points: "multi",
    defaults: { width: 2 },
    draw(ctx, g) {
        strokeOf(ctx, g);
        polyline(ctx, g.points);
        ctx.stroke();
    },
    hitTest: (g, x, y) => nearPolyline(x, y, g.points),
});

export const brush = defineTool({
    type: "brush",
    label: "Brush",
    group: "freehand",
    icon: icons.brush,
    points: "multi",
    freehand: true,
    snapX: false,
    defaults: { width: 2 },
    styleControls: ["color", "width", "fill"],
    draw(ctx, g) {
        const pts = g.points;
        if (g.drawing.style.fill && pts.length > 2) {
            fillPolygon(ctx, pts, g.drawing.style.fill);
        }
        strokeOf(ctx, g);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        // quadratic smoothing through midpoints
        for (let i = 1; i < pts.length - 1; i++) {
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
        ctx.lineJoin = "miter";
        ctx.lineCap = "butt";
    },
    hitTest: (g, x, y) => nearPolyline(x, y, g.points, false, TOLERANCE + (g.drawing.style.width ?? 2) / 2),
    handles: (g) => (g.points.length ? [g.points[0], g.points[g.points.length - 1]] : []),
    dragHandle(g, i, p) {
        const pts = [...g.points];
        pts[i === 0 ? 0 : pts.length - 1] = p;
        return pts;
    },
});

/** Thick, translucent freehand strokes for marking up a chart. */
export const highlighter = defineTool({
    ...brush,
    type: "highlighter",
    label: "Highlighter",
    icon: icons.highlighter,
    defaults: { width: 14, color: "rgba(255, 193, 7, 0.4)" },
    styleControls: ["color", "width"],
});

export const shapeTools = [rectangle, ellipse, triangle, path];

/** Freehand tools: brush and highlighter. */
export const freehandTools = [brush, highlighter];
