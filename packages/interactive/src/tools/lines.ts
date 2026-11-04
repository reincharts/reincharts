import { horizontalLine, lowerBound, upperBound, verticalLine, withAlpha } from "@reincharts/core";
import { arrowHead, fillPolygon, multiLabel, segment, strokeOf, text } from "../draw";
import { extendSegment, linearRegression, nearPolyline, nearSegment, TOLERANCE } from "../geometry";
import { icons } from "../icons";
import type * as React from "react";
import type { Drawing, DrawingStyle, Geometry, Pt, ToolDefinition } from "../types";
import { angleOf, barsBetween, defineTool, duration, lineCross, lineYAt, mid, priceChange } from "./common";

/** Draws `style.text` centered above segment ab, rotated along it. */
const lineText = (ctx: CanvasRenderingContext2D, g: Geometry, a: Pt, b: Pt) => {
    const value = g.drawing.style.text;
    if (!value) {
        return;
    }
    const m = mid(a, b);
    let angle = Math.atan2(b.y - a.y, b.x - a.x);
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        angle += Math.PI;
    }
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(angle);
    text(
        ctx,
        g,
        value,
        0,
        -6,
        g.drawing.style.textColor ?? g.color,
        "center",
        "bottom",
        g.drawing.style.fontSize ?? 13,
    );
    ctx.restore();
};

const twoPointLine = (
    type: string,
    label: string,
    icon: React.ReactElement,
    extend: DrawingStyle["extend"],
    extra: Partial<ToolDefinition> = {},
) =>
    defineTool({
        type,
        label,
        group: "lines",
        icon,
        points: 2,
        defaults: { width: 2, extend },
        styleControls: ["color", "width", "dash", "extend", "text"],
        draw(ctx, g, d) {
            const [a, b] = g.points;
            const [s, e] = g.extend(a, b, d.style.extend);
            strokeOf(ctx, g);
            segment(ctx, s, e);
            lineText(ctx, g, a, b);
        },
        hitTest(g, x, y) {
            const [a, b] = g.points;
            const [s, e] = g.extend(a, b, g.drawing.style.extend);
            return nearSegment(x, y, s, e);
        },
        crossValue: lineCross,
        ...extra,
    });

export const trendLine = twoPointLine("trendLine", "Trend Line", icons.trendLine, "none");
export const ray = twoPointLine("ray", "Ray", icons.ray, "right");
export const extendedLine = twoPointLine("extendedLine", "Extended Line", icons.extendedLine, "both");

export const infoLine = twoPointLine("infoLine", "Info Line", icons.infoLine, "none", {
    draw(ctx, g, d) {
        const [a, b] = g.points;
        const [s, e] = g.extend(a, b, d.style.extend);
        strokeOf(ctx, g);
        segment(ctx, s, e);
        const [p0, p1] = d.points;
        const lines = [
            priceChange(g, p0.price, p1.price),
            `${barsBetween(g, p0.time, p1.time)} bars, ${duration(g, p0.time, p1.time)}`,
            `${angleOf(a, b).toFixed(2)}°`,
        ];
        const below = b.y >= a.y;
        multiLabel(ctx, g, lines, b.x, b.y + (below ? 14 : -14), withAlpha(g.color, 0.9), below ? "top" : "bottom");
    },
});

