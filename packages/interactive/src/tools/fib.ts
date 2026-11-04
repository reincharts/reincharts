import { applyStroke, withAlpha } from "@reincharts/core";
import { fillPolygon, polyline, segment, strokeOf, text } from "../draw";
import { extendSegment, nearPolyline, nearSegment, TOLERANCE } from "../geometry";
import { icons } from "../icons";
import type { DrawingLevel, Geometry, Pt } from "../types";
import { defineTool, FIB_LEVELS } from "./common";

interface LevelLine {
    level: DrawingLevel;
    price: number;
    y: number;
    color: string;
}

/** Visible levels of a fib drawing, as prices from `origin` by `range` (price units). */
const levelLines = (g: Geometry, origin: number, range: number): LevelLine[] =>
    (g.drawing.style.levels ?? FIB_LEVELS)
        .filter((l) => l.visible !== false)
        .map((level) => {
            const price = origin + range * level.value;
            return { level, price, y: g.y(price), color: level.color ?? g.color };
        });

const drawLevels = (ctx: CanvasRenderingContext2D, g: Geometry, lines: LevelLine[], left: number, right: number) => {
    const style = g.drawing.style;
    const opacity = style.fillOpacity ?? 0.12;
    if (opacity > 0) {
        const sorted = [...lines].sort((a, b) => a.level.value - b.level.value);
        for (let i = 1; i < sorted.length; i++) {
            ctx.fillStyle = withAlpha(sorted[i].color, opacity);
            const top = Math.min(sorted[i - 1].y, sorted[i].y);
            ctx.fillRect(left, top, right - left, Math.abs(sorted[i].y - sorted[i - 1].y));
        }
    }
    for (const l of lines) {
        applyStroke(ctx, { color: l.color, width: style.width ?? 1, dash: style.dash });
        const y = Math.round(l.y) + 0.5;
        segment(ctx, { x: left, y }, { x: right, y });
        if (style.showLabels !== false) {
            const label = `${+l.level.value.toFixed(3)} (${g.formatPrice(l.price)})`;
            const inside = left < 90;
            text(
                ctx,
                g,
                label,
                inside ? left + 4 : left - 6,
                y - (inside ? 2 : 0),
                l.color,
                inside ? "left" : "right",
                inside ? "bottom" : "middle",
            );
        }
    }
};

const span = (g: Geometry, a: Pt, b: Pt) => {
    const ext = g.drawing.style.extend;
    const left = ext === "left" || ext === "both" ? 0 : Math.min(a.x, b.x);
    const right = ext === "right" || ext === "both" ? g.width : Math.max(a.x, b.x);
    return { left, right };
};

const hitLevels = (lines: LevelLine[], left: number, right: number, x: number, y: number) =>
    x >= left - TOLERANCE && x <= right + TOLERANCE && lines.some((l) => Math.abs(l.y - y) <= TOLERANCE);

const trendDash = (ctx: CanvasRenderingContext2D, g: Geometry, pts: readonly Pt[]) => {
    applyStroke(ctx, { color: withAlpha(g.theme.textMuted, 0.9), width: 1, dash: "dashed" });
    polyline(ctx, pts);
    ctx.stroke();
};

export const fibRetracement = defineTool({
    type: "fibRetracement",
    label: "Fib Retracement",
    group: "fib",
    icon: icons.fibRetracement,
    points: 2,
    defaults: { width: 1, extend: "none", fillOpacity: 0.12 },
    styleControls: ["color", "width", "dash", "extend"],
    draw(ctx, g, d) {
        const [a, b] = g.points;
        const [p0, p1] = d.points;
        const { left, right } = span(g, a, b);
        trendDash(ctx, g, [a, b]);
        drawLevels(ctx, g, levelLines(g, p1.price, p0.price - p1.price), left, right);
    },
    hitTest(g, x, y) {
        const [a, b] = g.points;
        const [p0, p1] = g.drawing.points;
        const { left, right } = span(g, a, b);
        return hitLevels(levelLines(g, p1.price, p0.price - p1.price), left, right, x, y) || nearSegment(x, y, a, b);
    },
});

