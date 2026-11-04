import type { Theme } from "./theme";

/** Canvas helpers shared by series, axes, coordinates and drawings. */

export type LineDash = "solid" | "dashed" | "dotted" | "longDash" | readonly number[];

/** Canvas dash pattern for a `LineDash` style at a line width. */
export const dashArray = (dash: LineDash | undefined, width = 1): number[] => {
    if (Array.isArray(dash)) {
        return dash as number[];
    }
    switch (dash) {
        case "dashed":
            return [4 * width, 4 * width];
        case "dotted":
            return [width, 2 * width];
        case "longDash":
            return [8 * width, 6 * width];
        default:
            return [];
    }
};

export interface StrokeStyle {
    color: string;
    width?: number;
    dash?: LineDash;
}

/** Sets stroke color, width and dash on a context. */
export const applyStroke = (ctx: CanvasRenderingContext2D, { color, width = 1, dash }: StrokeStyle) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dashArray(dash, width));
};

/** Aligns a coordinate to the pixel grid so 1px lines are crisp. */
export const crisp = (v: number, width = 1) => (width % 2 === 1 ? Math.round(v) + 0.5 : Math.round(v));

/** CSS font string from the theme (`size` and `weight` optional). */
export const font = (theme: Theme, size = theme.fontSize, weight = "normal") =>
    `${weight} ${size}px ${theme.fontFamily}`;

/** Strokes a crisp horizontal line at y from x1 to x2. */
export const horizontalLine = (ctx: CanvasRenderingContext2D, y: number, x1: number, x2: number) => {
    const cy = crisp(y, ctx.lineWidth);
    ctx.beginPath();
    ctx.moveTo(x1, cy);
    ctx.lineTo(x2, cy);
    ctx.stroke();
};

/** Strokes a crisp vertical line at x from y1 to y2. */
export const verticalLine = (ctx: CanvasRenderingContext2D, x: number, y1: number, y2: number) => {
    const cx = crisp(x, ctx.lineWidth);
    ctx.beginPath();
    ctx.moveTo(cx, y1);
    ctx.lineTo(cx, y2);
    ctx.stroke();
};

export interface LabelOptions {
    text: string;
    x: number;
    y: number;
    background: string;
    color: string;
    font: string;
    align?: "left" | "center" | "right";
    baseline?: "top" | "middle" | "bottom";
    paddingX?: number;
    paddingY?: number;
    radius?: number;
    border?: string;
}

/** Draws a text label inside a filled rounded box; returns the box rect. */
export const drawLabel = (ctx: CanvasRenderingContext2D, o: LabelOptions) => {
    const { paddingX = 6, paddingY = 3, radius = 2, align = "left", baseline = "middle" } = o;
    ctx.font = o.font;
    const textWidth = ctx.measureText(o.text).width;
    const fontSize = parseFloat(o.font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? "11");
    const w = textWidth + paddingX * 2;
    const h = fontSize + paddingY * 2 + 2;
    const left = align === "left" ? o.x : align === "center" ? o.x - w / 2 : o.x - w;
    const top = baseline === "top" ? o.y : baseline === "middle" ? o.y - h / 2 : o.y - h;
    ctx.fillStyle = o.background;
    ctx.beginPath();
    ctx.roundRect(left, top, w, h, radius);
    ctx.fill();
    if (o.border) {
        ctx.strokeStyle = o.border;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.stroke();
    }
    ctx.fillStyle = o.color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(o.text, left + paddingX, top + h / 2 + 0.5);
    return { left, top, width: w, height: h };
};

/** Picks black or white text for a given background color. */
export const contrastText = (background: string) => {
    const m = background.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
    if (!m) {
        return "#ffffff";
    }
    const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
    return r * 0.299 + g * 0.587 + b * 0.114 > 160 ? "#131722" : "#ffffff";
};

/** Returns a color with the given alpha. Accepts #rgb, #rrggbb and rgb()/rgba(). */
export const withAlpha = (color: string, alpha: number) => {
    if (color.startsWith("#")) {
        let hex = color.slice(1);
        if (hex.length === 3) {
            hex = [...hex].map((c) => c + c).join("");
        }
        const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    const m = color.match(/rgba?\(([^)]+)\)/);
    if (m) {
        const [r, g, b] = m[1].split(",").map((s) => s.trim());
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
};
