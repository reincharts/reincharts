import { drawLabel, font as themeFont, useChart, useRenderable, type DrawScope } from "@reincharts/core";
import { fromEdge, pixelX, type DataX } from "./coords";
import { svgPath } from "./shapes";

export interface LabelProps {
    /** Text to draw (optional with `path`). */
    readonly text?: string;
    /** x in data units (Date / number / category) or pixels (see `units`). Default: plot center. */
    readonly x?: DataX;
    /** y as a value on the scale or pixels (see `units`). Default: plot middle. */
    readonly y?: number;
    /** "data" (default) positions with the chart scales; "pixel" uses plot pixels (negative = from the right / bottom). */
    readonly units?: "data" | "pixel";
    /** Pixel offset applied after positioning. */
    readonly dx?: number;
    readonly dy?: number;
    /** Horizontal alignment relative to the point. Default "left". */
    readonly align?: "left" | "center" | "right";
    /** Vertical alignment relative to the point. Default "middle". */
    readonly baseline?: "top" | "middle" | "bottom";
    /** Full CSS font; overrides fontSize / fontWeight. */
    readonly font?: string;
    /** Font size in pixels. Defaults to theme.fontSize + 1. */
    readonly fontSize?: number;
    readonly fontWeight?: string | number;
    /** Text (and path) color. Defaults to theme.text. */
    readonly color?: string;
    /** Draws the text inside a filled rounded box. */
    readonly background?: string;
    /** Box border color (with `background`). */
    readonly border?: string;
    /** Rotation in degrees around the point. */
    readonly rotate?: number;
    /** SVG path drawn at the point; its (0, 0) is placed on the point. */
    readonly path?: string;
    /** Scale factor for `path`. Default 1. */
    readonly pathScale?: number;
    /** Stroke color for `path` (filled with `color` otherwise). */
    readonly pathStroke?: string;
    /** Pane id; `null` draws relative to the whole chart (pixel units). Defaults to the enclosing pane. */
    readonly pane?: string | null;
    /** Price scale id. Default "right". */
    readonly scale?: string;
    /** Draw over series (default 60) or below them (negative). */
    readonly zIndex?: number;
}

/** Text (and/or an SVG path) at a data or pixel position. */
export function Label({
    text,
    x,
    y,
    units = "data",
    dx = 0,
    dy = 0,
    align = "left",
    baseline = "middle",
    font,
    fontSize,
    fontWeight = "normal",
    color,
    background,
    border,
    rotate = 0,
    path,
    pathScale = 1,
    pathStroke,
    pane,
    scale,
    zIndex = 60,
}: LabelProps) {
    const engine = useChart();
    useRenderable({
        pane,
        scale,
        zIndex,
        draw(ctx, scope: DrawScope) {
            const { theme, layout } = scope;
            const area = scope.pane ?? { width: layout.width, height: layout.height };
            const offsetX = scope.pane ? 0 : layout.plotLeft;
            let px: number;
            let py: number;
            if (units === "pixel" || x === undefined) {
                px = x === undefined ? area.width / 2 : fromEdge(Number(x), area.width);
            } else {
                px = offsetX + pixelX(engine, x);
            }
            if (units === "pixel" || y === undefined || !scope.pane) {
                py = y === undefined ? area.height / 2 : fromEdge(y, area.height);
            } else {
                py = scope.y(y);
            }
            if (!Number.isFinite(px) || !Number.isFinite(py)) {
                return;
            }
            const c = color ?? theme.text;
            ctx.translate(px + dx, py + dy);
            if (rotate) {
                ctx.rotate((rotate * Math.PI) / 180);
            }
            if (path) {
                ctx.save();
                ctx.scale(pathScale, pathScale);
                if (pathStroke) {
                    ctx.strokeStyle = pathStroke;
                    ctx.lineWidth = 1 / pathScale;
                    ctx.stroke(svgPath(path));
                } else {
                    ctx.fillStyle = c;
                    ctx.fill(svgPath(path));
                }
                ctx.restore();
            }
            if (!text) {
                return;
            }
            const f = font ?? themeFont(theme, fontSize ?? theme.fontSize + 1, String(fontWeight));
            if (background) {
                drawLabel(ctx, { text, x: 0, y: 0, align, baseline, background, border, color: c, font: f });
                return;
            }
            ctx.font = f;
            ctx.fillStyle = c;
            ctx.textAlign = align;
            ctx.textBaseline = baseline;
            ctx.fillText(text, 0, 0);
        },
    });
    return null;
}
