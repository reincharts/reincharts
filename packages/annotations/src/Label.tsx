import { GenericChartComponent, functor } from "@reincharts/core";
import { ScaleContinuousNumeric } from "d3-scale";
import * as React from "react";

export interface LabelProps {
    /** Data point associated with this label. */
    readonly data?: any;
    /** Fill color for the label text, can be static string or function based on data. */
    readonly fillStyle?: string | ((data: any) => string);
    /** Font family for the label text. */
    readonly fontFamily?: string;
    /** Font size for the label text in pixels. */
    readonly fontSize?: number;
    /** Font weight for the label text (normal, bold, etc.). */
    readonly fontWeight?: string;
    /** Rotation angle for the label text in degrees. */
    readonly rotate?: number;
    /** Function to select which canvas to draw on from available canvases. */
    readonly selectCanvas?: (canvases: any) => any;
    /** Text content of the label, can be static string or function based on data. */
    readonly text?: string | ((data: any) => string);
    /** Text alignment for the label (left, center, right, etc.). */
    readonly textAlign?: CanvasTextAlign;
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

export class Label extends React.Component<LabelProps> {
    public static defaultProps = {
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 64,
        fontWeight: "bold",
        fillStyle: "#dcdcdc",
        rotate: 0,
        textAlign: "center",
        text: "",
        x: ({ xScale, xAccessor, data }: any) => xScale(xAccessor(data)),
        selectCanvas: (canvases: any) => canvases.bg,
    };

    public render() {
        const { selectCanvas } = this.props;

        return <GenericChartComponent canvasToDraw={selectCanvas} canvasDraw={this.drawOnCanvas} drawOn={[]} />;
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { textAlign, fontFamily, fontSize, fontWeight, rotate } = this.props;

        const { xScale, chartConfig, xAccessor } = moreProps;
        const { yScale } = chartConfig;

        const { xPos, yPos, fillStyle, text } = this.helper(moreProps, xAccessor, xScale, yScale);

        ctx.save();
        ctx.translate(xPos, yPos);
        if (rotate !== undefined) {
            const radians = (rotate / 180) * Math.PI;
            ctx.rotate(radians);
        }

        if (fontFamily !== undefined) {
            ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        }
        if (fillStyle !== undefined) {
            ctx.fillStyle = fillStyle;
        }
        if (textAlign !== undefined) {
            ctx.textAlign = textAlign;
        }

        ctx.beginPath();
        ctx.fillText(text, 0, 0);
        ctx.restore();
    };

    private readonly helper = (
        moreProps: any,
        xAccessor: any,
        xScale: ScaleContinuousNumeric<number, number>,
        yScale: ScaleContinuousNumeric<number, number>,
    ) => {
        const { x, y, data, fillStyle, text } = this.props;

        const { plotData } = moreProps;

        const xFunc = functor(x);
        const yFunc = functor(y);

        const [xPos, yPos] = [xFunc({ xScale, xAccessor, data, plotData }), yFunc({ yScale, data, plotData })];

        return {
            xPos,
            yPos,
            text: functor(text)(data),
            fillStyle: functor(fillStyle)(data),
        };
    };
}
