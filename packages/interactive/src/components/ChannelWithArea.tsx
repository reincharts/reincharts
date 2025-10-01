import * as React from "react";
import { isDefined, isNotDefined, getMouseCanvas, GenericChartComponent, identity } from "@reincharts/core";
import { generateLine, isHovering } from "./InteractiveStraightLine";

export interface ChannelWithAreaProps {
    /** Starting X,Y coordinates for the first point of the channel. */
    readonly startXY?: number[];
    /** Ending X,Y coordinates for the second point of the channel. */
    readonly endXY?: number[];
    /** Y-axis delta value that defines the channel width. */
    readonly dy?: number;
    /** CSS cursor class to show when the channel is interactive. */
    readonly interactiveCursorClass?: string;
    /** Stroke color for the channel boundary lines. */
    readonly strokeStyle: string;
    /** Width of the channel boundary lines. */
    readonly strokeWidth: number;
    /** Fill color for the channel area between boundary lines. */
    readonly fillStyle: string;
    /** Type of channel line extension behavior. */
    readonly type:
        | "XLINE" // extends from -Infinity to +Infinity
        | "RAY" // extends to +/-Infinity in one direction
        | "LINE"; // extends between the set bounds
    /** Callback fired when dragging of the channel starts. */
    readonly onDragStart?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when the channel is being dragged. */
    readonly onDrag?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when dragging of the channel is completed. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when the mouse hovers over the channel. */
    readonly onHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when the mouse stops hovering over the channel. */
    readonly onUnHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Optional CSS class name for styling the channel. */
    readonly defaultClassName?: string;
    /** Tolerance in pixels for hover and click detection. */
    readonly tolerance: number;
    /** Whether this channel is currently selected. */
    readonly selected: boolean;
}

export class ChannelWithArea extends React.Component<ChannelWithAreaProps> {
    public static defaultProps = {
        type: "LINE",
        strokeWidth: 1,
        tolerance: 4,
        selected: false,
    };

    public render() {
        const { selected, interactiveCursorClass } = this.props;
        const { onDragStart, onDrag, onDragComplete, onHover, onUnHover } = this.props;

        return (
            <GenericChartComponent
                isHover={this.isHover}
                canvasToDraw={getMouseCanvas}
                canvasDraw={this.drawOnCanvas}
                interactiveCursorClass={interactiveCursorClass}
                selected={selected}
                onDragStart={onDragStart}
                onDrag={onDrag}
                onDragComplete={onDragComplete}
                onHover={onHover}
                onUnHover={onUnHover}
                drawOn={["mousemove", "mouseleave", "pan", "drag", "keydown"]}
            />
        );
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { strokeStyle, strokeWidth, fillStyle } = this.props;
        const { line1, line2 } = helper(this.props, moreProps);

        if (line1 !== undefined) {
            const { x1, y1, x2, y2 } = line1;

            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = strokeStyle;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            if (line2 !== undefined) {
                const { y1: line2Y1, y2: line2Y2 } = line2;

                ctx.beginPath();
                ctx.moveTo(x1, line2Y1);
                ctx.lineTo(x2, line2Y2);
                ctx.stroke();

                ctx.fillStyle = fillStyle;
                ctx.beginPath();
                ctx.moveTo(x1, y1);

                ctx.lineTo(x2, y2);
                ctx.lineTo(x2, line2Y2);
                ctx.lineTo(x1, line2Y1);

                ctx.closePath();
                ctx.fill();
            }
        }
    };

    private readonly isHover = (moreProps: any) => {
        const { tolerance, onHover } = this.props;

        if (isDefined(onHover)) {
            const { line1, line2 } = helper(this.props, moreProps);

            if (isDefined(line1) && isDefined(line2)) {
                const { mouseXY } = moreProps;

                const line1Hovering = isHovering({
                    x1Value: line1.x1,
                    y1Value: line1.y1,
                    x2Value: line1.x2,
                    y2Value: line1.y2,
                    mouseXY,
                    type: "LINE",
                    tolerance,
                    xScale: identity,
                    yScale: identity,
                });

                const line2Hovering = isHovering({
                    x1Value: line2.x1,
                    y1Value: line2.y1,
                    x2Value: line2.x2,
                    y2Value: line2.y2,
                    mouseXY,
                    type: "LINE",
                    tolerance,
                    xScale: identity,
                    yScale: identity,
                });

                return line1Hovering || line2Hovering;
            }
        }
        return false;
    };
}

function getLines(props: ChannelWithAreaProps, moreProps: any) {
    const { startXY, endXY, dy, type } = props;
    const { xScale } = moreProps;

    if (isNotDefined(startXY) || isNotDefined(endXY)) {
        return {};
    }

    const line1 = generateLine({
        type,
        start: startXY,
        end: endXY,
        xScale,
        yScale: undefined,
    });

    const line2 = isDefined(dy)
        ? {
              ...line1,
              y1: line1.y1 + dy,
              y2: line1.y2 + dy,
          }
        : undefined;

    return {
        line1,
        line2,
    };
}

function helper(props: ChannelWithAreaProps, moreProps: any) {
    const lines = getLines(props, moreProps);
    const {
        xScale,
        chartConfig: { yScale },
    } = moreProps;

    const line1 =
        lines.line1 !== undefined
            ? {
                  x1: xScale(lines.line1.x1),
                  y1: yScale(lines.line1.y1),
                  x2: xScale(lines.line1.x2),
                  y2: yScale(lines.line1.y2),
              }
            : undefined;

    const line2 =
        lines.line2 !== undefined
            ? {
                  x1: line1!.x1,
                  y1: yScale(lines.line2.y1),
                  x2: line1!.x2,
                  y2: yScale(lines.line2.y2),
              }
            : undefined;

    return {
        lines,
        line1,
        line2,
    };
}
