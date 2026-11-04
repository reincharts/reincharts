import {
    applyStroke,
    font,
    horizontalLine,
    useChart,
    useRenderable,
    verticalLine,
    withAlpha,
    type ChartEngine,
    type LineDash,
    type Theme,
} from "@reincharts/core";
import { pixelX, type DataX } from "./coords";

interface ReferenceBase {
    /** Price scale id. Default "right". */
    readonly scale?: string;
    /** Text label. */
    readonly label?: string;
    /** Label color. Defaults to the element color (lines / dots) or theme.textMuted (areas). */
    readonly labelColor?: string;
    /** Draw order; negative values go behind series. */
    readonly zIndex?: number;
}

const labelFont = (theme: Theme) => font(theme, theme.fontSize, "500");

/** Half a bar in pixels in index mode (areas cover whole bars), 0 in linear mode. */
const halfBar = (engine: ChartEngine, barSpacing: number) => (engine.options.xMode === "linear" ? 0 : barSpacing / 2);

export interface ReferenceLineProps extends ReferenceBase {
    /** Horizontal line at this value. */
    readonly y?: number;
    /** Vertical line at this data x (Date / number / category). */
    readonly x?: DataX;
    /** Defaults to theme.textMuted. */
    readonly color?: string;
    /** Line width. Default 1. */
    readonly width?: number;
    /** Line dash. Default "dashed". */
    readonly dash?: LineDash;
    /** Label placement along the line: "start" (left / top), "center" or "end" (right / bottom). Default "end". */
    readonly labelPosition?: "start" | "center" | "end";
}

/** A horizontal (y) or vertical (x) reference line with an optional label (thresholds, targets, events). */
export function ReferenceLine({
    y,
    x,
    color,
    width = 1,
    dash = "dashed",
    label,
    labelColor,
    labelPosition = "end",
    scale,
    zIndex = 20,
}: ReferenceLineProps) {
    const engine = useChart();
    useRenderable({
        scale,
        zIndex,
        draw(ctx, { pane, theme, y: yOf }) {
            if (!pane) {
                return;
            }
            const c = color ?? theme.textMuted;
            applyStroke(ctx, { color: c, width, dash });
            ctx.font = labelFont(theme);
            ctx.fillStyle = labelColor ?? c;
            if (y !== undefined) {
                const py = yOf(y);
                horizontalLine(ctx, py, 0, pane.width);
                if (label) {
                    ctx.textAlign =
                        labelPosition === "start" ? "left" : labelPosition === "center" ? "center" : "right";
                    ctx.textBaseline = "bottom";
                    const lx =
                        labelPosition === "start" ? 6 : labelPosition === "center" ? pane.width / 2 : pane.width - 6;
                    ctx.fillText(label, lx, py < 18 ? py + 16 : py - 3);
                }
            }
            if (x !== undefined) {
                const px = pixelX(engine, x);
                verticalLine(ctx, px, 0, pane.height);
                if (label) {
                    const right = px + 120 < pane.width;
                    ctx.textAlign = right ? "left" : "right";
                    ctx.textBaseline =
                        labelPosition === "end" ? "bottom" : labelPosition === "center" ? "middle" : "top";
                    const ly =
                        labelPosition === "end" ? pane.height - 6 : labelPosition === "center" ? pane.height / 2 : 6;
                    ctx.fillText(label, right ? px + 5 : px - 5, ly);
                }
            }
        },
    });
    return null;
}

export interface ReferenceAreaProps extends ReferenceBase {
    /** Left edge (data x). Omit to extend to the plot edge. */
    readonly x1?: DataX;
    /** Right edge (data x). Omit to extend to the plot edge. */
    readonly x2?: DataX;
    /** Bottom value. Omit to extend to the plot edge. */
    readonly y1?: number;
    /** Top value. Omit to extend to the plot edge. */
    readonly y2?: number;
    /** Fill color. Defaults to theme.line. */
    readonly color?: string;
    /** Fill opacity applied to `color`. Default 0.12. */
    readonly opacity?: number;
    /** Border color (none by default). */
    readonly stroke?: string;
    /** Border dash. */
    readonly dash?: LineDash;
    /** Horizontal label alignment inside the area (label sits at the top). Default "left". */
    readonly labelAlign?: "left" | "center" | "right";
}

