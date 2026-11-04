import type { ChartEngine, PriceScale, Theme } from "@reincharts/core";
import type { Drawing, DrawingStyle, Geometry, Pt } from "./types";

/** Hit tolerance in pixels. */
export const TOLERANCE = 6;
/** Handle hit radius in pixels. */
export const HANDLE_RADIUS = 8;

/** Distance between two points in pixels. */
export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Distance from p to segment ab. */
export const distToSegment = (p: Pt, a: Pt, b: Pt) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = dx * dx + dy * dy;
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

/** Whether (x, y) is within the hit tolerance of segment a–b. */
export const nearSegment = (x: number, y: number, a: Pt, b: Pt, tolerance = TOLERANCE) =>
    distToSegment({ x, y }, a, b) <= tolerance;

/** True when (x, y) is near any segment of the polyline. */
export const nearPolyline = (x: number, y: number, pts: readonly Pt[], closed = false, tolerance = TOLERANCE) => {
    if (pts.length === 1) {
        return dist(pts[0], { x, y }) <= tolerance;
    }
    for (let i = 1; i < pts.length; i++) {
        if (nearSegment(x, y, pts[i - 1], pts[i], tolerance)) {
            return true;
        }
    }
    return closed && pts.length > 2 && nearSegment(x, y, pts[pts.length - 1], pts[0], tolerance);
};

/** Even-odd point in polygon test. */
export const inPolygon = (x: number, y: number, pts: readonly Pt[]) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const a = pts[i];
        const b = pts[j];
        if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
            inside = !inside;
        }
    }
    return inside;
};

/** Normalized rect spanned by two points. */
export const rectOf = (a: Pt, b: Pt) => ({
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    right: Math.max(a.x, b.x),
    bottom: Math.max(a.y, b.y),
});

/** Whether (x, y) lies inside the rectangle spanned by a and b. */
export const inRect = (x: number, y: number, a: Pt, b: Pt, pad = 0) => {
    const r = rectOf(a, b);
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
};

/** Extends segment a→b far beyond a box of size w×h (the canvas clip trims it). */
export const extendSegment = (a: Pt, b: Pt, mode: DrawingStyle["extend"], w: number, h: number): readonly [Pt, Pt] => {
    const len = dist(a, b);
    if (!mode || mode === "none" || len === 0) {
        return [a, b];
    }
    const far = ((w + h) * 4 + Math.abs(a.x) + Math.abs(a.y) + Math.abs(b.x) + Math.abs(b.y)) / len;
    const ux = b.x - a.x;
    const uy = b.y - a.y;
    const start = mode === "left" || mode === "both" ? { x: a.x - ux * far, y: a.y - uy * far } : a;
    const end = mode === "right" || mode === "both" ? { x: b.x + ux * far, y: b.y + uy * far } : b;
    return [start, end];
};

/** Constrains `p` relative to `origin` to the nearest multiple of 45° (shift key). */
export const constrainAngle = (origin: Pt, p: Pt): Pt => {
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    const len = Math.hypot(dx, dy);
    const ax = Math.round(Math.cos(angle) * 1e6) / 1e6;
    const ay = Math.round(Math.sin(angle) * 1e6) / 1e6;
    if (ax === 0) {
        return { x: origin.x, y: p.y };
    }
    if (ay === 0) {
        return { x: p.x, y: origin.y };
    }
    return { x: origin.x + ax * len, y: origin.y + ay * len };
};

/** Least squares fit y = intercept + slope * x. */
export const linearRegression = (xs: readonly number[], ys: readonly number[]) => {
    const n = xs.length;
    let sx = 0;
    let sy = 0;
    let sxy = 0;
    let sxx = 0;
    for (let i = 0; i < n; i++) {
        sx += xs[i];
        sy += ys[i];
        sxy += xs[i] * ys[i];
        sxx += xs[i] * xs[i];
    }
    const denom = n * sxx - sx * sx;
    const slope = n > 1 && denom !== 0 ? (n * sxy - sx * sy) / denom : 0;
    const intercept = n > 0 ? (sy - slope * sx) / n : 0;
    let sd = 0;
    let maxDev = 0;
    for (let i = 0; i < n; i++) {
        const r = ys[i] - (intercept + slope * xs[i]);
        sd += r * r;
        maxDev = Math.max(maxDev, Math.abs(r));
    }
    return { slope, intercept, stdDev: n > 1 ? Math.sqrt(sd / (n - 1)) : 0, maxDev };
};

/** Default source value of a datum (close, value or y). */
export const defaultSource = (d: any): number | undefined => {
    const v = d?.close ?? d?.value ?? d?.y;
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
};

export interface GeometryContext {
    readonly engine: ChartEngine;
    readonly scale: PriceScale;
    readonly theme: Theme;
    readonly width: number;
    readonly height: number;
    readonly source?: (d: any, index: number) => number | undefined;
}

/** Converts a drawing to pixels for the given pane. */
export const createGeometry = (drawing: Drawing, c: GeometryContext): Geometry => {
    const { engine, scale, width, height } = c;
    const source = c.source ?? defaultSource;
    const x = (time: number) => engine.xOfLogical(engine.logicalOfTime(time));
    const y = (price: number) => scale.toY(price);
    return {
        points: drawing.points.map((p) => ({ x: x(p.time), y: y(p.price) })),
        width,
        height,
        drawing,
        theme: c.theme,
        engine,
        scale,
        barSpacing: engine.barSpacing,
        color: drawing.style.color ?? c.theme.drawing.color,
        x,
        y,
        time: (px) => engine.timeOfLogical(engine.logicalOfX(px)),
        price: (py) => scale.fromY(py),
        logical: (t) => engine.logicalOfTime(t),
        formatPrice: (p) => scale.format(p),
        formatTime: (t) => formatTime(engine, t),
        value: (i) => (i >= 0 && i < engine.data.length ? source(engine.data[i], i) : undefined),
        extend: (a, b, mode) => extendSegment(a, b, mode, width, height),
    };
};

export const formatTime = (engine: ChartEngine, t: number) => {
    if (engine.xType === "time") {
        return engine.time.format(t, engine.intraday);
    }
    if (engine.xType === "category") {
        return engine.categories[Math.round(t)] ?? "";
    }
    return engine.formatX(-1, t) || String(Math.round(t * 100) / 100);
};
