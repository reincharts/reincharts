import { applyStroke, crisp, font, useChart, useRenderable, type TimeTick } from "@reincharts/core";
import * as React from "react";

export interface XAxisProps {
    /** Height of the axis band in pixels. Default 28. */
    readonly height?: number;
    /** Minimum pixel distance between labels. Default 80. */
    readonly tickSpacing?: number;
    /** Custom label for a tick. */
    readonly tickFormat?: (tick: TimeTick) => string;
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

/** The time / x axis along the bottom of the chart. Dragging it zooms, double-click resets. */
export function XAxis({
    height = 28,
    tickSpacing = 80,
    tickFormat,
    showLine = true,
    showTicks = true,
    showTickLabels = true,
    color,
    lineColor,
}: XAxisProps) {
    const engine = useChart();
    React.useLayoutEffect(() => engine.registerAxis({ kind: "time", size: height }), [engine, height]);
    useRenderable({
        pane: null,
        zIndex: 100,
        draw(ctx, { layout, theme }) {
            const band = layout.timeAxis;
            if (!band) {
                return;
            }
            ctx.fillStyle = theme.background;
            ctx.fillRect(0, band.top, layout.width, band.height);
            const line = lineColor ?? theme.axis.line;
            if (showLine) {
                applyStroke(ctx, { color: line });
                ctx.beginPath();
                ctx.moveTo(0, crisp(band.top));
                ctx.lineTo(layout.width, crisp(band.top));
                ctx.stroke();
            }
            ctx.font = font(theme);
            ctx.fillStyle = color ?? theme.axis.text;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            for (const tick of engine.xTicks(tickSpacing)) {
                const x = layout.plotLeft + tick.x;
                if (showTicks) {
                    ctx.fillStyle = line;
                    ctx.fillRect(Math.round(x), band.top, 1, 4);
                    ctx.fillStyle = color ?? theme.axis.text;
                }
                if (showTickLabels) {
                    ctx.font = font(theme, theme.fontSize, tick.weight >= 90 ? "600" : "normal");
                    const label = tickFormat ? tickFormat(tick) : tick.label;
                    const half = ctx.measureText(label).width / 2;
                    // skip labels that would be cut off at the chart edges
                    if (x - half >= 0 && x + half <= layout.width) {
                        ctx.fillText(label, x, band.top + 8);
                    }
                }
            }
        },
    });
    return null;
}
