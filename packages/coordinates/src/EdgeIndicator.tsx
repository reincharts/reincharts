import { format } from "d3-format";
import * as React from "react";
import { first, functor, getAxisCanvas, GenericChartComponent, last, noop, strokeDashTypes } from "@reincharts/core";
import { drawOnCanvas } from "./EdgeCoordinateV3";

export interface EdgeIndicatorProps {
    /** Width of the coordinate arrows. */
    readonly arrowWidth?: number;
    /** Function to format the displayed value. */
    readonly displayFormat?: (n: number) => string;
    /** Which edge of the chart to place the indicator on. */
    readonly edgeAt?: "left" | "right";
    /** Fill color for the indicator background. */
    readonly fill?: string | ((data: any) => string);
    /** Whether to fit the indicator box to the text content. */
    readonly fitToText?: boolean;
    /** Font family for the indicator text. */
    readonly fontFamily?: string;
    /** Font size for the indicator text. */
    readonly fontSize?: number;
    /** Whether the indicator should span the full width. */
    readonly fullWidth?: boolean;
    /** Whether to show indicator for the first or last data item. */
    readonly itemType: "first" | "last";
    /** Stroke color for the indicator line. */
    readonly lineStroke?: string | ((data: any) => string);
    /** Dash style for the indicator line. */
    readonly lineStrokeDasharray?: strokeDashTypes;
    /** Orientation of the indicator. */
    readonly orient?: "left" | "right";
    /** Height of the indicator rectangle. */
    readonly rectHeight?: number;
    /** Width of the indicator rectangle. */
    readonly rectWidth?: number;
    /** Stroke color for the indicator border. */
    readonly stroke?: string | ((data: any) => string);
    /** Fill color for the indicator text. */
    readonly textFill?: string | ((data: any) => string);
    /** Type of the indicator. */
    readonly type?: "horizontal";
    /** Data accessor function for Y values. */
    readonly yAccessor: (data: any) => number | undefined;
    /** Padding from the Y axis. */
    readonly yAxisPad?: number;
}

export class EdgeIndicator extends React.Component<EdgeIndicatorProps> {
    public static defaultProps = {
        fitToText: false,
        lineStroke: "#000000",
        lineOpacity: 1,
        lineStrokeDasharray: "ShortDot",
        orient: "right",
        displayFormat: format(".2f"),
        edgeAt: "right",
        yAxisPad: 0,
        rectHeight: 20,
        rectWidth: 50,
        arrowWidth: 0,
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 13,
        dx: 0,
        hideLine: false,
        fill: "#8a8a8a",
        opacity: 1,
        stroke: noop,
        strokeOpacity: 1,
        strokeWidth: 1,
        textFill: "#FFFFFF",
        type: "horizontal",
    };

    public render() {
        return (
            <GenericChartComponent
                edgeClip
                clip={false}
                canvasDraw={this.drawOnCanvas}
                canvasToDraw={getAxisCanvas}
                drawOn={["pan"]}
            />
        );
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const edge = this.helper(this.props, moreProps);
        if (edge === undefined) {
            return;
        }

        const props = {
            ...this.props,
            ...edge,
        };

        drawOnCanvas(ctx, props);
    };

    private readonly helper = (props: EdgeIndicatorProps, moreProps: any) => {
        const { itemType, yAccessor } = props;

        const { plotData } = moreProps;

        const item = itemType === "first" ? first(plotData, yAccessor) : last(plotData, yAccessor);

        const edge = item !== undefined ? this.getEdge(moreProps, item) : undefined;

        return edge;
    };

    private readonly getEdge = (moreProps: any, item: any) => {
        const {
            fontFamily,
            fontSize,
            type: edgeType,
            displayFormat = EdgeIndicator.defaultProps.displayFormat,
            edgeAt,
            yAxisPad = EdgeIndicator.defaultProps.yAxisPad,
            orient,
            lineStroke,
            yAccessor,
            fill,
            fullWidth,
            textFill,
            rectHeight,
            rectWidth,
            arrowWidth,
            stroke,
        } = this.props;

        const {
            xScale,
            chartConfig: { yScale },
            xAccessor,
            width,
        } = moreProps;

        const yValue = yAccessor(item);
        if (yValue === undefined) {
            return undefined;
        }

        const xValue = xAccessor(item);

        const x1 = fullWidth ? 0 : Math.round(xScale(xValue));
        const y1 = Math.round(yScale(yValue));

        const [left, right] = [0, width];
        const edgeX = edgeAt === "left" ? left - yAxisPad : right + yAxisPad;

        return {
            coordinate: displayFormat(yValue),
            show: true,
            type: edgeType,
            orient,
            edgeAt: edgeX,
            fill: functor(fill)(item),
            lineStroke: functor(lineStroke)(item),
            stroke: functor(stroke)(item),
            fontFamily,
            fontSize,
            textFill: functor(textFill)(item),
            rectHeight,
            rectWidth,
            arrowWidth,
            x1,
            y1,
            x2: right,
            y2: y1,
        };
    };
}
