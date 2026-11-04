import {
    applyStroke,
    contrastText,
    drawLabel,
    font,
    horizontalLine,
    useChart,
    useRenderable,
    type ChartEngine,
    type DrawScope,
    type LineDash,
} from "@reincharts/core";
import { axesOf, axisBand, axisLabelHeight, drawAxisLabel } from "./labels";

export interface ValueMarker {
    /** Pane-relative pixel y. */
    readonly y: number;
    /** Text of the axis label. */
    readonly text: string;
    readonly color: string;
    readonly textColor?: string;
    /** Draw a horizontal line across the plot. */
    readonly line?: boolean;
    readonly lineColor?: string;
    readonly lineWidth?: number;
    readonly lineStyle?: LineDash;
    /** Draw the label on the price axes of `scale`. */
    readonly axisLabel?: boolean;
    /** Text drawn in a box at the right edge of the plot . */
    readonly title?: string;
}

/**
 * Draws price lines / axis labels for one price scale of a pane (ctx at the pane plot origin, unclipped).
 * Axis labels on the same side are pushed apart so they never overlap.
 */
export const drawValueMarkers = (
    ctx: CanvasRenderingContext2D,
    scope: DrawScope,
    scaleId: string,
    markers: readonly ValueMarker[],
) => {
    const { pane, layout, theme, engine } = scope;
    if (!pane || pane.height <= 0) {
        return;
    }
    const visible = markers.filter((m) => Number.isFinite(m.y) && m.y >= 0 && m.y <= pane.height);
    for (const m of visible) {
        if (m.line) {
            applyStroke(ctx, { color: m.lineColor ?? m.color, width: m.lineWidth ?? 1, dash: m.lineStyle ?? "dotted" });
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, pane.width, pane.height);
            ctx.clip();
            horizontalLine(ctx, m.y, 0, pane.width);
            ctx.restore();
        }
        if (m.title) {
            drawLabel(ctx, {
                text: m.title,
                x: pane.width - 4,
                y: m.y,
                align: "right",
                background: m.color,
                color: m.textColor ?? contrastText(m.color),
                font: font(theme),
                paddingX: 6,
                paddingY: 3,
            });
        }
    }
    ctx.setLineDash([]);
    const labels = visible.filter((m) => m.axisLabel !== false).sort((a, b) => a.y - b.y);
    if (!labels.length) {
        return;
    }
    const h = axisLabelHeight(theme);
    // resolve overlaps top-down, then pull back inside the pane bottom-up
    const ys = labels.map((m) => Math.min(Math.max(m.y, h / 2), pane.height - h / 2));
    for (let i = 1; i < ys.length; i++) {
        ys[i] = Math.max(ys[i], ys[i - 1] + h);
    }
    for (let i = ys.length - 1; i >= 0; i--) {
        ys[i] = Math.min(ys[i], (i === ys.length - 1 ? pane.height + h / 2 : ys[i + 1]) - h);
    }
    for (const axis of axesOf(engine as ChartEngine, pane.id, scaleId)) {
        const side = axis.side ?? "right";
        labels.forEach((m, i) =>
            drawAxisLabel(ctx, {
                ...axisBand(layout, side),
                y: ys[i],
                side,
                text: m.text,
                background: m.color,
                color: m.textColor ?? contrastText(m.color),
                theme,
            }),
        );
    }
};

export interface PriceLineProps {
    /** Price (raw value on the scale). */
    readonly price: number;
    /** Line and label color. Defaults to theme.line. */
    readonly color?: string;
    /** Label text color. Defaults to black / white depending on `color`. */
    readonly textColor?: string;
    /** Optional title drawn at the right edge of the plot. */
    readonly title?: string;
    /** Line dash. Default "dashed". */
    readonly lineStyle?: LineDash;
    /** Line width. Default 1. */
    readonly lineWidth?: number;
    /** Draw the line across the plot. Default true. */
    readonly lineVisible?: boolean;
    /** Show a colored label with the price on the price axis. Default true. */
    readonly axisLabel?: boolean;
    /** Price scale id. Default "right". */
    readonly scale?: string;
    /** Custom label text. Defaults to the scale's formatting. */
    readonly format?: (price: number) => string;
    readonly zIndex?: number;
}

/** A horizontal price line with an axis label and optional title. */
export function PriceLine({
    price,
    color,
    textColor,
    title,
    lineStyle = "dashed",
    lineWidth = 1,
    lineVisible = true,
    axisLabel = true,
    scale = "right",
    format,
    zIndex = 110,
}: PriceLineProps) {
    const engine = useChart();
    useRenderable({
        scale,
        clip: false,
        zIndex,
        axisLabels: axisLabel ? (paneId) => [{ scale, y: engine.getScale(paneId, scale).toY(price) }] : undefined,
        draw(ctx, scope) {
            const c = color ?? scope.theme.line;
            const s = scope.scale;
            drawValueMarkers(ctx, scope, scale, [
                {
                    y: scope.y(price),
                    text: format ? format(price) : (s?.format(price) ?? String(price)),
                    color: c,
                    textColor,
                    line: lineVisible,
                    lineStyle,
                    lineWidth,
                    axisLabel,
                    title,
                },
            ]);
        },
    });
    return null;
}
