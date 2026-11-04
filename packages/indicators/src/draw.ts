import { applyStroke, dashArray, horizontalLine, type LineDash } from "@reincharts/core";
import { tracePath } from "@reincharts/series";

/** Screen point or gap. */
export type Point = readonly [number, number] | null;

/** Strokes a polyline (gaps break it). */
export const strokeLine = (
    ctx: CanvasRenderingContext2D,
    pts: readonly Point[],
    color: string,
    width: number,
    dash: LineDash | undefined,
    step = false,
) => {
    applyStroke(ctx, { color, width, dash });
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    tracePath(ctx, pts, step ? "step" : "linear");
    ctx.stroke();
};

/** Fills the area under each contiguous run of points down to `baseY`. */
export const fillArea = (ctx: CanvasRenderingContext2D, pts: readonly Point[], baseY: number, color: string) => {
    const path = new Path2D();
    let run: (readonly [number, number])[] = [];
    const flush = () => {
        if (run.length > 1) {
            path.moveTo(run[0][0], baseY);
            for (const [x, y] of run) {
                path.lineTo(x, y);
            }
            path.lineTo(run[run.length - 1][0], baseY);
            path.closePath();
        }
        run = [];
    };
    for (const p of pts) {
        if (p) {
            run.push(p);
        } else {
            flush();
        }
    }
    flush();
    ctx.fillStyle = color;
    ctx.fill(path);
};

/** Adds a polygon to a path. */
const polygon = (path: Path2D, pts: readonly (readonly [number, number])[]) => {
    path.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) {
        path.lineTo(pts[k][0], pts[k][1]);
    }
    path.closePath();
};

/**
 * Fills between two series of screen points (same x per slot). Where `below` is given, the parts where
 * series a is below b (on screen: a has the larger y) use it; crossings are split exactly.
 */
export const fillBetween = (
    ctx: CanvasRenderingContext2D,
    xs: readonly number[],
    a: readonly number[],
    b: readonly number[],
    above: string,
    below?: string,
) => {
    const pa = new Path2D();
    const pb = below && below !== above ? new Path2D() : pa;
    for (let k = 0; k + 1 < xs.length; k++) {
        const a0 = a[k];
        const a1 = a[k + 1];
        const b0 = b[k];
        const b1 = b[k + 1];
        if (!(a0 === a0 && a1 === a1 && b0 === b0 && b1 === b1)) {
            continue;
        }
        const x0 = xs[k];
        const x1 = xs[k + 1];
        // screen y grows downwards: "a above b" means a < b
        const d0 = b0 - a0;
        const d1 = b1 - a1;
        if (d0 * d1 < 0) {
            const t = d0 / (d0 - d1);
            const xc = x0 + t * (x1 - x0);
            const yc = a0 + t * (a1 - a0);
            polygon(d0 > 0 ? pa : pb, [
                [x0, a0],
                [xc, yc],
                [x0, b0],
            ]);
            polygon(d1 > 0 ? pa : pb, [
                [xc, yc],
                [x1, a1],
                [x1, b1],
            ]);
        } else {
            polygon(d0 + d1 >= 0 ? pa : pb, [
                [x0, a0],
                [x1, a1],
                [x1, b1],
                [x0, b0],
            ]);
        }
    }
    ctx.fillStyle = above;
    ctx.fill(pa);
    if (pb !== pa) {
        ctx.fillStyle = below!;
        ctx.fill(pb);
    }
};

/** Histogram columns from `baseY`, batched per color. Zero-height columns are drawn 1px tall. */
export const drawColumns = (
    ctx: CanvasRenderingContext2D,
    columns: readonly { x: number; y: number; color: string }[],
    baseY: number,
    barWidth: number,
) => {
    const w = Math.max(1, Math.round(barWidth));
    const paths = new Map<string, Path2D>();
    const by = Math.round(baseY);
    for (const c of columns) {
        let path = paths.get(c.color);
        if (!path) {
            path = new Path2D();
            paths.set(c.color, path);
        }
        const y = Math.round(c.y);
        const top = Math.min(y, by);
        const h = Math.max(1, Math.abs(by - y));
        path.rect(Math.round(c.x - w / 2), y === by ? by - 1 : top, w, h);
    }
    for (const [color, path] of paths) {
        ctx.fillStyle = color;
        ctx.fill(path);
    }
};

/** Dots (circles) batched per color. */
export const drawDots = (
    ctx: CanvasRenderingContext2D,
    dots: readonly { x: number; y: number; color: string }[],
    radius: number,
) => {
    const paths = new Map<string, Path2D>();
    for (const d of dots) {
        let path = paths.get(d.color);
        if (!path) {
            path = new Path2D();
            paths.set(d.color, path);
        }
        path.moveTo(d.x + radius, d.y);
        path.arc(d.x, d.y, radius, 0, Math.PI * 2);
    }
    for (const [color, path] of paths) {
        ctx.fillStyle = color;
        ctx.fill(path);
    }
};

/** Horizontal level line across the pane. */
export const drawLevel = (ctx: CanvasRenderingContext2D, y: number, width: number, color: string, dashed: boolean) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash(dashed ? dashArray("dashed", 1) : []);
    horizontalLine(ctx, y, 0, width);
    ctx.setLineDash([]);
};