/** A highlighted rectangle / band between x and / or y values (ranges, sessions, target zones). */
export function ReferenceArea({
    x1,
    x2,
    y1,
    y2,
    color,
    opacity = 0.12,
    stroke,
    dash,
    label,
    labelColor,
    labelAlign = "left",
    scale,
    zIndex = -20,
}: ReferenceAreaProps) {
    const engine = useChart();
    useRenderable({
        scale,
        zIndex,
        draw(ctx, { pane, theme, y: yOf, barSpacing }) {
            if (!pane) {
                return;
            }
            const half = halfBar(engine, barSpacing);
            // given x edges cover whole bars in index mode; missing edges extend past the plot
            const xs = [x1, x2].filter((v): v is DataX => v !== undefined).map((v) => pixelX(engine, v));
            let left = xs.length ? Math.min(...xs) - half : -1;
            let right = xs.length === 2 ? Math.max(...xs) + half : pane.width + 1;
            if (xs.length === 1 && x1 === undefined) {
                left = -1;
                right = xs[0] + half;
            }
            const ya = y1 === undefined ? pane.height + 1 : yOf(y1);
            const yb = y2 === undefined ? -1 : yOf(y2);
            const top = Math.round(Math.min(ya, yb));
            const bottom = Math.round(Math.max(ya, yb));
            left = Math.round(left);
            right = Math.round(right);
            if (!Number.isFinite(left + right + top + bottom) || right <= left || bottom <= top) {
                return;
            }
            const c = color ?? theme.line;
            ctx.fillStyle = withAlpha(c, opacity);
            ctx.fillRect(left, top, right - left, bottom - top);
            if (stroke) {
                applyStroke(ctx, { color: stroke, dash });
                ctx.strokeRect(left + 0.5, top + 0.5, right - left - 1, bottom - top - 1);
            }
            if (label) {
                ctx.font = labelFont(theme);
                ctx.fillStyle = labelColor ?? theme.textMuted;
                ctx.textAlign = labelAlign;
                ctx.textBaseline = "top";
                const l = Math.max(left, 0);
                const r = Math.min(right, pane.width);
                const lx = labelAlign === "left" ? l + 6 : labelAlign === "right" ? r - 6 : (l + r) / 2;
                ctx.fillText(label, lx, Math.max(top, 0) + 6, Math.max(0, r - l - 12));
            }
        },
    });
    return null;
}

export interface ReferenceDotProps extends ReferenceBase {
    /** Data x (Date / number / category). */
    readonly x: DataX;
    /** Value on the scale. */
    readonly y: number;
    /** Radius. Default 5. */
    readonly r?: number;
    /** Fill. Defaults to theme.line. */
    readonly color?: string;
    /** Ring color. Defaults to theme.background. */
    readonly stroke?: string;
    /** Ring width. Default 2. */
    readonly strokeWidth?: number;
}

/** A dot at a data point with an optional label above it (highlights, peaks, events). */
export function ReferenceDot({
    x,
    y,
    r = 5,
    color,
    stroke,
    strokeWidth = 2,
    label,
    labelColor,
    scale,
    zIndex = 30,
}: ReferenceDotProps) {
    const engine = useChart();
    useRenderable({
        scale,
        zIndex,
        draw(ctx, { theme, y: yOf }) {
            const px = pixelX(engine, x);
            const py = yOf(y);
            if (!Number.isFinite(px) || !Number.isFinite(py)) {
                return;
            }
            const c = color ?? theme.line;
            if (strokeWidth > 0) {
                ctx.fillStyle = stroke ?? theme.background;
                ctx.beginPath();
                ctx.arc(px, py, r + strokeWidth, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
            if (label) {
                ctx.font = labelFont(theme);
                ctx.fillStyle = labelColor ?? c;
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.fillText(label, px, py - r - strokeWidth - 3);
            }
        },
    });
    return null;
}
