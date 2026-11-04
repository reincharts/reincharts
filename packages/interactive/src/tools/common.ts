import { decimalsFor, formatNumber, formatPercent } from "@reincharts/core";
import type { Drawing, DrawingLevel, DrawingStyle, Geometry, Pt, ToolDefinition } from "../types";

/**
 * Defines a drawing tool. Tools are plain objects: points in, canvas out.
 * Pass custom tools to `useDrawings({ tools })` and they appear in the toolbar.
 */
export const defineTool = (tool: ToolDefinition): ToolDefinition => tool;

const extendsLeft = (e: DrawingStyle["extend"]) => e === "left" || e === "both";
const extendsRight = (e: DrawingStyle["extend"]) => e === "right" || e === "both";

/** Price of the line through the first two points at a logical x (respecting `style.extend`). */
export const lineCross = (d: Drawing, logical: number, logicalOf: (t: number) => number) => {
    const [a, b] = d.points;
    if (!a || !b) {
        return undefined;
    }
    const la = logicalOf(a.time);
    const lb = logicalOf(b.time);
    if (la === lb) {
        return undefined;
    }
    const t = (logical - la) / (lb - la);
    const forward = lb > la;
    const ext = d.style.extend;
    if (
        (t < 0 && !(forward ? extendsLeft(ext) : extendsRight(ext))) ||
        (t > 1 && !(forward ? extendsRight(ext) : extendsLeft(ext)))
    ) {
        return undefined;
    }
    return a.price + t * (b.price - a.price);
};

/** Y of the infinite line ab at x. */
export const lineYAt = (a: Pt, b: Pt, x: number) => (b.x === a.x ? a.y : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x));

/** "5.20 (+5.03%)" */
export const priceChange = (g: Geometry, from: number, to: number) =>
    `${to - from >= 0 ? "" : "−"}${g.formatPrice(Math.abs(to - from))} (${formatPercent(from ? ((to - from) / Math.abs(from)) * 100 : 0)})`;

/** Human readable duration between two x values, e.g. "3d 4h" (time axes) or "Δ 12.5". */
export const duration = (g: Geometry, t0: number, t1: number) => {
    const ms = Math.abs(t1 - t0);
    if (g.engine.xType !== "time") {
        return formatNumber(ms, Math.min(2, decimalsFor(ms)));
    }
    const m = Math.round(ms / 60_000);
    const d = Math.floor(m / 1440);
    const h = Math.floor((m % 1440) / 60);
    const min = m % 60;
    if (d >= 1) {
        return h ? `${d}d ${h}h` : `${d}d`;
    }
    return h ? (min ? `${h}h ${min}m` : `${h}h`) : `${min}m`;
};

/** Number of bars between two x values. */
export const barsBetween = (g: Geometry, t0: number, t1: number) => Math.round(g.logical(t1) - g.logical(t0));

/** Angle of a→b in degrees (screen up = positive). */
export const angleOf = (a: Pt, b: Pt) => (Math.atan2(a.y - b.y, b.x - a.x) * 180) / Math.PI;

export const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

let measureContext: CanvasRenderingContext2D | null | undefined;

/** Measures text without a visible canvas (used by hit tests of text tools). */
export const measureText = (font: string, value: string) => {
    if (measureContext === undefined) {
        measureContext = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
    }
    if (!measureContext) {
        return value.length * 7;
    }
    measureContext.font = font;
    return measureContext.measureText(value).width;
};

/** Default fibonacci levels and colors. */
export const FIB_LEVELS: readonly DrawingLevel[] = [
    { value: 0, color: "#787b86" },
    { value: 0.236, color: "#f23645" },
    { value: 0.382, color: "#ff9800" },
    { value: 0.5, color: "#4caf50" },
    { value: 0.618, color: "#089981" },
    { value: 0.786, color: "#00bcd4" },
    { value: 1, color: "#787b86" },
    { value: 1.618, color: "#2962ff" },
    { value: 2.618, color: "#f23645" },
    { value: 3.618, color: "#9c27b0" },
    { value: 4.236, color: "#e91e63" },
];
