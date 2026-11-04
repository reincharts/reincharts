import { applyStroke, contrastText, font, horizontalLine } from "@reincharts/core";
import { fillPolygon, strokeOf } from "../draw";
import { nearSegment, TOLERANCE } from "../geometry";
import { icons } from "../icons";
import type { Geometry, Pt } from "../types";
import { defineTool, measureText } from "./common";

const PAD = 8;

/** Layout of a multi-line text box whose top-left is `at`. */
export const textBox = (g: Geometry, at: Pt, value: string, size: number, pad = PAD) => {
    const f = font(g.theme, size, g.drawing.style.bold ? "bold" : "normal");
    const lines = value.split("\n");
    const lh = Math.round(size * 1.3);
    const width = Math.max(...lines.map((l) => measureText(f, l))) + pad * 2;
    const height = lines.length * lh + pad * 2 - (lh - size) + 2;
    return { font: f, lines, lh, left: at.x, top: at.y, width, height, pad };
};

type Box = ReturnType<typeof textBox>;

const inBox = (b: Box, x: number, y: number, slack = 0) =>
    x >= b.left - slack && x <= b.left + b.width + slack && y >= b.top - slack && y <= b.top + b.height + slack;

const fillText = (ctx: CanvasRenderingContext2D, b: Box, color: string) => {
    ctx.font = b.font;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    b.lines.forEach((l, i) => ctx.fillText(l, b.left + b.pad, b.top + b.pad + 1 + i * b.lh));
};

const roundBox = (ctx: CanvasRenderingContext2D, b: Box, fill: string | undefined, border?: string) => {
    ctx.beginPath();
    ctx.roundRect(b.left, b.top, b.width, b.height, 4);
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (border) {
        applyStroke(ctx, { color: border, width: 1 });
        ctx.stroke();
    }
};

const textOf = (g: Geometry) => g.drawing.style.text || "Text";

const textToolBox = (g: Geometry) =>
    textBox(g, g.points[0], textOf(g), g.drawing.style.fontSize ?? 14, g.drawing.style.fill ? PAD : 2);

export const textTool = defineTool({
    type: "text",
    label: "Text",
    group: "annotation",
    icon: icons.text,
    points: 1,
    snapX: false,
    editableText: true,
    defaults: { fontSize: 14, text: "Text" },
    styleControls: ["color", "fill", "fontSize", "text"],
    draw(ctx, g, d, state) {
        const b = textToolBox(g);
        roundBox(ctx, b, d.style.fill, d.style.borderColor as string | undefined);
        fillText(ctx, b, d.style.textColor ?? g.color);
        if (state.selected || state.hovered) {
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = g.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(
                Math.round(b.left) - 2.5,
                Math.round(b.top) - 2.5,
                Math.round(b.width) + 5,
                Math.round(b.height) + 5,
            );
        }
    },
    hitTest: (g, x, y) => inBox(textToolBox(g), x, y, 3),
    handles: () => [],
});

const calloutBox = (g: Geometry) => textBox(g, g.points[1] ?? g.points[0], textOf(g), g.drawing.style.fontSize ?? 14);

export const callout = defineTool({
    type: "callout",
    label: "Callout",
    group: "annotation",
    icon: icons.callout,
    points: 2,
    editableText: true,
    defaults: { fontSize: 14, text: "Note" },
    styleControls: ["color", "fontSize", "text"],
    textAnchor: (g) => g.points[1] ?? g.points[0],
    draw(ctx, g, d) {
        const [anchor] = g.points;
        const b = calloutBox(g);
        const fill = d.style.fill ?? g.color;
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        const len = Math.hypot(anchor.x - cx, anchor.y - cy) || 1;
        const px = (-(anchor.y - cy) / len) * 10;
        const py = ((anchor.x - cx) / len) * 10;
        fillPolygon(ctx, [anchor, { x: cx + px, y: cy + py }, { x: cx - px, y: cy - py }], fill);
        roundBox(ctx, b, fill);
        fillText(ctx, b, d.style.textColor ?? contrastText(fill));
    },
    hitTest(g, x, y) {
        const b = calloutBox(g);
        return (
            inBox(b, x, y, 2) || nearSegment(x, y, g.points[0], { x: b.left + b.width / 2, y: b.top + b.height / 2 })
        );
    },
});

