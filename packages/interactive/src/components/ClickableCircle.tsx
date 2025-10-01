import * as React from "react";

import { getMouseCanvas, GenericChartComponent } from "@reincharts/core";

export interface ClickableCircleProps {
    /** Callback function when drag operation starts. */
    readonly onDragStart?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function during drag operation. */
    readonly onDrag?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when drag operation completes. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Width of the circle border. */
    readonly strokeWidth: number;
    /** Color of the circle border. */
    readonly strokeStyle: string;
    /** Fill color of the circle. */
    readonly fillStyle: string;
    /** Radius of the circle. */
    readonly r: number;
    /** X-coordinate of the circle center. */
    readonly cx?: number;
    /** Y-coordinate of the circle center. */
    readonly cy?: number;
    /** CSS class name for the circle. */
    readonly className: string;
    /** Whether to show the clickable circle. */
    readonly show: boolean;
    /** CSS class name for the interactive cursor. */
    readonly interactiveCursorClass?: string;
    /** Function that provides the [x, y] coordinates for positioning the circle. */
    readonly xyProvider?: (moreProps: any) => number[];
}

export class ClickableCircle extends React.Component<ClickableCircleProps> {
    public static defaultProps = {
        className: "reincharts-interactive-line-edge",
        show: false,
    };

    public render() {
        const { interactiveCursorClass, onDragStart, onDrag, onDragComplete, show } = this.props;

        if (!show) {
            return null;
        }

        return (
            <GenericChartComponent
                interactiveCursorClass={interactiveCursorClass}
                selected
                isHover={this.isHover}
                onDragStart={onDragStart}
                onDrag={onDrag}
                onDragComplete={onDragComplete}
                canvasDraw={this.drawOnCanvas}
                canvasToDraw={getMouseCanvas}
                drawOn={["pan", "mousemove", "drag", "keydown"]}
            />
        );
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { strokeStyle, strokeWidth, fillStyle, r } = this.props;

        ctx.lineWidth = strokeWidth;
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;

        const [x, y] = this.helper(moreProps);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();
    };

    private readonly isHover = (moreProps: any) => {
        const { mouseXY } = moreProps;
        const r = this.props.r + 7;
        const [x, y] = this.helper(moreProps);

        const [mx, my] = mouseXY;
        const hover = x - r < mx && mx < x + r && y - r < my && my < y + r;

        return hover;
    };

    private readonly helper = (moreProps: any) => {
        const { xyProvider, cx, cy } = this.props;

        if (xyProvider !== undefined) {
            return xyProvider(moreProps);
        }

        const {
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        const x = xScale(cx);
        const y = yScale(cy);
        return [x, y];
    };
}
