import { applyStroke, horizontalLine, useChart, verticalLine, type LineDash } from "@reincharts/core";
import { useSeries, type SeriesProps } from "./useSeries";

export interface StraightLineProps extends Omit<SeriesProps, "legend"> {
    /** "horizontal" (default): a line at a price / y value; "vertical": a line at an x value. */
    readonly type?: "horizontal" | "vertical";
    /** Y value of a horizontal line, or x value (Date, timestamp, number or category index) of a vertical line. */
    readonly value: number | Date;
    /** Line color. Defaults to theme.textMuted. */
    readonly color?: string;
    /** Line width. Default 1. */
    readonly width?: number;
    /** Dash style. Default "dashed". */
    readonly dash?: LineDash;
    /** Include a horizontal line's value in the price scale autoscale. Default false. */
    readonly autoscale?: boolean;
}

/** A horizontal or vertical reference line across the pane (thresholds, targets, overbought / oversold levels). */
export function StraightLine({
    type = "horizontal",
    value,
    color,
    width = 1,
    dash = "dashed",
    autoscale = false,
    ...rest
}: StraightLineProps) {
    const engine = useChart();
    const v = value instanceof Date ? value.getTime() : value;
    const horizontal = type === "horizontal";
    useSeries({
        ...rest,
        legend: false,
        lastValue: false,
        autoscale: horizontal && autoscale,
        values: () => undefined,
        extentIncludes: [v],
        color: (_d, _i, theme) => color ?? theme.textMuted,
        draw(ctx, { y, theme, pane }) {
            applyStroke(ctx, { color: color ?? theme.textMuted, width, dash });
            if (horizontal) {
                horizontalLine(ctx, y(v), 0, pane?.width ?? 0);
            } else {
                verticalLine(ctx, engine.xOfLogical(engine.logicalOfTime(v)), 0, pane?.height ?? 0);
            }
        },
    });
    return null;
}
