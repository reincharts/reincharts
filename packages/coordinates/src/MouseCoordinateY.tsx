import * as React from "react";
import { getMouseCanvas, GenericChartComponent, isNotDefined } from "@reincharts/core";
import { drawOnCanvas } from "./EdgeCoordinateV3";

export interface MouseCoordinateYProps {
    /** Width of the coordinate arrows. */
    readonly arrowWidth?: number;
    /** Which axis the coordinate should be placed at. */
    readonly at?: "left" | "right";
    /** Function to format the displayed coordinate value. */
    readonly displayFormat: (value: number) => string;
    /** Horizontal offset for the coordinate text. */
    readonly dx?: number;
    /** Font family for the coordinate text. */
    readonly fontFamily?: string;
    /** Font size for the coordinate text. */
    readonly fontSize?: number;
    /** Fill color for the coordinate background. */
    readonly fill?: string;
    /** Whether to fit the coordinate box to the text content. */
    readonly fitToText?: boolean;
    /** Opacity of the coordinate. */
    readonly opacity?: number;
    /** Orientation of the coordinate. */
    readonly orient?: "left" | "right";
    /** Width of the coordinate rectangle. */
    readonly rectWidth?: number;
    /** Height of the coordinate rectangle. */
    readonly rectHeight?: number;
    /** Stroke color for the coordinate border. */
    readonly stroke?: string;
    /** Opacity of the coordinate stroke. */
    readonly strokeOpacity?: number;
    /** Width of the coordinate stroke. */
    readonly strokeWidth?: number;
    /** Fill color for the coordinate text. */
    readonly textFill?: string;
    /** Data accessor function for Y values. */
    readonly yAccessor?: (data: any) => number | undefined;
    /** Padding from the Y axis. */
    readonly yAxisPad?: number;
}

export class MouseCoordinateY extends React.Component<MouseCoordinateYProps> {
    public static defaultProps = {
        arrowWidth: 0,
        at: "right",
        dx: 0,
        fill: "#4C525E",
        fitToText: false,
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 13,
        opacity: 1,
        orient: "right",
        rectWidth: 50,
        rectHeight: 20,
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
        if (props === undefined) {
            return;
        }

        drawOnCanvas(ctx, props);
    };

    private readonly helper = (props: MouseCoordinateYProps, moreProps: any) => {
        const {
            chartConfig: { yScale },
            chartId,
            currentItem,
            currentCharts,
            mouseXY,
            show,
        } = moreProps;

        if (!show) {
            return undefined;
        }

        if (isNotDefined(mouseXY)) {
            return undefined;
        }

        if (currentCharts.indexOf(chartId) < 0) {
            return undefined;
        }

        const { displayFormat, yAccessor } = props;

        if (yAccessor && !currentItem) {
            return undefined;
        }

        const y = yAccessor ? yScale(yAccessor(currentItem)) : mouseXY[1];

        const coordinate = displayFormat(yScale.invert(y));

        return getYCoordinate(y, coordinate, props, moreProps);
    };
}

export function getYCoordinate(y: number, coordinate: string, props: any, moreProps: any) {
    const { width } = moreProps;

    const { orient, at, rectWidth, rectHeight, dx, stroke, strokeOpacity, strokeWidth } = props;
    const { fill, opacity, fitToText, fontFamily, fontSize, textFill, arrowWidth } = props;

    const x1 = 0;
    const x2 = width;
    const edgeAt = at === "right" ? width : 0;

    const type = "horizontal";
    const hideLine = true;

    const coordinateProps = {
        coordinate,
        show: true,
        fitToText,
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
        arrowWidth,
        dx,
        x1,
        x2,
        y1: y,
        y2: y,
    };

    return coordinateProps;
}
