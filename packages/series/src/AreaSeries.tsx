import { accessor, applyStroke, withAlpha, type Accessor, type LineDash, type Theme } from "@reincharts/core";
import { verticalGradient } from "./geometry";
import { linePoints, traceArea, tracePath, type Curve, type Point } from "./path";
import { useSeries, type SeriesProps } from "./useSeries";

export interface AreaSeriesProps<T = any> extends SeriesProps {
    /** Value accessor (top edge). Default "close". */
    readonly y?: Accessor<T, number | undefined>;
    /** Per-point bottom edge (stacked areas, bands). Overrides `base`. */
    readonly y0?: Accessor<T, number | undefined>;
    /** Constant value the area is filled down (or up) to. Default: the bottom of the pane. */
    readonly base?: number;
    /** Line color. Defaults to theme.line. */
    readonly color?: string;
    /** Line width; 0 draws the area only. Default 2. */
    readonly lineWidth?: number;
    /** Line dash style. */
    readonly dash?: LineDash;
    /** Gradient color at the top of the area. Defaults to theme.area.top (or `color` at 28% opacity). */
    readonly topColor?: string;
    /** Gradient color at the bottom of the area. Defaults to theme.area.bottom (or `color` at 2% opacity). */
    readonly bottomColor?: string;
    /** Solid fill color (replaces the gradient). */
    readonly fill?: string;
    /** Interpolation. Default "linear". */
    readonly curve?: Curve;
    /** Connect across missing values instead of leaving gaps. */
    readonly connectGaps?: boolean;
}

/** Resolves an area's fill (solid color or vertical gradient). */
export const areaFill = (
    ctx: CanvasRenderingContext2D,
    theme: Theme,
    o: { color?: string; topColor?: string; bottomColor?: string; fill?: string },
    y0: number,
    y1: number,
) =>
    o.fill ??
    verticalGradient(
        ctx,
        y0,
        y1,
        o.topColor ?? (o.color ? withAlpha(o.color, 0.28) : theme.area.top),
        o.bottomColor ?? (o.color ? withAlpha(o.color, 0.02) : theme.area.bottom),
    );

const topOf = (pts: readonly (Point | null)[]) => pts.reduce((m, p) => (p ? Math.min(m, p[1]) : m), Infinity);

/** A line with a filled area below it (gradient by default). Also bands / stacked layers via `y0`. */
export function AreaSeries<T = any>({
    y = "close" as Accessor<T, number | undefined>,
    y0,
    base,
    color,
    lineWidth = 2,
    dash,
    topColor,
    bottomColor,
    fill,
    curve = "linear",
    connectGaps = false,
    ...rest
}: AreaSeriesProps<T>) {
    const value = accessor(y);
    const low = accessor(y0);
    useSeries<T>({
        ...rest,
        values: (d, i) => (low ? [low(d, i), value(d, i)] : value(d, i)),
        extentIncludes: base === undefined || low ? undefined : [base],
        base: (d, i) => value(d, i),
        color: (_d, _i, theme) => color ?? theme.line,
        legendValues: (d, i, { format }) => {
            const v = value(d, i);
            return [{ value: v === undefined || !Number.isFinite(v) ? "∅" : format(v) }];
        },
        draw(ctx, { data, start, end, x, y: yOf, theme, pane }) {
            const pts = linePoints(data, start, end, x, yOf, value);
            const bottom = low
                ? linePoints(data, start, end, x, yOf, low)
                : base !== undefined
                  ? yOf(base)
                  : (pane?.height ?? 0);
            const area = new Path2D();
            traceArea(area, pts, bottom, curve, connectGaps);
            const fillBottom =
                typeof bottom === "number" ? bottom : Math.max(...bottom.map((p) => (p ? p[1] : -Infinity)));
            ctx.fillStyle = areaFill(ctx, theme, { color, topColor, bottomColor, fill }, topOf(pts), fillBottom);
            ctx.fill(area);
            if (lineWidth > 0) {
                applyStroke(ctx, { color: color ?? theme.line, width: lineWidth, dash });
                ctx.lineJoin = "round";
                ctx.lineCap = "round";
                ctx.beginPath();
                tracePath(ctx, pts, curve, connectGaps);
                ctx.stroke();
            }
        },
    });
    return null;
}
