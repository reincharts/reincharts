import { applyStroke, crisp, useChart, useRenderable, type LineDash } from "@reincharts/core";

export interface GridProps {
    /** Draw vertical lines at the x axis ticks. Defaults to theme.grid.vertical. */
    readonly vertical?: boolean;
    /** Draw horizontal lines at the price ticks. Defaults to theme.grid.horizontal. */
    readonly horizontal?: boolean;
    /** Price scale whose ticks the horizontal lines follow. Default "right". */
    readonly scale?: string;
    /** Line color. Defaults to theme.grid.color. */
    readonly color?: string;
    /** Line dash style. */
    readonly dash?: LineDash;
    /** Approximate pixel distance between horizontal lines (match the YAxis). Default 40. */
    readonly tickSpacing?: number;
    /** Minimum pixel distance between vertical lines (match the XAxis). Default 80. */
    readonly xTickSpacing?: number;
}

/** Grid lines for the enclosing pane, aligned with the axis ticks. */
export function Grid({
    vertical,
    horizontal,
    scale = "right",
    color,
    dash,
    tickSpacing = 40,
    xTickSpacing = 80,
}: GridProps) {
    const engine = useChart();
    useRenderable({
        scale,
        zIndex: -100,
        draw(ctx, { pane, theme, scale: s }) {
            if (!pane || !s) {
                return;
            }
            applyStroke(ctx, { color: color ?? theme.grid.color, dash });
            ctx.beginPath();
            if (vertical ?? theme.grid.vertical) {
                for (const t of engine.xTicks(xTickSpacing)) {
                    const x = crisp(t.x);
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, pane.height);
                }
            }
            if (horizontal ?? theme.grid.horizontal) {
                for (const t of s.ticks(tickSpacing)) {
                    const y = crisp(t.y);
                    ctx.moveTo(0, y);
                    ctx.lineTo(pane.width, y);
                }
            }
            ctx.stroke();
        },
    });
    return null;
}
