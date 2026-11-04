import { accessor, applyStroke, type Accessor, type LineDash } from "@reincharts/core";
import { traceMarker } from "./marker";
import { linePoints, tracePath, type Curve } from "./path";
import { useSeries, type SeriesProps } from "./useSeries";

export interface LineSeriesProps<T = any> extends SeriesProps {
    /** Value accessor. Default "close". */
    readonly y?: Accessor<T, number | undefined>;
    /** Line color. Defaults to theme.line. */
    readonly color?: string;
    /** Line width in pixels. Default 2. */
    readonly width?: number;
    /** Dash style. Default solid. */
    readonly dash?: LineDash;
    /** Interpolation: "linear" (default), "monotone" (smooth spline without overshoot) or a step variant. */
    readonly curve?: Curve;
    /** Connect across missing values instead of leaving gaps. */
    readonly connectGaps?: boolean;
    /** Draw a dot at every point: always (`true`) or only when bars are wide enough (`"auto"`). Default false. */
    readonly points?: boolean | "auto";
}

/** A line through one value per bar (also step lines and smooth monotone splines). */
export function LineSeries<T = any>({
    y = "close" as Accessor<T, number | undefined>,
    color,
    width = 2,
    dash,
    curve = "linear",
    connectGaps = false,
    points = false,
    ...rest
}: LineSeriesProps<T>) {
    const value = accessor(y);
    useSeries<T>({
        ...rest,
        values: (d, i) => value(d, i),
        color: (_d, _i, theme) => color ?? theme.line,
        draw(ctx, { data, start, end, x, y: yOf, theme, barSpacing }) {
            const resolved = color ?? theme.line;
            const pts = linePoints(data, start, end, x, yOf, value);
            applyStroke(ctx, { color: resolved, width, dash });
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.beginPath();
            tracePath(ctx, pts, curve, connectGaps);
            ctx.stroke();
            if (points === true || (points === "auto" && barSpacing > 12)) {
                const dots = new Path2D();
                for (const p of pts) {
                    if (p) {
                        traceMarker(dots, "circle", p[0], p[1], width * 2 + 3);
                    }
                }
                ctx.fillStyle = resolved;
                ctx.fill(dots);
            }
        },
    });
    return null;
}
