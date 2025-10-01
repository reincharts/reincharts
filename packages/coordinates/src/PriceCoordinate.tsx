import { format } from "d3-format";
import * as React from "react";
import { getAxisCanvas, GenericChartComponent, functor, strokeDashTypes } from "@reincharts/core";
import { drawOnCanvas } from "./EdgeCoordinateV3";

interface PriceCoordinateProps {
    /** Width of the coordinate arrows. */
    readonly arrowWidth?: number;
    /** Which axis/side the coordinate should be placed at. */
    readonly at?: "bottom" | "top" | "left" | "right";
    /** Function to format the displayed price value. */
    readonly displayFormat: (n: number) => string;
    /** Horizontal offset for the coordinate text. */
    readonly dx?: number;
    /** Font family for the coordinate text. */
    readonly fontFamily?: string;
    /** Font size for the coordinate text. */
    readonly fontSize?: number;
    /** Fill color for the coordinate background, can be static or function based on price. */
    readonly fill?: string | ((price: number) => string);
    /** Opacity of the price line (0-1). */
    readonly lineOpacity?: number;
    /** Stroke color for the price line. */
    readonly lineStroke?: string;
    /** Opacity of the coordinate (0-1). */
    readonly opacity?: number;
    /** Orientation of the coordinate. */
    readonly orient?: "bottom" | "top" | "left" | "right";
    /** The price value to display. */
    readonly price: number;
    /** Width of the coordinate rectangle. */
    readonly rectWidth?: number;
    /** Height of the coordinate rectangle. */
    readonly rectHeight?: number;
    /** Dash pattern for the stroke. */
    readonly strokeDasharray?: strokeDashTypes;
    /** Stroke color for the coordinate border. */
    readonly stroke?: string;
    /** Opacity of the coordinate stroke (0-1). */
    readonly strokeOpacity?: number;
    /** Width of the coordinate stroke. */
    readonly strokeWidth?: number;
    /** Fill color for the coordinate text, can be static or function based on price. */
    readonly textFill?: string | ((price: number) => string);
    /** Padding from the Y axis. */
    readonly yAxisPad?: number;
}

export class PriceCoordinate extends React.Component<PriceCoordinateProps> {
    public static defaultProps = {
        displayFormat: format(".2f"),
        yAxisPad: 0,
        rectWidth: 50,
        rectHeight: 20,
        orient: "left",
        at: "left",
        price: 0,
        dx: 0,
        arrowWidth: 0,
        fill: "#BAB8b8",
        opacity: 1,
        lineOpacity: 0.2,
        lineStroke: "#000000",
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 13,
        textFill: "#FFFFFF",
        strokeOpacity: 1,
        strokeWidth: 1,
        strokeDasharray: "Solid",
    };

    public render() {
        return (
            <GenericChartComponent
                clip={false}
                canvasDraw={this.drawOnCanvas}
                canvasToDraw={getAxisCanvas}
                drawOn={["pan"]}
            />
        );
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const props = this.helper(this.props, moreProps);

        drawOnCanvas(ctx, props);
    };

    private readonly helper = (props: PriceCoordinateProps, moreProps: any) => {
        const {
            chartConfig: { yScale },
            width,
        } = moreProps;
        const [lowerYValue, upperYValue] = yScale.domain();

        const { price, stroke, strokeDasharray, strokeOpacity, strokeWidth } = props;
        const { orient, at, rectWidth, rectHeight, displayFormat, dx } = props;
        const { fill, opacity, fontFamily, fontSize, textFill, arrowWidth, lineOpacity, lineStroke } = props;

        const x1 = 0;
        const x2 = width;
        const edgeAt = at === "right" ? width : 0;

        const type = "horizontal";

        const y = yScale(price);
        const show = price <= upperYValue && price >= lowerYValue;

        const coordinate = displayFormat(yScale.invert(y));
        const hideLine = false;

        const coordinateProps = {
            coordinate,
            show,
            type,
            orient,
            edgeAt,
            hideLine,
            lineOpacity,
            lineStroke,
            lineStrokeDasharray: strokeDasharray,
            stroke,
            strokeOpacity,
            strokeWidth,
            fill: functor(fill)(price),
            textFill: functor(textFill)(price),
            opacity,
            fontFamily,
            fontSize,
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
    };
}