export const arrow = twoPointLine("arrow", "Arrow", icons.arrow, "none", {
    draw(ctx, g, d) {
        const [a, b] = g.points;
        const w = d.style.width ?? 2;
        const size = 8 + w * 2;
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const k = len > size ? (len - size * 0.8) / len : 0;
        strokeOf(ctx, g);
        segment(ctx, a, { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
        arrowHead(ctx, a, b, g.color, size);
        lineText(ctx, g, a, b);
    },
});

const priceLabel = (d: Drawing) => (d.style.axisLabel === false ? {} : { prices: [d.points[0].price] });

/** Draws `style.text` just above a horizontal line at y, aligned at x. */
const levelText = (ctx: CanvasRenderingContext2D, g: Geometry, x: number, y: number, align: CanvasTextAlign) => {
    const { style } = g.drawing;
    if (style.text) {
        text(ctx, g, style.text, x, y - 5, style.textColor ?? g.color, align, "bottom", style.fontSize ?? 12);
    }
};

export const horizontalLineTool = defineTool({
    type: "horizontalLine",
    label: "Horizontal Line",
    group: "lines",
    icon: icons.horizontalLine,
    points: 1,
    defaults: { width: 1 },
    styleControls: ["color", "width", "dash", "text"],
    draw(ctx, g) {
        const { y } = g.points[0];
        strokeOf(ctx, g);
        horizontalLine(ctx, y, 0, g.width);
        levelText(ctx, g, g.width - 8, y, "right");
    },
    hitTest: (g, _x, y) => Math.abs(y - g.points[0].y) <= TOLERANCE,
    crossValue: (d) => d.points[0].price,
    axisLabels: priceLabel,
});

export const horizontalRay = defineTool({
    type: "horizontalRay",
    label: "Horizontal Ray",
    group: "lines",
    icon: icons.horizontalRay,
    points: 1,
    defaults: { width: 1 },
    styleControls: ["color", "width", "dash", "text"],
    draw(ctx, g) {
        const { x, y } = g.points[0];
        strokeOf(ctx, g);
        horizontalLine(ctx, y, x, g.width);
        levelText(ctx, g, x + 4, y, "left");
    },
    hitTest: (g, x, y) => x >= g.points[0].x - TOLERANCE && Math.abs(y - g.points[0].y) <= TOLERANCE,
    crossValue: (d, logical, logicalOf) => (logical >= logicalOf(d.points[0].time) ? d.points[0].price : undefined),
    axisLabels: priceLabel,
});

export const verticalLineTool = defineTool({
    type: "verticalLine",
    label: "Vertical Line",
    group: "lines",
    icon: icons.verticalLine,
    points: 1,
    defaults: { width: 1 },
    draw(ctx, g) {
        strokeOf(ctx, g);
        verticalLine(ctx, g.points[0].x, 0, g.height);
    },
    hitTest: (g, x) => Math.abs(x - g.points[0].x) <= TOLERANCE,
    axisLabels: (d) => ({ times: [d.points[0].time] }),
});

export const crossLine = defineTool({
    type: "crossLine",
    label: "Cross Line",
    group: "lines",
    icon: icons.crossLine,
    points: 1,
    defaults: { width: 1 },
    draw(ctx, g) {
        const { x, y } = g.points[0];
        strokeOf(ctx, g);
        verticalLine(ctx, x, 0, g.height);
        horizontalLine(ctx, y, 0, g.width);
    },
    hitTest: (g, x, y) => Math.abs(x - g.points[0].x) <= TOLERANCE || Math.abs(y - g.points[0].y) <= TOLERANCE,
    crossValue: (d) => d.points[0].price,
    axisLabels: (d) => ({ prices: [d.points[0].price], times: [d.points[0].time] }),
});

// ------------------------------------------------------------ channels

/** Parallel channel geometry: base line a-b and the parallel a2-b2 (third point stored above/below `a`). */
const channel = (g: Geometry) => {
    const [a, b, c] = g.points;
    const dy = c ? c.y - a.y : 0;
    const a2 = { x: a.x, y: a.y + dy };
    const b2 = { x: b.x, y: b.y + dy };
    const ext = g.drawing.style.extend;
    const [s1, e1] = g.extend(a, b, ext);
    const [s2, e2] = g.extend(a2, b2, ext);
    return { a, b, a2, b2, s1, e1, s2, e2, dy, hasWidth: !!c };
};

export const parallelChannel = defineTool({
    type: "parallelChannel",
    label: "Parallel Channel",
    group: "lines",
    icon: icons.parallelChannel,
    points: 3,
    defaults: { width: 2, extend: "none" },
    styleControls: ["color", "width", "dash", "fill", "extend"],
    build(pts) {
        const [a, b, c] = pts;
        return c ? [a, b, { x: a.x, y: a.y + (c.y - lineYAt(a, b, c.x)) }] : pts;
    },
    draw(ctx, g) {
        const c = channel(g);
        if (c.hasWidth) {
            fillPolygon(ctx, [c.s1, c.e1, c.e2, c.s2], g.drawing.style.fill ?? withAlpha(g.color, 0.12));
        }
        strokeOf(ctx, g);
        segment(ctx, c.s1, c.e1);
        if (c.hasWidth) {
            segment(ctx, c.s2, c.e2);
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            segment(ctx, mid(c.s1, c.s2), mid(c.e1, c.e2));
        }
    },
    hitTest(g, x, y) {
        const c = channel(g);
        return (
            nearSegment(x, y, c.s1, c.e1) ||
            (c.hasWidth && (nearSegment(x, y, c.s2, c.e2) || nearSegment(x, y, mid(c.s1, c.s2), mid(c.e1, c.e2))))
        );
    },
    handles(g) {
        const c = channel(g);
        return c.hasWidth ? [c.a, c.b, c.a2, c.b2] : [c.a, c.b];
    },
    dragHandle(g, i, p) {
        const c = channel(g);
        switch (i) {
            case 0:
                return [p, c.b, { x: p.x, y: p.y + c.dy }];
            case 1:
                return [c.a, p, { x: c.a.x, y: c.a.y + c.dy }];
            default: {
                const base = i === 2 ? c.a : c.b;
                return [c.a, c.b, { x: c.a.x, y: c.a.y + (p.y - lineYAt(c.a, c.b, base.x)) }];
            }
        }
    },
});

/** Linear regression of the source values between the two points (logical x). */
export const regression = (g: Geometry) => {
    const { engine } = g;
    const [p0, p1] = g.drawing.points;
    const l0 = g.logical(p0.time);
    const l1 = g.logical(p1.time);
    const lo = Math.min(l0, l1);
    const hi = Math.max(l0, l1);
    const xs: number[] = [];
    const ys: number[] = [];
    if (engine.sorted) {
        const start = lowerBound(engine.xs, lo - 1e-9);
        const end = upperBound(engine.xs, hi + 1e-9);
        for (let i = start; i < end; i++) {
            const v = g.value(i);
            if (v !== undefined) {
                xs.push(engine.xs[i]);
                ys.push(v);
            }
        }
    }
    const r = linearRegression(xs, ys);
    const dev = g.drawing.style.mode === "raff" ? r.maxDev : r.stdDev * (g.drawing.style.deviation ?? 2);
    const valid = xs.length >= 2;
    const priceAt = (l: number) => (valid ? r.intercept + r.slope * l : l === l0 ? p0.price : p1.price);
    const [a, b] = g.points;
    const line = (offset: number): [Pt, Pt] => [
        { x: a.x, y: g.y(priceAt(l0) + offset) },
        { x: b.x, y: g.y(priceAt(l1) + offset) },
    ];
    const ext = g.drawing.style.extend;
    const ex = (s: [Pt, Pt]) => extendSegment(s[0], s[1], ext, g.width, g.height);
    return {
        valid,
        base: ex(line(0)),
        upper: ex(line(dev)),
        lower: ex(line(-dev)),
        handles: line(0),
        count: xs.length,
    };
};

export const regressionChannel = defineTool({
    type: "regressionChannel",
    label: "Regression Trend",
    group: "lines",
    icon: icons.regressionChannel,
    points: 2,
    defaults: { width: 1, deviation: 2, extend: "none" },
    styleControls: ["color", "width", "fill", "extend"],
    draw(ctx, g) {
        const r = regression(g);
        if (r.valid) {
            fillPolygon(
                ctx,
                [r.upper[0], r.upper[1], r.base[1], r.base[0]],
                g.drawing.style.fill ?? withAlpha(g.color, 0.12),
            );
            fillPolygon(ctx, [r.base[0], r.base[1], r.lower[1], r.lower[0]], withAlpha(g.theme.down, 0.1));
            strokeOf(ctx, g);
            segment(ctx, r.upper[0], r.upper[1]);
            strokeOf(ctx, g, g.theme.down);
            segment(ctx, r.lower[0], r.lower[1]);
        }
        strokeOf(ctx, g);
        ctx.setLineDash([5, 4]);
        segment(ctx, r.base[0], r.base[1]);
    },
    hitTest(g, x, y) {
        const r = regression(g);
        return [r.base, r.upper, r.lower].some(([s, e]) => nearSegment(x, y, s, e));
    },
    handles: (g) => regression(g).handles,
    dragHandle(g, i, p) {
        const pts = [...g.points];
        pts[i] = { x: p.x, y: pts[i].y };
        return pts;
    },
});

const pitchforkLines = (g: Geometry) => {
    const [a, b, c] = g.points;
    if (!c) {
        return null;
    }
    const m = mid(b, c);
    const dx = m.x - a.x;
    const dy = m.y - a.y;
    const far = (p: Pt) => extendSegment(p, { x: p.x + dx, y: p.y + dy }, "right", g.width, g.height)[1];
    return { a, b, c, m, median: far(a), tb: far(b), tc: far(c) };
};

export const pitchfork = defineTool({
    type: "pitchfork",
    label: "Pitchfork",
    group: "lines",
    icon: icons.pitchfork,
    points: 3,
    defaults: { width: 2 },
    styleControls: ["color", "width", "dash", "fill"],
    draw(ctx, g) {
        const f = pitchforkLines(g);
        strokeOf(ctx, g);
        if (!f) {
            segment(ctx, g.points[0], g.points[1]);
            return;
        }
        const fill = g.drawing.style.fill ?? withAlpha(g.color, 0.1);
        fillPolygon(ctx, [f.b, f.tb, f.median, f.m], fill);
        fillPolygon(ctx, [f.m, f.median, f.tc, f.c], withAlpha(g.theme.palette[1], 0.1));
        segment(ctx, f.a, f.median);
        segment(ctx, f.b, f.tb);
        segment(ctx, f.c, f.tc);
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        segment(ctx, f.b, f.c);
    },
    hitTest(g, x, y) {
        const f = pitchforkLines(g);
        if (!f) {
            return nearSegment(x, y, g.points[0], g.points[1]);
        }
        return (
            nearSegment(x, y, f.a, f.median) ||
            nearSegment(x, y, f.b, f.tb) ||
            nearSegment(x, y, f.c, f.tc) ||
            nearPolyline(x, y, [f.b, f.c])
        );
    },
});

export const lineTools = [
    trendLine,
    ray,
    infoLine,
    extendedLine,
    arrow,
    horizontalLineTool,
    horizontalRay,
    verticalLineTool,
    crossLine,
    parallelChannel,
    regressionChannel,
    pitchfork,
];
