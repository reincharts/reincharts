import { formatNumber, formatPercent, withAlpha } from "@reincharts/core";
import { arrowHead, multiLabel, segment, strokeOf } from "../draw";
import { inRect, TOLERANCE } from "../geometry";
import { icons } from "../icons";
import type * as React from "react";
import type { Drawing, Geometry, Pt } from "../types";
import { barsBetween, defineTool, duration, priceChange } from "./common";

const UP = "#089981";
const DOWN = "#f23645";

// ------------------------------------------------------------ long / short position

/**
 * Position points: [entry, target, stop]; target and stop share the right edge time.
 * Placed with two clicks (entry, then target / right edge); the stop mirrors the target.
 */
const buildPosition = (dir: 1 | -1) => (pts: readonly Pt[]) => {
    const [entry, p] = pts;
    if (!p) {
        return pts;
    }
    let target = p;
    if (Math.abs(p.x - entry.x) < 4 && Math.abs(p.y - entry.y) < 4) {
        target = { x: entry.x + 120, y: entry.y - dir * 60 };
    }
    const right = target.x === entry.x ? entry.x + 120 : target.x;
    return [entry, { x: right, y: target.y }, { x: right, y: entry.y + (entry.y - target.y) / 1.5 }];
};

const positionStats = (d: Drawing, dir: 1 | -1) => {
    const [entry, target, stop] = d.points;
    const qty = d.style.quantity ?? 1;
    const reward = (target.price - entry.price) * dir;
    const risk = (entry.price - stop.price) * dir;
    return { entry, target, stop, qty, reward, risk, ratio: risk !== 0 ? Math.abs(reward / risk) : 0 };
};

