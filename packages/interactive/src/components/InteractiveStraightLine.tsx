import {
    getStrokeDasharrayCanvas,
    getMouseCanvas,
    GenericChartComponent,
    noop,
    strokeDashTypes,
} from "@reincharts/core";
import * as React from "react";

export interface StraightLineProps {
    /** X-axis value for the first point of the line. */
    readonly x1Value: any;
    /** X-axis value for the second point of the line. */
    readonly x2Value: any;
    /** Y-axis value for the first point of the line. */
    readonly y1Value: any;
    /** Y-axis value for the second point of the line. */
    readonly y2Value: any;
    /** CSS class name for the interactive cursor. */
    readonly interactiveCursorClass?: string;
    /** Color of the line stroke. */
    readonly strokeStyle: string;
    /** Width of the line stroke. */
    readonly strokeWidth?: number;
    /** Dash pattern for the line stroke. */
    readonly strokeDasharray?: strokeDashTypes;
    /** Type of line drawing behavior. */
    readonly type:
        | "XLINE" // extends from -Infinity to +Infinity
        | "RAY" // extends to +/-Infinity in one direction
        | "LINE"; // extends between the set bounds
    /** Callback function when edge 1 is dragged. */
    readonly onEdge1Drag?: any; // func
    /** Callback function when edge 2 is dragged. */
    readonly onEdge2Drag?: any; // func
    /** Callback function when drag operation starts. */
    readonly onDragStart?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function during drag operation. */
    readonly onDrag?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when drag operation completes. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when hovering over the line. */
    readonly onHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when hover ends. */
    readonly onUnHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Default CSS class name for the component. */
    readonly defaultClassName?: string;
    /** Radius of the edge control points. */
    readonly r?: number;
    /** Fill color for the edge control points. */
    readonly edgeFill?: string;
    /** Stroke color for the edge control points. */
    readonly edgeStroke?: string;
    /** Stroke width for the edge control points. */
    readonly edgeStrokeWidth?: number;
    /** Whether to show edge control points. */
    readonly withEdge?: boolean;
    /** Tolerance for mouse interaction detection. */
    readonly tolerance?: number;
    /** Whether the line is currently selected. */
    readonly selected?: boolean;
}

export class InteractiveStraightLine extends React.Component<StraightLineProps> {
    public static defaultProps = {
        onEdge1Drag: noop,
        onEdge2Drag: noop,
        edgeStrokeWidth: 3,
        edgeStroke: "#000000",
        edgeFill: "#FFFFFF",
        r: 10,
        withEdge: false,
        strokeWidth: 1,
        strokeDasharray: "Solid",
        children: noop,
        tolerance: 7,
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
                drawOn={["mousemove", "pan", "drag", "keydown"]}
            />
        );
    }

    private readonly isHover = (moreProps: any) => {
        const { tolerance = InteractiveStraightLine.defaultProps.tolerance, onHover } = this.props;

        if (onHover !== undefined) {
            const { x1Value, x2Value, y1Value, y2Value, type } = this.props;
            const { mouseXY, xScale } = moreProps;
            const {
                chartConfig: { yScale },
            } = moreProps;

            const hovering = isHovering({
                x1Value,
                y1Value,
                x2Value,
                y2Value,
                mouseXY,
                type,
                tolerance,
                xScale,
                yScale,
            });

            return hovering;
        }
        return false;
    };

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const {
            strokeWidth = InteractiveStraightLine.defaultProps.strokeWidth,
            strokeDasharray,
            strokeStyle,
        } = this.props;
        const { x1, y1, x2, y2 } = helper(this.props, moreProps);

        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = strokeStyle;

        const lineDash = getStrokeDasharrayCanvas(strokeDasharray);

        ctx.setLineDash(lineDash);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };
}

/**
 * Determines if the mouse pointer is hovering over a straight line segment.
 * This simplified version checks if a point is within tolerance distance of a line segment
 * defined by start and end points without handling special line types.
 *
 * @param start     Starting point coordinates [x, y]
 * @param end       Ending point coordinates [x, y]
 * @param mouseXY   Mouse position coordinates [x, y]
 * @param tolerance Distance tolerance in pixels
 *
 * @returns True if mouse is hovering over the line segment, false otherwise
 */
export function isHoveringBasic(
    start: [number, number],
    end: [number, number],
    [mouseX, mouseY]: [number, number],
    tolerance: number,
): boolean {
    const m = getSlope(start, end);

    if (m !== undefined) {
        const b = getYIntercept(m, end);
        const y = m * mouseX + b;
        return (
            mouseY < y + tolerance &&
            mouseY > y - tolerance &&
            mouseX > Math.min(start[0], end[0]) - tolerance &&
            mouseX < Math.max(start[0], end[0]) + tolerance
        );
    } else {
        return (
            mouseY >= Math.min(start[1], end[1]) &&
            mouseY <= Math.max(start[1], end[1]) &&
            mouseX < start[0] + tolerance &&
            mouseX > start[0] - tolerance
        );
    }
}

