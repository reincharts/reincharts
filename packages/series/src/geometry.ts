/** Pixel geometry shared by bar-like series (bars, candles, OHLC, renko...). */

/** Integer bar width for a bar spacing: `ratio` of the spacing, at least 1px, at most `max`. */
export const barWidth = (barSpacing: number, ratio = 0.8, max = Infinity) =>
    Math.max(1, Math.min(max, Math.floor(barSpacing * ratio)));

/** Left pixel edge of a bar of integer `width` centred on `cx`, aligned to the pixel grid. */
export const barLeft = (cx: number, width: number) => Math.round(cx - width / 2);

/** Rounded [start, size] of the span between two pixel positions (size at least `min`). */
export const pixelSpan = (a: number, b: number, min = 1): [number, number] => {
    const lo = Math.round(Math.min(a, b));
    const hi = Math.round(Math.max(a, b));
    return [lo, Math.max(min, hi - lo)];
};

// roundRect is missing in older browsers (and canvas mocks): fall back to square corners
const canRound = (path: Path2D) => typeof path.roundRect === "function";

/** Adds a pixel-aligned vertical bar (centred on `cx`, spanning `y1`..`y2`) to a path. */
export const addColumn = (path: Path2D, cx: number, width: number, y1: number, y2: number, radius = 0) => {
    const [top, height] = pixelSpan(y1, y2);
    const left = barLeft(cx, width);
    if (radius > 0 && width > 4 && height > 2 && canRound(path)) {
        const r = Math.min(radius, width / 2, height);
        // round the end away from the base only
        path.roundRect(left, top, width, height, y1 <= y2 ? [r, r, 0, 0] : [0, 0, r, r]);
    } else {
        path.rect(left, top, width, height);
    }
};

/** Adds a pixel-aligned horizontal bar (spanning `x1`..`x2`, centred on `cy`) to a path. */
export const addRow = (path: Path2D, x1: number, x2: number, cy: number, height: number, radius = 0) => {
    const [left, width] = pixelSpan(x1, x2);
    const top = barLeft(cy, height);
    if (radius > 0 && height > 4 && width > 2 && canRound(path)) {
        const r = Math.min(radius, height / 2, width);
        path.roundRect(left, top, width, height, x2 >= x1 ? [0, r, r, 0] : [r, 0, 0, r]);
    } else {
        path.rect(left, top, width, height);
    }
};

/**
 * Splits a slot of `slot` pixels into `count` side-by-side bars separated by `gap` pixels.
 * Returns the integer width of each bar and the offset of bar k's centre from the slot centre.
 */
export const groupLayout = (slot: number, count: number, gap = 1) => {
    const n = Math.max(1, count);
    const g = slot / n > 3 ? gap : 0;
    const width = Math.max(1, Math.floor((slot - g * (n - 1)) / n));
    const total = width * n + g * (n - 1);
    const offsets = Array.from({ length: n }, (_, k) => -total / 2 + width / 2 + k * (width + g));
    return { width, offsets };
};

/** Batches sub-paths by color so each color is filled / stroked once per frame. */
export class PathBatch {
    private readonly paths = new Map<string, Path2D>();

    public get(color: string) {
        let p = this.paths.get(color);
        if (!p) {
            p = new Path2D();
            this.paths.set(color, p);
        }
        return p;
    }

    public fill(ctx: CanvasRenderingContext2D) {
        for (const [color, p] of this.paths) {
            ctx.fillStyle = color;
            ctx.fill(p);
        }
    }

    public stroke(ctx: CanvasRenderingContext2D, width = 1) {
        ctx.lineWidth = width;
        ctx.setLineDash([]);
        for (const [color, p] of this.paths) {
            ctx.strokeStyle = color;
            ctx.stroke(p);
        }
    }
}

/** A vertical linear gradient between two colors over [y0, y1]. */
export const verticalGradient = (ctx: CanvasRenderingContext2D, y0: number, y1: number, from: string, to: string) => {
    const g = ctx.createLinearGradient(0, y0, 0, Number.isFinite(y1) && y1 !== y0 ? y1 : y0 + 1);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    return g;
};
