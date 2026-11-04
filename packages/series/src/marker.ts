/** Marker shapes for scatter / bubble series, SAR dots and annotations. */
export type MarkerShape = "circle" | "square" | "diamond" | "triangle" | "triangleDown" | "cross" | "x" | "star";

const SQRT3 = Math.sqrt(3);

const polygon = (path: Path2D | CanvasRenderingContext2D, x: number, y: number, pts: readonly number[]) => {
    path.moveTo(x + pts[0], y + pts[1]);
    for (let k = 2; k < pts.length; k += 2) {
        path.lineTo(x + pts[k], y + pts[k + 1]);
    }
    path.closePath();
};

/** Plus-shaped polygon with arms of half-length r and half-thickness t, optionally rotated 45°. */
const plus = (r: number, t: number, rotate: boolean) => {
    const pts = [-t, -r, t, -r, t, -t, r, -t, r, t, t, t, t, r, -t, r, -t, t, -r, t, -r, -t, -t, -t];
    if (!rotate) {
        return pts;
    }
    const c = Math.SQRT1_2;
    const out: number[] = [];
    for (let k = 0; k < pts.length; k += 2) {
        out.push((pts[k] - pts[k + 1]) * c, (pts[k] + pts[k + 1]) * c);
    }
    return out;
};

/**
 * Adds a closed marker sub-path centred on (x, y) to a path or context. `size` is the marker's
 * outer diameter in pixels. Every shape is a filled outline so markers can be batched per color.
 */
export const traceMarker = (
    path: Path2D | CanvasRenderingContext2D,
    shape: MarkerShape,
    x: number,
    y: number,
    size: number,
) => {
    const r = size / 2;
    switch (shape) {
        case "square":
            path.rect(x - r, y - r, size, size);
            return;
        case "diamond":
            polygon(path, x, y, [0, -r * 1.2, r * 1.2, 0, 0, r * 1.2, -r * 1.2, 0]);
            return;
        case "triangle":
        case "triangleDown": {
            // equilateral triangle with its centroid on (x, y)
            const s = shape === "triangle" ? 1 : -1;
            const h = r * 1.15;
            polygon(path, x, y, [0, -s * h, (h * SQRT3) / 2, (s * h) / 2, (-h * SQRT3) / 2, (s * h) / 2]);
            return;
        }
        case "cross":
        case "x":
            polygon(path, x, y, plus(r, Math.max(0.75, r / 3.5), shape === "x"));
            return;
        case "star": {
            const pts: number[] = [];
            for (let k = 0; k < 10; k++) {
                const a = (k * Math.PI) / 5 - Math.PI / 2;
                const rr = k % 2 === 0 ? r * 1.15 : r * 0.5;
                pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            polygon(path, x, y, pts);
            return;
        }
        default:
            path.moveTo(x + r, y);
            path.arc(x, y, r, 0, Math.PI * 2);
            path.closePath();
    }
};

export interface MarkerStyle {
    /** Fill color (omit for an outline-only marker). */
    readonly fill?: string;
    /** Outline color (omit for no outline). */
    readonly stroke?: string;
    /** Outline width. Default 1. */
    readonly strokeWidth?: number;
}

/**
 * Draws one marker immediately (convenience for annotations; series batch with `traceMarker`).
 * Without a style it is filled with the current `ctx.fillStyle`.
 */
export const drawMarker = (
    ctx: CanvasRenderingContext2D,
    shape: MarkerShape,
    x: number,
    y: number,
    size: number,
    { fill, stroke, strokeWidth = 1 }: MarkerStyle = {},
) => {
    ctx.beginPath();
    traceMarker(ctx, shape, x, y, size);
    if (fill || !stroke) {
        if (fill) {
            ctx.fillStyle = fill;
        }
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.setLineDash([]);
        ctx.stroke();
    }
};
