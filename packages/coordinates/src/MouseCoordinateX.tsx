import * as React from "react";
import { isNotDefined, getMouseCanvas, GenericChartComponent } from "@reincharts/core";
import { drawOnCanvas } from "./EdgeCoordinateV3";

export interface MouseCoordinateXProps {
    /** Which axis the coordinate should be placed at. */
    readonly at?: "bottom" | "top";
    /** Custom function to calculate the X coordinate and display value. */
    readonly customX: (props: MouseCoordinateXProps, moreProps: any) => { x: number; coordinate: string };
    /** Function to format the displayed coordinate value. */
    readonly displayFormat: (item: any) => string;
    /** Fill color for the coordinate background. */
    readonly fill?: string;
    /** Whether to fit the coordinate box to the text content. */
    readonly fitToText?: boolean;
    /** Font family for the coordinate text. */
    readonly fontFamily?: string;
    /** Font size for the coordinate text. */
    readonly fontSize?: number;
    /** Opacity of the coordinate. */
    readonly opacity?: number;
    /** Orientation of the coordinate. */
    readonly orient?: "bottom" | "top";
    /** Border radius for the coordinate rectangle. */
    readonly rectRadius?: number;
    /** Width of the coordinate rectangle. */
    readonly rectWidth?: number;
    /** Height of the coordinate rectangle. */
    readonly rectHeight?: number;
    /** Whether to snap the coordinate to data points. */
    readonly snapX?: boolean;
    /** Stroke color for the coordinate border. */
    readonly stroke?: string;
    /** Opacity of the coordinate stroke. */
    readonly strokeOpacity?: number;
    /** Width of the coordinate stroke. */
    readonly strokeWidth?: number;
    /** Fill color for the coordinate text. */
    readonly textFill?: string;
    /** Padding from the Y axis. */
    readonly yAxisPad?: number;
}

const defaultCustomX = (props: MouseCoordinateXProps, moreProps: any) => {
    const { xScale, xAccessor, currentItem, mouseXY } = moreProps;
    const { snapX } = props;
    const x = snapX ? xScale(xAccessor(currentItem)) : mouseXY[0];

    const { displayXAccessor } = moreProps;
    const { displayFormat } = props;
    const coordinate = snapX ? displayFormat(displayXAccessor(currentItem)) : displayFormat(xScale.invert(x));
    return { x, coordinate };
};

export class MouseCoordinateX extends React.Component<MouseCoordinateXProps> {
    public static defaultProps = {
        at: "bottom",
        customX: defaultCustomX,
        fill: "#4C525E",
        fitToText: true,
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 13,
        opacity: 1,
        orient: "bottom",
        rectWidth: 80,
        rectHeight: 20,
        snapX: true,
        strokeOpacity: 1,
        strokeWidth: 1,
        textFill: "#FFFFFF",
        yAxisPad: 0,
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
        const props = this.helper(this.props, moreProps);
        if (props === null) {
            return;
        }

        drawOnCanvas(ctx, props);
    };

    private readonly helper = (props: MouseCoordinateXProps, moreProps: any) => {
        const {
            show,
            currentItem,
            chartConfig: { height },
        } = moreProps;

        if (isNotDefined(currentItem)) {
            return null;
        }

        const { customX, orient, at, rectRadius, rectWidth, rectHeight, stroke, strokeOpacity, strokeWidth } = props;
        const { fill, opacity, fitToText, fontFamily, fontSize, textFill } = props;

        const edgeAt = at === "bottom" ? height : 0;

        const { x, coordinate } = customX(props, moreProps);

        const type = "vertical";
        const y1 = 0;
        const y2 = height;
        const hideLine = true;

        const coordinateProps = {
            coordinate,
            fitToText,
            show,
            type,
            orient,
            edgeAt,
            hideLine,
            fill,
            opacity,
            fontFamily,
            fontSize,
            textFill,
            stroke,
            strokeOpacity,
            strokeWidth,
            rectWidth,
            rectHeight,
            rectRadius,
            arrowWidth: 0,
            x1: x,
            x2: x,
            y1,
            y2,
        };

        return coordinateProps;
    };
}
