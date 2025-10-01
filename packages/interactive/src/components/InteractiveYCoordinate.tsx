import * as React from "react";
import { format } from "d3-format";
import { drawOnCanvas } from "@reincharts/coordinates/lib/EdgeCoordinateV3";
import { getYCoordinate } from "@reincharts/coordinates/lib/MouseCoordinateY";
import { getStrokeDasharrayCanvas, getMouseCanvas, GenericChartComponent, strokeDashTypes } from "@reincharts/core";

export interface InteractiveYCoordinateProps {
    /** Background fill color for the coordinate label. */
    readonly bgFillStyle: string;
    /** Stroke color for the coordinate line. */
    readonly strokeStyle: string;
    /** Width of the coordinate line stroke. */
    readonly strokeWidth: number;
    /** Dash pattern for the coordinate line. */
    readonly strokeDasharray: strokeDashTypes;
    /** Fill color for the coordinate label text. */
    readonly textFill: string;
    /** Font family for the coordinate label text. */
    readonly fontFamily: string;
    /** Font size for the coordinate label text. */
    readonly fontSize: number;
    /** Font weight for the coordinate label text. */
    readonly fontWeight: number | string;
    /** Font style for the coordinate label text. */
    readonly fontStyle: string;
    /** Text content to display in the coordinate label. */
    readonly text: string;
    /** Configuration for the coordinate edge/label appearance. */
    readonly edge: object;
    /** Configuration for the text box containing the coordinate label. */
    readonly textBox: {
        /** Close icon configuration for removing the coordinate. */
        readonly closeIcon: any;
        /** Left position offset for the text box. */
        readonly left: number;
        /** Height of the text box. */
        readonly height: number;
        /** Padding configuration for the text box. */
        readonly padding: any;
    };
    /** The Y-axis value where the coordinate line is positioned. */
    readonly yValue: number;
    /** Callback fired when dragging of the Y coordinate starts. */
    readonly onDragStart?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when the Y coordinate is being dragged. */
    readonly onDrag?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when dragging of the Y coordinate is completed. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when the mouse hovers over the Y coordinate. */
    readonly onHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when the mouse stops hovering over the Y coordinate. */
    readonly onUnHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Optional CSS class name for styling the Y coordinate. */
    readonly defaultClassName?: string;
    /** CSS cursor class to show when the Y coordinate is interactive. */
    readonly interactiveCursorClass?: string;
    /** Tolerance in pixels for hover and click detection. */
    readonly tolerance: number;
    /** Whether this Y coordinate is currently selected. */
    readonly selected: boolean;
    /** Whether the mouse is currently hovering over this Y coordinate. */
    readonly hovering: boolean;
}

export class InteractiveYCoordinate extends React.Component<InteractiveYCoordinateProps> {
    public static defaultProps = {
        fontWeight: "normal", // standard dev
        strokeWidth: 1,
        tolerance: 4,
        selected: false,
        hovering: false,
    };

    private width = 0;

    public render() {
        const { interactiveCursorClass } = this.props;
        const { onHover, onUnHover } = this.props;
        const { onDragStart, onDrag, onDragComplete } = this.props;

        return (
            <GenericChartComponent
                clip={false}
                isHover={this.isHover}
                canvasToDraw={getMouseCanvas}
                canvasDraw={this.drawOnCanvas}
                interactiveCursorClass={interactiveCursorClass}
                enableDragOnHover
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
        const {
            bgFillStyle,
            textFill,
            fontFamily,
            fontSize,
            fontStyle,
            fontWeight,
            strokeStyle,
            strokeWidth,
            strokeDasharray,
            text,
            textBox,
            edge,
            selected,
            hovering,
        } = this.props;

        const values = this.helper(moreProps);
        if (values == null) {
            return;
        }

        const { x1, x2, y, rect } = values;

        ctx.strokeStyle = strokeStyle;

        ctx.beginPath();
        if (selected || hovering) {
            ctx.lineWidth = strokeWidth + 1;
        } else {
            ctx.lineWidth = strokeWidth;
        }
        ctx.textBaseline = "middle";
        ctx.textAlign = "start";
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

        this.width =
            textBox.padding.left +
            ctx.measureText(text).width +
            textBox.padding.right +
            textBox.closeIcon.padding.left +
            textBox.closeIcon.width +
            textBox.closeIcon.padding.right;

        ctx.setLineDash(getStrokeDasharrayCanvas(strokeDasharray));
        ctx.moveTo(x1, y);
        ctx.lineTo(rect.x, y);

        ctx.moveTo(rect.x + this.width, y);
        ctx.lineTo(x2, y);
        ctx.stroke();

        ctx.setLineDash([]);

        ctx.fillStyle = bgFillStyle;

        ctx.fillRect(rect.x, rect.y, this.width, rect.height);
        ctx.strokeRect(rect.x, rect.y, this.width, rect.height);

        ctx.fillStyle = textFill;

        ctx.beginPath();
        ctx.fillText(text, rect.x + 10, y);
        const newEdge = {
            ...edge,
            textFill,
            fontFamily,
            fontSize,
        };

        const fmt = format(".2f");
        const yValue = fmt(this.props.yValue);
        const yCoord = getYCoordinate(y, yValue, newEdge, moreProps);
        drawOnCanvas(ctx, yCoord);
    };

    private readonly isHover = (moreProps: any) => {
        const { onHover } = this.props;

        if (onHover !== undefined) {
            const values = this.helper(moreProps);
            if (values == null) {
                return false;
            }

            const { x1, x2, y, rect } = values;
            const {
                mouseXY: [mouseX, mouseY],
            } = moreProps;

            if (
                mouseX >= rect.x &&
                mouseX <= rect.x + this.width &&
                mouseY >= rect.y &&
                mouseY <= rect.y + rect.height
            ) {
                return true;
            }
            if (x1 <= mouseX && x2 >= mouseX && Math.abs(mouseY - y) < 4) {
                return true;
            }
        }
        return false;
    };

    private readonly helper = (moreProps: any) => {
        const { yValue, textBox } = this.props;

        const {
            chartConfig: { width, yScale, height },
        } = moreProps;

        const y = Math.round(yScale(yValue));

        if (y >= 0 && y <= height) {
            const rect = {
                x: textBox.left,
                y: y - textBox.height / 2,
                height: textBox.height,
            };
            return {
                x1: 0,
                x2: width,
                y,
                rect,
            };
        }
    };
}
