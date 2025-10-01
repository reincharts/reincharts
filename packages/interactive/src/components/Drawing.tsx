import * as React from "react";
import { getMouseCanvas, GenericChartComponent, isNotDefined, isDefined } from "@reincharts/core";

export interface DrawingProps {
    /** Array of points defining the drawing path. */
    readonly points: [number, number][];
    /** Color of the drawing stroke. */
    readonly strokeStyle: string;
    /** Width of the drawing stroke. */
    readonly strokeWidth: number;
    /** Color of the drawing stroke when selected. */
    readonly selectedStrokeStyle: string;
    /** Width of the drawing stroke when selected. */
    readonly selectedStrokeWidth: number;
    /** Tolerance for mouse interaction detection. */
    readonly tolerance: number;
    /** CSS class name for the interactive cursor. */
    readonly interactiveCursorClass?: string;
    /** Callback function when drag operation starts. */
    readonly onDragStart?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function during drag operation. */
    readonly onDrag?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when drag operation completes. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when hovering over the drawing. */
    readonly onHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when hover ends. */
    readonly onUnHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when the drawing is clicked. */
    readonly onClick?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when mouse button is pressed down. */
    readonly onMouseDown?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when mouse button is released. */
    readonly onMouseUp?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when mouse moves over the drawing. */
    readonly onMouseMove?: (e: React.MouseEvent, moreProps: any) => void;
    /** Whether the drawing is currently selected. */
    readonly selected: boolean;
}

export class Drawing extends React.Component<DrawingProps> {
    public static defaultProps = {
        strokeStyle: "black",
        strokeWidth: 2,
        selectedStrokeStyle: "red",
        selectedStrokeWidth: 4,
        tolerance: 10,
        selected: false,
        strokes: [],
    };

    public render() {
        const { selected, interactiveCursorClass } = this.props;
        const {
            onDragStart,
            onDrag,
            onDragComplete,
            onHover,
            onUnHover,
            onClick,
            onMouseDown,
            onMouseUp,
            onMouseMove,
        } = this.props;

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
                onClick={onClick}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                drawOn={["mousemove", "mouseleave", "pan", "drag", "keydown"]}
            />
        );
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { points, strokeStyle, strokeWidth, selectedStrokeStyle, selectedStrokeWidth, selected } = this.props;
        const {
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        if (isDefined(points)) {
            ctx.beginPath();
            points.forEach((point, i) => {
                const x = xScale(point[0]);
                const y = yScale(point[1]);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            // Apply styling based on selection
            if (selected) {
                ctx.strokeStyle = selectedStrokeStyle;
                ctx.lineWidth = selectedStrokeWidth;
            } else {
                ctx.strokeStyle = strokeStyle;
                ctx.lineWidth = strokeWidth;
            }
            ctx.stroke();
        }
    };

    private readonly isHover = (moreProps: any) => {
        const { tolerance, points, onHover } = this.props;
        const {
            mouseXY,
            xScale,
            chartConfig: { yScale },
        } = moreProps;
        const [mouseX, mouseY] = mouseXY;

        if (isNotDefined(points) || !isDefined(onHover)) {
            return false;
        }

        // Convert points to screen coordinates
        const screenPoints = points.map((point) => [xScale(point[0]), yScale(point[1])]);

        // Check hover over points
        for (const [x, y] of screenPoints) {
            const distance = Math.hypot(x - mouseX, y - mouseY);
            if (distance <= tolerance) {
                return true;
            }
        }

        // Check hover over line segments
        for (let i = 0; i < screenPoints.length - 1; i++) {
            const [x1, y1] = screenPoints[i];
            const [x2, y2] = screenPoints[i + 1];

            // Calculate distance from mouse to line segment
            const A = mouseX - x1;
            const B = mouseY - y1;
            const C = x2 - x1;
            const D = y2 - y1;

            const dot = A * C + B * D;
            const lenSq = C * C + D * D;

            if (lenSq === 0) {
                continue;
            }

            const param = dot / lenSq;

            let xx, yy;
            if (param < 0) {
                xx = x1;
                yy = y1;
            } else if (param > 1) {
                xx = x2;
                yy = y2;
            } else {
                xx = x1 + param * C;
                yy = y1 + param * D;
            }

            const distance = Math.hypot(mouseX - xx, mouseY - yy);
            if (distance <= tolerance) {
                return true;
            }
        }

        return false;
    };
}