const position = (dir: 1 | -1) =>
    defineTool({
        type: dir === 1 ? "longPosition" : "shortPosition",
        label: dir === 1 ? "Long Position" : "Short Position",
        group: "measure",
        icon: dir === 1 ? icons.longPosition : icons.shortPosition,
        points: 2,
        defaults: { width: 1, quantity: 1 },
        styleControls: ["width"],
        build: buildPosition(dir),
        draw(ctx, g, d, state) {
            if (g.points.length < 3) {
                strokeOf(ctx, g);
                segment(ctx, g.points[0], g.points[1] ?? g.points[0]);
                return;
            }
            const [e, t, s] = g.points;
            const left = Math.min(e.x, t.x);
            const w = Math.abs(t.x - e.x);
            ctx.fillStyle = withAlpha(UP, 0.2);
            ctx.fillRect(left, Math.min(e.y, t.y), w, Math.abs(t.y - e.y));
            ctx.fillStyle = withAlpha(DOWN, 0.2);
            ctx.fillRect(left, Math.min(e.y, s.y), w, Math.abs(s.y - e.y));
            ctx.setLineDash([]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = g.theme.textMuted;
            const ey = Math.round(e.y) + 0.5;
            segment(ctx, { x: left, y: ey }, { x: left + w, y: ey });
            const st = positionStats(d, dir);
            const cx = left + w / 2;
            const pct = (v: number) => formatPercent((v / st.entry.price) * 100);
            const amount = (v: number) => formatNumber(v * st.qty, 2);
            const targetAbove = t.y < e.y;
            multiLabel(
                ctx,
                g,
                [`Target: ${g.formatPrice(st.target.price)} (${pct(st.reward)}) ${amount(st.reward)}`],
                cx,
                t.y + (targetAbove ? -6 : 6),
                UP,
                targetAbove ? "bottom" : "top",
            );
            multiLabel(
                ctx,
                g,
                [`Stop: ${g.formatPrice(st.stop.price)} (${pct(-st.risk)}) ${amount(-st.risk)}`],
                cx,
                s.y + (targetAbove ? 6 : -6),
                DOWN,
                targetAbove ? "top" : "bottom",
            );
            if (state.selected || state.hovered || state.preview) {
                multiLabel(
                    ctx,
                    g,
                    [`Risk/Reward Ratio: ${st.ratio.toFixed(2)}`, `Qty: ${formatNumber(st.qty, st.qty % 1 ? 2 : 0)}`],
                    cx,
                    e.y,
                    withAlpha(g.theme.textMuted, 0.95),
                    "middle",
                );
            }
        },
        hitTest(g, x, y) {
            const [e, t, s] = g.points;
            return !!s && (inRect(x, y, e, t, 2) || inRect(x, y, e, { x: t.x, y: s.y }, 2));
        },
        handles(g) {
            const [e, t, s] = g.points;
            return s ? [e, { x: e.x, y: t.y }, { x: e.x, y: s.y }, { x: t.x, y: e.y }] : g.points;
        },
        dragHandle(g, i, p) {
            const [e, t, s] = g.points;
            switch (i) {
                case 0:
                    return [p, t, s];
                case 1:
                    return [e, { x: t.x, y: p.y }, s];
                case 2:
                    return [e, t, { x: s.x, y: p.y }];
                default:
                    return [e, { x: p.x, y: t.y }, { x: p.x, y: s.y }];
            }
        },
    });

export const longPosition = position(1);
export const shortPosition = position(-1);

// ------------------------------------------------------------ ranges

const rangeColor = (g: Geometry, up: boolean) => g.drawing.style.color ?? (up ? g.theme.drawing.color : DOWN);

const vArrow = (ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, color: string) => {
    ctx.setLineDash([]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const tip = y1 + (y1 > y0 ? -1 : 1);
    segment(ctx, { x, y: y0 }, { x, y: tip });
    if (Math.abs(y1 - y0) > 8) {
        arrowHead(ctx, { x, y: y0 }, { x, y: y1 }, color, 7);
    }
};

const hArrow = (ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number, color: string) => {
    ctx.setLineDash([]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    segment(ctx, { x: x0, y }, { x: x1, y });
    if (Math.abs(x1 - x0) > 8) {
        arrowHead(ctx, { x: x0, y }, { x: x1, y }, color, 7);
    }
};

const measureTool = (type: string, label: string, icon: React.ReactElement, showPrice: boolean, showTime: boolean) =>
    defineTool({
        type,
        label,
        group: "measure",
        icon,
        points: 2,
        defaults: {},
        styleControls: ["color"],
        draw(ctx, g, d) {
            const [a, b] = g.points;
            const [p0, p1] = d.points;
            const up = p1.price >= p0.price;
            const color = rangeColor(g, up);
            const left = Math.min(a.x, b.x);
            const right = Math.max(a.x, b.x);
            const top = Math.min(a.y, b.y);
            const bottom = Math.max(a.y, b.y);
            ctx.fillStyle = withAlpha(color, 0.15);
            ctx.fillRect(left, top, right - left, bottom - top);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.beginPath();
            if (showPrice && !showTime) {
                ctx.moveTo(left, Math.round(a.y) + 0.5);
                ctx.lineTo(right, Math.round(a.y) + 0.5);
                ctx.moveTo(left, Math.round(b.y) + 0.5);
                ctx.lineTo(right, Math.round(b.y) + 0.5);
            } else if (showTime && !showPrice) {
                ctx.moveTo(Math.round(a.x) + 0.5, top);
                ctx.lineTo(Math.round(a.x) + 0.5, bottom);
                ctx.moveTo(Math.round(b.x) + 0.5, top);
                ctx.lineTo(Math.round(b.x) + 0.5, bottom);
            }
            ctx.stroke();
            const cx = Math.round((left + right) / 2) + 0.5;
            const cy = Math.round((top + bottom) / 2) + 0.5;
            if (showPrice) {
                vArrow(ctx, cx, a.y, b.y, color);
            }
            if (showTime) {
                hArrow(ctx, cy, a.x, b.x, color);
            }
            const lines: string[] = [];
            if (showPrice) {
                lines.push(priceChange(g, p0.price, p1.price));
            }
            if (showTime) {
                lines.push(`${barsBetween(g, p0.time, p1.time)} bars, ${duration(g, p0.time, p1.time)}`);
            }
            const below = !showPrice || !up;
            multiLabel(
                ctx,
                g,
                lines,
                cx,
                below ? bottom + 8 : top - 8,
                withAlpha(color, 0.95),
                below ? "top" : "bottom",
            );
        },
        hitTest: (g, x, y) => inRect(x, y, g.points[0], g.points[1], TOLERANCE),
    });

export const priceRange = measureTool("priceRange", "Price Range", icons.priceRange, true, false);
export const dateRange = measureTool("dateRange", "Date Range", icons.dateRange, false, true);
export const dateAndPriceRange = measureTool(
    "dateAndPriceRange",
    "Date and Price Range",
    icons.dateAndPriceRange,
    true,
    true,
);

export const measureTools = [longPosition, shortPosition, priceRange, dateRange, dateAndPriceRange];