const priceLabelBox = (g: Geometry) => {
    const p = g.points[0];
    const b = textBox(
        g,
        { x: 0, y: 0 },
        g.drawing.style.text || g.formatPrice(g.drawing.points[0].price),
        g.drawing.style.fontSize ?? 12,
        6,
    );
    return { ...b, left: p.x - 6, top: p.y - 12 - b.height };
};

export const priceLabel = defineTool({
    type: "priceLabel",
    label: "Price Label",
    group: "annotation",
    icon: icons.priceLabel,
    points: 1,
    defaults: { fontSize: 12 },
    styleControls: ["color", "fontSize"],
    draw(ctx, g, d) {
        const p = g.points[0];
        const b = priceLabelBox(g);
        const fill = d.style.fill ?? g.color;
        fillPolygon(ctx, [p, { x: p.x + 2, y: b.top + b.height - 1 }, { x: p.x + 12, y: b.top + b.height - 1 }], fill);
        roundBox(ctx, b, fill);
        fillText(ctx, b, d.style.textColor ?? contrastText(fill));
    },
    hitTest: (g, x, y) =>
        inBox(priceLabelBox(g), x, y, 2) || Math.hypot(x - g.points[0].x, y - g.points[0].y) <= TOLERANCE,
});

const CLOSE = 20;

const priceLineBox = (g: Geometry) => {
    const value = g.drawing.style.text ?? "Alert";
    const b = textBox(g, { x: 0, y: 0 }, value, g.drawing.style.fontSize ?? 12, 8);
    const h = Math.max(22, b.height);
    return { ...b, left: 16, top: Math.round(g.points[0].y - h / 2), height: h, width: b.width + CLOSE };
};

/** Draggable horizontal price line with a label and a close button (orders, alerts). */
export const priceLine = defineTool({
    type: "priceLine",
    label: "Price Line",
    group: "annotation",
    icon: icons.priceLine,
    points: 1,
    defaults: { width: 1, dash: "dashed", text: "Alert" },
    styleControls: ["color", "width", "dash", "text"],
    draw(ctx, g, d) {
        const { y } = g.points[0];
        const b = priceLineBox(g);
        strokeOf(ctx, g);
        horizontalLine(ctx, y, 0, g.width);
        roundBox(ctx, b, g.theme.background, g.color);
        ctx.font = b.font;
        ctx.fillStyle = d.style.textColor ?? g.color;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(b.lines.join(" "), b.left + b.pad, y + 0.5);
        // close button
        const cx = b.left + b.width - CLOSE / 2 - 2;
        applyStroke(ctx, { color: g.color, width: 1 });
        ctx.beginPath();
        ctx.moveTo(b.left + b.width - CLOSE, b.top + 4);
        ctx.lineTo(b.left + b.width - CLOSE, b.top + b.height - 4);
        ctx.moveTo(cx - 3.5, y - 3.5);
        ctx.lineTo(cx + 3.5, y + 3.5);
        ctx.moveTo(cx + 3.5, y - 3.5);
        ctx.lineTo(cx - 3.5, y + 3.5);
        ctx.stroke();
    },
    hitTest(g, x, y) {
        const b = priceLineBox(g);
        if (inBox(b, x, y)) {
            return x >= b.left + b.width - CLOSE ? "remove" : "body";
        }
        return Math.abs(y - g.points[0].y) <= TOLERANCE;
    },
    handles: () => [],
    crossValue: (d) => d.points[0].price,
    axisLabels: (d) => ({ prices: [d.points[0].price] }),
});

export const annotationTools = [textTool, callout, priceLabel, priceLine];
