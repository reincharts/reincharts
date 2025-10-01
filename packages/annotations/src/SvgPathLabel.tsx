import { GenericChartComponent, functor } from "@reincharts/core";
import { ScaleContinuousNumeric } from "d3-scale";
import * as React from "react";

export interface SvgPathLabelProps {
    /** Data point associated with this label. */
    readonly data?: any;
    /** Fill color for the path, can be static string or function based on data. */
    readonly fillStyle?: string | ((data: any) => string);
    /** Stroke color for the path, can be static string or function based on data. */
    readonly strokeStyle?: string | ((data: any) => string);
    /** Stroke width for the path outline. */
    readonly strokeWidth?: number;
    /** Rotation angle for the path in degrees. */
    readonly rotate?: number;
    /** Scale factor for the path size. */
    readonly scale?: number;
    /** Function to select which canvas to draw on from available canvases. */
    readonly selectCanvas?: (canvases: any) => any;
    /** SVG path string (d attribute), can be static string or function based on data. */
    readonly svgPath?: string | ((data: any) => string);
    /** X position of the label, can be static number or function that calculates position. */
    readonly x:
        | number
        | ((xScale: ScaleContinuousNumeric<number, number>, xAccessor: any, data: any, plotData: any[]) => number);
    /** Function to extract x-value from data points. */
    readonly xAccessor?: (data: any) => any;
    /** D3 scale for x-axis positioning. */
    readonly xScale?: ScaleContinuousNumeric<number, number>;
    /** Y position of the label, can be static number or function that calculates position. */
    readonly y: number | ((yScale: ScaleContinuousNumeric<number, number>, data: any, plotData: any[]) => number);
    /** D3 scale for y-axis positioning. */
    readonly yScale?: ScaleContinuousNumeric<number, number>;
}

export class SvgPathLabel extends React.Component<SvgPathLabelProps> {
    public static defaultProps = {
        fillStyle: "#dcdcdc",
        rotate: 0,
        scale: 1,
        svgPath: "M0 0 L10 0 L10 10 L0 10 Z",
        x: ({ xScale, xAccessor, data }: any) => xScale(xAccessor(data)),
        selectCanvas: (canvases: any) => canvases.bg,
    };

    public render() {
        const { selectCanvas } = this.props;

        return <GenericChartComponent canvasToDraw={selectCanvas} canvasDraw={this.drawOnCanvas} drawOn={[]} />;
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { rotate, scale } = this.props;

        const { xScale, chartConfig, xAccessor } = moreProps;
        const { yScale } = chartConfig;

        const { xPos, yPos, fillStyle, strokeStyle, strokeWidth, svgPath } = this.helper(
            moreProps,
            xAccessor,
            xScale,
            yScale,
        );

        ctx.save();
        ctx.translate(xPos, yPos);

        if (scale !== undefined && scale !== 1) {
            ctx.scale(scale, scale);
        }

        if (rotate !== undefined) {
            const radians = (rotate / 180) * Math.PI;
            ctx.rotate(radians);
        }

        const path2D = new Path2D(svgPath);

        ctx.beginPath();

        if (fillStyle !== undefined) {
            ctx.fillStyle = fillStyle;
            ctx.fill(path2D);
        }

        if (strokeStyle !== undefined && strokeWidth !== undefined) {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = strokeWidth;
            ctx.stroke(path2D);
        }

        ctx.restore();
    };

    private readonly helper = (
        moreProps: any,
        xAccessor: any,
        xScale: ScaleContinuousNumeric<number, number>,
        yScale: ScaleContinuousNumeric<number, number>,
    ) => {
        const { x, y, data, fillStyle, strokeStyle, strokeWidth, svgPath } = this.props;

        const { plotData } = moreProps;

        const xFunc = functor(x);
        const yFunc = functor(y);

        const [xPos, yPos] = [xFunc({ xScale, xAccessor, data, plotData }), yFunc({ yScale, data, plotData })];

        return {
            xPos,
            yPos,
            svgPath: functor(svgPath)(data),
            fillStyle: functor(fillStyle)(data),
            strokeStyle: functor(strokeStyle)(data),
            strokeWidth,
        };
    };
}
