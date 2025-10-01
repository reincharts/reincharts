import * as React from "react";
import { getMouseCanvas, GenericChartComponent } from "@reincharts/core";
import { isHoveringBasic } from "./InteractiveStraightLine";

export interface ClickableShapeProps {
    /** Font weight for the text. */
    readonly fontWeight: string;
    /** Font family for the text. */
    readonly fontFamily: string;
    /** Font style for the text. */
    readonly fontStyle: string;
    /** Font size for the text. */
    readonly fontSize: number;
    /** Color of the shape border. */
    readonly strokeStyle: string;
    /** Width of the shape border. */
    readonly strokeWidth: number;
    /** Text content to display. */
    readonly text: string;
    /** Configuration for the text box container. */
    readonly textBox: {
        readonly closeIcon: any;
        readonly left: number;
        readonly padding: any;
    };
    /** Whether the shape is currently being hovered. */
    readonly hovering?: boolean;
    /** CSS class name for the interactive cursor. */
    readonly interactiveCursorClass?: string;
    /** Whether to show the clickable shape. */
    readonly show?: boolean;
    /** Callback function when hovering over the shape. */
    readonly onHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when hover ends. */
    readonly onUnHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when the shape is clicked. */
    readonly onClick?: (e: React.MouseEvent, moreProps: any) => void;
    /** Y-axis value for positioning the shape. */
    readonly yValue: number;
}

export class ClickableShape extends React.Component<ClickableShapeProps> {
    public static defaultProps = {
        show: false,
        strokeWidth: 1,
    };

    private closeIcon: any;

    public render() {
        const { interactiveCursorClass, onHover, onUnHover, onClick, show } = this.props;

        if (!show) {
            return null;
        }

        return (
            <GenericChartComponent
                interactiveCursorClass={interactiveCursorClass}
                isHover={this.isHover}
                onClickWhenHover={onClick}
                canvasDraw={this.drawOnCanvas}
                canvasToDraw={getMouseCanvas}
                onHover={onHover}
                onUnHover={onUnHover}
                drawOn={["pan", "mousemove", "drag", "keydown"]}
            />
        );
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { strokeStyle, strokeWidth, hovering, textBox } = this.props;

        const [x, y] = this.helper(this.props, moreProps, ctx);

        this.closeIcon = { x, y };
        ctx.beginPath();

        ctx.lineWidth = hovering ? strokeWidth + 1 : strokeWidth;
        ctx.strokeStyle = strokeStyle;
        const halfWidth = textBox.closeIcon.width / 2;
        ctx.moveTo(x - halfWidth, y - halfWidth);
        ctx.lineTo(x + halfWidth, y + halfWidth);
        ctx.moveTo(x - halfWidth, y + halfWidth);
        ctx.lineTo(x + halfWidth, y - halfWidth);
        ctx.stroke();
    };

    private readonly isHover = (moreProps: any) => {
        const { mouseXY } = moreProps;
        if (this.closeIcon) {
            const { textBox } = this.props;
            const { x, y } = this.closeIcon;
            const halfWidth = textBox.closeIcon.width / 2;

            const start1: [number, number] = [x - halfWidth, y - halfWidth];
            const end1: [number, number] = [x + halfWidth, y + halfWidth];
            const start2: [number, number] = [x - halfWidth, y + halfWidth];
            const end2: [number, number] = [x + halfWidth, y - halfWidth];

            if (isHoveringBasic(start1, end1, mouseXY, 3) || isHoveringBasic(start2, end2, mouseXY, 3)) {
                return true;
            }
        }
        return false;
    };

    private readonly helper = (props: ClickableShapeProps, moreProps: any, ctx: CanvasRenderingContext2D) => {
        const { yValue, text, textBox } = props;
        const { fontFamily, fontStyle, fontWeight, fontSize } = props;
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

        const {
            chartConfig: { yScale },
        } = moreProps;

        const x =
            textBox.left +
            textBox.padding.left +
            ctx.measureText(text).width +
            textBox.padding.right +
            textBox.closeIcon.padding.left +
            textBox.closeIcon.width / 2;

        const y = yScale(yValue);

        return [x, y];
    };
}
