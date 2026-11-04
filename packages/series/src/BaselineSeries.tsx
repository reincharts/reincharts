import { accessor, applyStroke, horizontalLine, withAlpha, type Accessor, type LineDash } from "@reincharts/core";
import { verticalGradient } from "./geometry";
import { linePoints, traceArea, tracePath, type Curve } from "./path";
import { useSeries, type SeriesProps } from "./useSeries";

export interface BaselineSeriesProps<T = any> extends SeriesProps {
    /** Value accessor. Default "close". */
    readonly y?: Accessor<T, number | undefined>;
    /** Base value separating the two colors. Default: the price at the vertical middle of the pane (a 50% base level). */
    readonly base?: number;
    /** Line / fill color above the base. Defaults to theme.up. */
    readonly topColor?: string;
    /** Line / fill color below the base. Defaults to theme.down. */
    readonly bottomColor?: string;
    /** Opacity of the fills at their far edge (they fade to 1/6 of it at the base). Default 0.28. */
    readonly fillOpacity?: number;
    /** Line width; 0 draws the fills only. Default 2. */
    readonly lineWidth?: number;
    /** Draw the base level as a dotted line. Default true. */
    readonly showBase?: boolean;
    /** Base line dash. Default "dotted". */
    readonly baseDash?: LineDash;
    /** Interpolation. Default "linear". */
    readonly curve?: Curve;
    /** Connect across missing values instead of leaving gaps. */
    readonly connectGaps?: boolean;
}

/** A line whose fill and color switch between two colors above / below a base value. */
export function BaselineSeries<T = any>({
    y = "close" as Accessor<T, number | undefined>,
    base,
    topColor,
    bottomColor,
    fillOpacity = 0.28,
    lineWidth = 2,
    showBase = true,
    baseDash = "dotted",
    curve = "linear",
    connectGaps = false,
    ...rest
}: BaselineSeriesProps<T>) {
    const value = accessor(y);
    useSeries<T>({
        ...rest,
        values: (d, i) => value(d, i),
        extentIncludes: base === undefined ? undefined : [base],
        color: (d, i, theme) =>
            (value(d, i) ?? 0) >= (base ?? -Infinity) ? (topColor ?? theme.up) : (bottomColor ?? theme.down),
        draw(ctx, { data, start, end, x, y: yOf, theme, pane, scale }) {
            const w = pane?.width ?? 0;
            const h = pane?.height ?? 0;
            const baseY = Math.round(base !== undefined ? yOf(base) : scale ? h / 2 : 0);
            const pts = linePoints(data, start, end, x, yOf, value);
            const area = new Path2D();
            traceArea(area, pts, baseY, curve, connectGaps);
            const line = new Path2D();
            tracePath(line, pts, curve, connectGaps);
            const top = topColor ?? theme.up;
            const bottom = bottomColor ?? theme.down;
            const faint = fillOpacity / 6;
            let highest = baseY;
            let lowest = baseY;
            for (const p of pts) {
                if (p) {
                    highest = Math.min(highest, p[1]);
                    lowest = Math.max(lowest, p[1]);
                }
            }
            // gradients run from the base to the farthest point of the line on each side
            const sides = [
                {
                    color: top,
                    clip: [0, Math.min(h, baseY)],
                    grad: [highest, baseY],
                    from: withAlpha(top, fillOpacity),
                    to: withAlpha(top, faint),
                },
                {
                    color: bottom,
                    clip: [Math.max(0, baseY), h],
                    grad: [baseY, lowest],
                    from: withAlpha(bottom, faint),
                    to: withAlpha(bottom, fillOpacity),
                },
            ] as const;
            for (const side of sides) {
                const [y0, y1] = side.clip;
                if (y1 <= y0) {
                    continue;
                }
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, y0, w, y1 - y0);
                ctx.clip();
                ctx.fillStyle = verticalGradient(ctx, side.grad[0], side.grad[1], side.from, side.to);
                ctx.fill(area);
                if (lineWidth > 0) {
                    applyStroke(ctx, { color: side.color, width: lineWidth });
                    ctx.lineJoin = "round";
                    ctx.lineCap = "round";
                    ctx.stroke(line);
                }
                ctx.restore();
            }
            if (showBase) {
                applyStroke(ctx, { color: theme.textMuted, width: 1, dash: baseDash });
                horizontalLine(ctx, baseY, 0, w);
            }
        },
    });
    return null;
}
