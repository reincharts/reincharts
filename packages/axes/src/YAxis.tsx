import { applyStroke, crisp, font, useChart, usePaneId, useRenderable, type PriceTick } from "@reincharts/core";
import * as React from "react";

export interface YAxisProps {
    /** Side of the plot. Default "right". */
    readonly side?: "left" | "right";
    /** Price scale id shown by this axis. Default "right". */
    readonly scale?: string;
    /** Fixed width in pixels; auto-sized to the labels by default. */
    readonly width?: number;
    /** Approximate pixel distance between ticks. Default 40. */
    readonly tickSpacing?: number;
    /** Custom tick label. */
    readonly tickFormat?: (tick: PriceTick) => string;
    /** Draw the axis line. Default true. */
    readonly showLine?: boolean;
    /** Draw small tick marks. Default true. */
    readonly showTicks?: boolean;
    /** Draw tick labels. Default true. */
    readonly showTickLabels?: boolean;
    /** Label color. Defaults to theme.axis.text. */
    readonly color?: string;
    /** Axis line and tick color. Defaults to theme.axis.line. */
    readonly lineColor?: string;
}

/** A price / value axis for one scale of the enclosing pane. Drag to scale, double-click to auto-fit. */
export function YAxis({
    side = "right",
    scale = "right",
    width,
    tickSpacing = 40,
    tickFormat,
    showLine = true,
    showTicks = true,
    showTickLabels = true,
    color,
    lineColor,
}: YAxisProps) {
    const engine = useChart();
    const paneId = usePaneId();
    React.useLayoutEffect(
        () => engine.registerAxis({ kind: "price", paneId, side, scale, size: width }),
        [engine, paneId, side, scale, width],
    );
    useRenderable({
        scale,
        clip: false,
        zIndex: 100,
        draw(ctx, { pane, layout, theme, scale: s }) {
            if (!pane || !s) {
                return;
            }
            const axisWidth = side === "right" ? layout.axisRight : layout.axisLeft;
            const x0 = side === "right" ? pane.width : -axisWidth;
            ctx.fillStyle = theme.background;
            ctx.fillRect(x0, 0, axisWidth, pane.height);
            const line = lineColor ?? theme.axis.line;
            const edge = side === "right" ? crisp(pane.width) : crisp(0) - 1;
            if (showLine) {
                applyStroke(ctx, { color: line });
                ctx.beginPath();
                ctx.moveTo(edge, 0);
                ctx.lineTo(edge, pane.height);
                ctx.stroke();
            }
            ctx.font = font(theme);
            ctx.textBaseline = "middle";
            ctx.textAlign = side === "right" ? "left" : "right";
            const dir = side === "right" ? 1 : -1;
            // skip tick labels that would sit under value labels (last value, price lines) on this scale
            const reserved = engine.reservedAxisY(pane.id, scale);
            const gap = theme.fontSize + 5;
            for (const tick of s.ticks(tickSpacing)) {
                if (tick.y < 6 || tick.y > pane.height - 6 || reserved.some((y) => Math.abs(y - tick.y) < gap)) {
                    continue;
                }
                if (showTicks) {
                    ctx.fillStyle = line;
                    ctx.fillRect(side === "right" ? pane.width : -4, Math.round(tick.y), 4, 1);
                }
                if (showTickLabels) {
                    ctx.fillStyle = color ?? theme.axis.text;
                    ctx.fillText(tickFormat ? tickFormat(tick) : tick.label, edge + dir * 8, tick.y);
                }
            }
        },
    });
    return null;
}
