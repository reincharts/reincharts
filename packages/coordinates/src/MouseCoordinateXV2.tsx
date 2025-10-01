import * as React from "react";
import { getMouseCanvas, GenericChartComponent } from "@reincharts/core";

interface MouseCoordinateXV2Props {
    /** Which axis the coordinate should be placed at. */
    readonly at?: "bottom" | "top";
    /** Background styling configuration for the coordinate. */
    readonly bg: {
        /** Fill color for the coordinate background, can be static or function. */
        readonly fill: string | ((moreProps: any, ctx: CanvasRenderingContext2D) => string);
        /** Stroke color for the coordinate border, can be static or function. */
        readonly stroke: string | ((moreProps: any, ctx: CanvasRenderingContext2D) => string);
        /** Width of the coordinate stroke, can be static or function. */
        readonly strokeWidth: number | ((moreProps: any) => number);
        /** Padding configuration for the coordinate box. */
        readonly padding: {
            left: number;
            right: number;
            top: number;
            bottom: number;
        };
    };
    /** Custom function to draw the coordinate shape. */
    readonly drawCoordinate: (ctx: CanvasRenderingContext2D, shape: any, props: any, moreProps: any) => void;
    /** Function to format the displayed coordinate value. */
    readonly displayFormat: (value: number) => string;
    /** Horizontal offset for the coordinate. */
    readonly dx: number;
    /** Vertical offset for the coordinate. */
    readonly dy: number;
    /** Orientation of the coordinate. */
    readonly orient?: "bottom" | "top";
    /** Text styling configuration for the coordinate. */
    readonly text: {
        /** Font style for the coordinate text. */
        readonly fontStyle: string;
        /** Font weight for the coordinate text. */
        readonly fontWeight: string;
        /** Font family for the coordinate text. */
        readonly fontFamily: string;
        /** Font size for the coordinate text. */
        readonly fontSize: number;
        /** Fill color for the coordinate text, can be static or function. */
        readonly fill: string | ((moreProps: any, ctx: CanvasRenderingContext2D) => string);
    };
    /** Function to calculate the X position of the coordinate. */
    readonly xPosition: (props: MouseCoordinateXV2Props, moreProps: any) => number;
}

export class MouseCoordinateXV2 extends React.Component<MouseCoordinateXV2Props> {
    public static defaultProps = {
        xPosition: defaultXPosition,
        drawCoordinate: defaultDrawCoordinate,
        at: "bottom",
        orient: "bottom",
        text: {
            fontStyle: "",
            fontWeight: "",
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 13,
            fill: "rgb(35, 35, 35)",
        },
        bg: {
            fill: "rgb(255, 255, 255)",
            stroke: "rgb(35, 35, 35)",
            strokeWidth: 1,
            padding: {
                left: 7,
                right: 7,
                top: 4,
                bottom: 4,
            },
        },
        dx: 7,
        dy: 7,
    };

    public render() {
        return (
            <GenericChartComponent
                clip={false}
                canvasDraw={this.drawOnCanvas}
                canvasToDraw={getMouseCanvas}
                drawOn={["mousemove", "pan", "drag"]}
            />
        );
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { show, currentItem } = moreProps;
        const { drawCoordinate } = this.props;

        if (show && currentItem != null) {
            const shape = getXCoordinateInfo(ctx, this.props, moreProps);

            drawCoordinate(ctx, shape, this.props, moreProps);
        }
    };
}

function defaultXPosition(props: MouseCoordinateXV2Props, moreProps: any) {
    const { currentItem, xAccessor } = moreProps;

    return xAccessor(currentItem);
}

function getXCoordinateInfo(ctx: CanvasRenderingContext2D, props: MouseCoordinateXV2Props, moreProps: any) {
    const { at, displayFormat, text, xPosition } = props;

    const xValue = xPosition(props, moreProps);

    const {
        xScale,
        chartConfig: { height },
    } = moreProps;

    ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;

    const t = displayFormat(xValue);
    const textWidth = ctx.measureText(t).width;

    const y = at === "bottom" ? height : 0;
    const x = Math.round(xScale(xValue));

    return {
        x,
        y,
        textWidth,
        text: t,
    };
}

function defaultDrawCoordinate(
    ctx: CanvasRenderingContext2D,
    shape: any,
    props: MouseCoordinateXV2Props,
    moreProps: any,
) {
    const { x, y, textWidth, text } = shape;

    const {
        orient,
        dx,
        dy,
        bg: { padding, fill, stroke, strokeWidth },
        text: { fontSize, fill: textFill },
    } = props;

    ctx.textAlign = "center";

    const sign = orient === "top" ? -1 : 1;
    const halfWidth = Math.round(textWidth / 2 + padding.right);
    const height = Math.round(fontSize + padding.top + padding.bottom);

    ctx.strokeStyle = typeof stroke === "function" ? stroke(moreProps, ctx) : stroke;
    ctx.fillStyle = typeof fill === "function" ? fill(moreProps, ctx) : fill;
    ctx.lineWidth = typeof strokeWidth === "function" ? strokeWidth(moreProps) : strokeWidth;

    ctx.beginPath();

    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + sign * dy);
    ctx.lineTo(x + halfWidth, y + sign * dy);
    ctx.lineTo(x + halfWidth, y + sign * (dy + height));
    ctx.lineTo(x - halfWidth, y + sign * (dy + height));
    ctx.lineTo(x - halfWidth, y + sign * dy);
    ctx.lineTo(x - dx, y + sign * dy);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = typeof textFill === "function" ? textFill(moreProps, ctx) : textFill;

    ctx.textBaseline = orient === "top" ? "alphabetic" : "hanging";
    const pad = orient === "top" ? padding.bottom : padding.top;

    ctx.fillText(text, x, y + sign * (dy + pad + 2));
}