interface IsHoveringParams {
    x1Value: number;
    y1Value: number;
    x2Value: number;
    y2Value: number;
    mouseXY: [number, number];
    type: "XLINE" | "RAY" | "LINE";
    tolerance: number;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    xScale: Function;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    yScale: Function;
}

/**
 * Determines if the mouse pointer is hovering over a line.
 * Supports different line types (XLINE, RAY, LINE) and handles scaling.
 *
 * @param x1Value   X coordinate of first point in domain space
 * @param y1Value   Y coordinate of first point in domain space
 * @param x2Value   X coordinate of second point in domain space
 * @param y2Value   Y coordinate of second point in domain space
 * @param mouseXY   Mouse position coordinates [x, y] in canvas space
 * @param type      Line type (XLINE, RAY, LINE)
 * @param tolerance Distance tolerance in pixels
 * @param xScale    X-axis scale function
 * @param yScale    Y-axis scale function
 *
 * @returns True if mouse is hovering over the line, false otherwise
 */
export function isHovering({
    x1Value,
    y1Value,
    x2Value,
    y2Value,
    mouseXY,
    type,
    tolerance,
    xScale,
    yScale,
}: IsHoveringParams): boolean {
    const line = generateLine({
        type,
        start: [x1Value, y1Value],
        end: [x2Value, y2Value],
        xScale,
        yScale,
    });

    const start = [xScale(line.x1), yScale(line.y1)];
    const end = [xScale(line.x2), yScale(line.y2)];

    const m = getSlope(start, end);
    const [mouseX, mouseY] = mouseXY;

    if (m !== undefined) {
        const b = getYIntercept(m, end);
        const y = m * mouseX + b;

        return (
            mouseY < y + tolerance &&
            mouseY > y - tolerance &&
            mouseX > Math.min(start[0], end[0]) - tolerance &&
            mouseX < Math.max(start[0], end[0]) + tolerance
        );
    } else {
        return (
            mouseY >= Math.min(start[1], end[1]) &&
            mouseY <= Math.max(start[1], end[1]) &&
            mouseX < start[0] + tolerance &&
            mouseX > start[0] - tolerance
        );
    }
}

function helper(props: any, moreProps: any) {
    const { x1Value, x2Value, y1Value, y2Value, type } = props;

    const {
        xScale,
        chartConfig: { yScale },
    } = moreProps;

    const modLine = generateLine({
        type,
        start: [x1Value, y1Value],
        end: [x2Value, y2Value],
        xScale,
        yScale,
    });

    const x1 = xScale(modLine.x1);
    const y1 = yScale(modLine.y1);
    const x2 = xScale(modLine.x2);
    const y2 = yScale(modLine.y2);

    return {
        x1,
        y1,
        x2,
        y2,
    };
}

export function getSlope(start: any, end: any) {
    const m /* slope */ = end[0] === start[0] ? undefined : (end[1] - start[1]) / (end[0] - start[0]);
    return m;
}
export function getYIntercept(m: any, end: any) {
    const b /* y intercept */ = -1 * m * end[0] + end[1];
    return b;
}

export function generateLine({ type, start, end, xScale, yScale }: any) {
    const m /* slope */ = getSlope(start, end);
    const b /* y intercept */ = getYIntercept(m, start);

    switch (type) {
        case "XLINE":
            return getXLineCoordinates({
                start,
                end,
                xScale,
                yScale,
                m,
                b,
            });
        case "RAY":
            return getRayCoordinates({
                start,
                end,
                xScale,
                yScale,
                m,
                b,
            });
        default:
        case "LINE":
            return getLineCoordinates({
                start,
                end,
            });
    }
}

function getXLineCoordinates({ start, end, xScale, yScale, m, b }: any) {
    const [xBegin, xFinish] = xScale.domain();
    const [yBegin, yFinish] = yScale.domain();

    if (end[0] === start[0]) {
        return {
            x1: end[0],
            y1: yBegin,
            x2: end[0],
            y2: yFinish,
        };
    }
    const [x1, x2] = end[0] > start[0] ? [xBegin, xFinish] : [xFinish, xBegin];

    return {
        x1,
        y1: m * x1 + b,
        x2,
        y2: m * x2 + b,
    };
}

function getRayCoordinates({ start, end, xScale, yScale, m, b }: any) {
    const [xBegin, xFinish] = xScale.domain();
    const [yBegin, yFinish] = yScale.domain();

    const x1 = start[0];
    if (end[0] === start[0]) {
        return {
            x1,
            y1: start[1],
            x2: x1,
            y2: end[1] > start[1] ? yFinish : yBegin,
        };
    }

    const x2 = end[0] > start[0] ? xFinish : xBegin;

    return {
        x1,
        y1: m * x1 + b,
        x2,
        y2: m * x2 + b,
    };
}

function getLineCoordinates({ start, end }: any) {
    const [x1, y1] = start;
    const [x2, y2] = end;
    if (end[0] === start[0]) {
        return {
            x1,
            y1: start[1],
            x2: x1,
            y2: end[1],
        };
    }

    return {
        x1,
        y1,
        x2,
        y2,
    };
}
