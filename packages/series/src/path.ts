import { isFiniteNumber } from "@reincharts/core";
import { getLod, LOD_BLOCK } from "./lod";

/** Line interpolation between points. */
export type Curve = "linear" | "step" | "stepAfter" | "stepBefore" | "monotone";

export type Point = readonly [number, number];

/** Traces a path through points into `ctx` (shared by line and area series). `null` points are gaps. */
export const tracePath = (
    ctx: CanvasRenderingContext2D | Path2D,
    points: readonly (Point | null)[],
    curve: Curve = "linear",
    connectGaps = false,
    continuePath = false,
) => {
    let started = continuePath;
    let prev: Point | null = null;
    const pts = connectGaps ? points.filter(Boolean) : points;
    for (let k = 0; k < pts.length; k++) {
        const p = pts[k];
        if (!p) {
            started = false;
            prev = null;
            continue;
        }
        const [px, py] = p;
        if (!started || !prev) {
            if (started) {
                ctx.lineTo(px, py);
            } else {
                ctx.moveTo(px, py);
            }
            started = true;
        } else if (curve === "step" || curve === "stepAfter") {
            ctx.lineTo(px, prev[1]);
            ctx.lineTo(px, py);
        } else if (curve === "stepBefore") {
            ctx.lineTo(prev[0], py);
            ctx.lineTo(px, py);
        } else if (curve === "monotone") {
            const next = pts[k + 1] ?? null;
            const before = pts[k - 2] ?? null;
            const t0 = tangent(before, prev, p);
            const t1 = tangent(prev, p, next);
            const dx = (px - prev[0]) / 3;
            ctx.bezierCurveTo(prev[0] + dx, prev[1] + dx * t0, px - dx, py - dx * t1, px, py);
        } else {
            ctx.lineTo(px, py);
        }
        prev = p;
    }
};

// Fritsch–Carlson style tangent that never overshoots.
const tangent = (a: Point | null, b: Point, c: Point | null) => {
    const s0 = a ? (b[1] - a[1]) / (b[0] - a[0] || 1) : undefined;
    const s1 = c ? (c[1] - b[1]) / (c[0] - b[0] || 1) : undefined;
    if (s0 === undefined) {
        return s1 ?? 0;
    }
    if (s1 === undefined) {
        return s0;
    }
    return s0 * s1 <= 0 ? 0 : (2 * s0 * s1) / (s0 + s1);
};

/** Collects [x, y] pixel points for bars start..end (null for gaps). */
export const linePoints = <T>(
    data: readonly T[],
    start: number,
    end: number,
    x: (i: number) => number,
    y: (v: number) => number,
    value: (d: T, i: number) => number | undefined,
) => {
    const out: (Point | null)[] = [];
    if (end < start) {
        return out;
    }
    const valueAt = (i: number) => (data[i] === undefined ? undefined : value(data[i], i));
    // with more than ~2 points per pixel, keep only the first / min / max / last point of each pixel column
    // (M4 aggregation): the rendered line is visually identical, and the cost depends on the width, not the data size
    if (end - start + 1 <= Math.max(64, Math.abs(x(end) - x(start)) * 2)) {
        for (let i = start; i <= end; i++) {
            const v = valueAt(i);
            out.push(isFiniteNumber(v) ? [x(i), y(v)] : null);
        }
        return out;
    }
    let column = NaN;
    let first = -1;
    let last = -1;
    let lo = -1;
    let hi = -1;
    let loValue = 0;
    let hiValue = 0;
    const flush = () => {
        if (first < 0) {
            return;
        }
        const picks = [first, lo, hi, last].sort((a, b) => a - b);
        for (let k = 0; k < picks.length; k++) {
            if (k === 0 || picks[k] !== picks[k - 1]) {
                out.push([x(picks[k]), y(valueAt(picks[k])!)]);
            }
        }
        first = -1;
    };
    // very dense (a whole block of bars per pixel): merge pre-aggregated blocks instead of single bars
    const lod =
        (end - start + 1) / Math.max(1, Math.abs(x(end) - x(start))) >= LOD_BLOCK ? getLod(data, value) : undefined;
    for (let i = start; i <= end; i++) {
        // only blocks that fit in one pixel column (a block straddling two columns is processed bar by bar,
        // otherwise its extreme could be attributed to the wrong column)
        if (
            lod &&
            i % LOD_BLOCK === 0 &&
            i + LOD_BLOCK - 1 <= end &&
            Math.floor(x(i)) === Math.floor(x(i + LOD_BLOCK - 1))
        ) {
            const b = i / LOD_BLOCK;
            i += LOD_BLOCK - 1;
            if (lod.firstAt[b] < 0) {
                continue;
            }
            const c = Math.floor(x(b * LOD_BLOCK));
            if (c !== column) {
                flush();
                column = c;
                first = lod.firstAt[b];
                lo = lod.minAt[b];
                hi = lod.maxAt[b];
                loValue = lod.min[b];
                hiValue = lod.max[b];
            } else {
                if (lod.min[b] < loValue) {
                    loValue = lod.min[b];
                    lo = lod.minAt[b];
                }
                if (lod.max[b] > hiValue) {
                    hiValue = lod.max[b];
                    hi = lod.maxAt[b];
                }
            }
            last = lod.lastAt[b];
            continue;
        }
        const v = valueAt(i);
        if (!isFiniteNumber(v)) {
            flush();
            if (out.length && out[out.length - 1] !== null) {
                out.push(null);
            }
            column = NaN;
            continue;
        }
        const c = Math.floor(x(i));
        if (c !== column) {
            flush();
            column = c;
            first = last = lo = hi = i;
            loValue = hiValue = v;
            continue;
        }
        last = i;
        if (v < loValue) {
            loValue = v;
            lo = i;
        } else if (v > hiValue) {
            hiValue = v;
            hi = i;
        }
    }
    flush();
    return out;
};

const reversed: Record<Curve, Curve> = {
    linear: "linear",
    monotone: "monotone",
    step: "stepBefore",
    stepAfter: "stepBefore",
    stepBefore: "stepAfter",
};

/**
 * Traces closed area shapes between a top line and a bottom line (or a constant bottom y).
 * Each contiguous run of defined points becomes one closed sub-path.
 */
export const traceArea = (
    path: CanvasRenderingContext2D | Path2D,
    top: readonly (Point | null)[],
    bottom: readonly (Point | null)[] | number,
    curve: Curve = "linear",
    connectGaps = false,
) => {
    const both = top.map((p, k) => (p && (typeof bottom === "number" || bottom[k]) ? k : -1));
    const runs: number[][] = [];
    let run: number[] = [];
    for (const k of both) {
        if (k >= 0) {
            run.push(k);
        } else if (!connectGaps && run.length) {
            runs.push(run);
            run = [];
        }
    }
    if (run.length) {
        runs.push(run);
    }
    for (const r of runs) {
        const t = r.map((k) => top[k]!);
        tracePath(path, t, curve);
        if (typeof bottom === "number") {
            path.lineTo(t[t.length - 1][0], bottom);
            path.lineTo(t[0][0], bottom);
        } else {
            const b = r.map((k) => bottom[k]!).reverse();
            tracePath(path, b, reversed[curve], false, true);
        }
        path.closePath();
    }
};