const extensionSpan = (g: Geometry) => {
    const [a, b, c] = g.points;
    const ext = g.drawing.style.extend;
    const left = ext === "left" || ext === "both" ? 0 : c.x;
    const right = ext === "right" || ext === "both" ? g.width : c.x + Math.max(60, Math.abs(b.x - a.x));
    return { left, right };
};

export const fibExtension = defineTool({
    type: "fibExtension",
    label: "Trend-Based Fib Extension",
    group: "fib",
    icon: icons.fibExtension,
    points: 3,
    defaults: { width: 1, extend: "none", fillOpacity: 0.12 },
    styleControls: ["color", "width", "dash", "extend"],
    draw(ctx, g, d) {
        trendDash(ctx, g, g.points);
        if (g.points.length < 3) {
            return;
        }
        const [p0, p1, p2] = d.points;
        const { left, right } = extensionSpan(g);
        drawLevels(ctx, g, levelLines(g, p2.price, p1.price - p0.price), left, right);
    },
    hitTest(g, x, y) {
        if (nearPolyline(x, y, g.points)) {
            return true;
        }
        if (g.points.length < 3) {
            return false;
        }
        const [p0, p1, p2] = g.drawing.points;
        const { left, right } = extensionSpan(g);
        return hitLevels(levelLines(g, p2.price, p1.price - p0.price), left, right, x, y);
    },
});

/** Default gann fan ratios (time/price). */
export const GANN_LEVELS: readonly DrawingLevel[] = [
    { value: 1 / 8, color: "#ff9800" },
    { value: 1 / 4, color: "#4caf50" },
    { value: 1 / 3, color: "#089981" },
    { value: 1 / 2, color: "#00bcd4" },
    { value: 1, color: "#2962ff" },
    { value: 2, color: "#9c27b0" },
    { value: 3, color: "#e91e63" },
    { value: 4, color: "#f23645" },
    { value: 8, color: "#787b86" },
];

const gannLabel = (r: number) => (r >= 1 ? `${+r.toFixed(2)}/1` : `1/${+(1 / r).toFixed(2)}`);

const fanRays = (g: Geometry) => {
    const [a, b] = g.points;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return (g.drawing.style.levels ?? GANN_LEVELS)
        .filter((l) => l.visible !== false)
        .map((level) => {
            const r = level.value;
            const end = { x: a.x + dx * Math.min(1, r), y: a.y + dy * Math.min(1, 1 / r) };
            return {
                level,
                end,
                far: extendSegment(a, end, "right", g.width, g.height)[1],
                color: level.color ?? g.color,
            };
        });
};

export const gannFan = defineTool({
    type: "gannFan",
    label: "Gann Fan",
    group: "fib",
    icon: icons.gannFan,
    points: 2,
    defaults: { width: 1, fillOpacity: 0.1 },
    styleControls: ["color", "width", "dash"],
    draw(ctx, g, d) {
        const [a, b] = g.points;
        if (a.x === b.x || a.y === b.y) {
            strokeOf(ctx, g);
            segment(ctx, a, b);
            return;
        }
        const rays = fanRays(g);
        const opacity = d.style.fillOpacity ?? 0.1;
        for (let i = 1; i < rays.length && opacity > 0; i++) {
            fillPolygon(ctx, [a, rays[i - 1].far, rays[i].far], withAlpha(rays[i].color, opacity));
        }
        for (const r of rays) {
            applyStroke(ctx, { color: r.color, width: d.style.width ?? 1, dash: d.style.dash });
            segment(ctx, a, r.far);
            if (d.style.showLabels !== false) {
                text(ctx, g, gannLabel(r.level.value), r.end.x + 3, r.end.y - 3, r.color, "left", "bottom");
            }
        }
    },
    hitTest(g, x, y) {
        const [a] = g.points;
        return fanRays(g).some((r) => nearSegment(x, y, a, r.far));
    },
});

export const fibTools = [fibRetracement, fibExtension, gannFan];
