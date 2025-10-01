import { functor } from "@reincharts/core";
import { ScaleContinuousNumeric } from "d3-scale";
import * as React from "react";

export interface SvgPathAnnotationProps {
    /** CSS class name for styling the SVG path annotation. */
    readonly className?: string;
    /** Data point associated with this annotation. */
    readonly data?: any;
    /** Fill color for the SVG path, can be static string or function based on data. */
    readonly fill?: string | ((data: any) => string);
    /** Click event handler that receives mouse event and scale/data data. */
    readonly onClick?: (
        e: React.MouseEvent,
        data: {
            xScale?: ScaleContinuousNumeric<number, number>;
            yScale?: ScaleContinuousNumeric<number, number>;
            data: any;
        },
    ) => void;
    /** Opacity level of the SVG path (0-1). */
    readonly opacity?: number;
    /** Function that generates the SVG path string based on data. */
    readonly path: (data: any) => string;
    /** Height of the SVG path in pixels. */
    readonly pathHeight: number;
    /** Width of the SVG path in pixels. */
    readonly pathWidth: number;
    /** Array of plot data points. */
    readonly plotData: any[];
    /** Stroke color for the SVG path border. */
    readonly stroke?: string;
    /** Tooltip text to display on hover, can be static string or function based on data. */
    readonly tooltip?: string | ((data: any) => string);
    /** Function to extract x-value from data points. */
    readonly xAccessor?: (data: any) => any;
    /** X position of the annotation, can be static number or function that calculates position based on scales and data. */
    readonly x?:
        | number
        | (({
              xScale,
              xAccessor,
              data,
              plotData,
          }: {
              xScale: ScaleContinuousNumeric<number, number>;
              xAccessor: (data: any) => any;
              data: any;
              plotData: any[];
          }) => number);
    /** D3 scale for x-axis positioning. */
    readonly xScale?: ScaleContinuousNumeric<number, number>;
    /** Y position of the annotation, can be static number or function that calculates position based on scales and data. */
    readonly y?:
        | number
        | (({
              yScale,
              data,
              plotData,
          }: {
              yScale: ScaleContinuousNumeric<number, number>;
              data: any;
              plotData: any[];
          }) => number);
    /** D3 scale for y-axis positioning. */
    readonly yScale?: ScaleContinuousNumeric<number, number>;
}

export class SvgPathAnnotation extends React.Component<SvgPathAnnotationProps> {
    public static defaultProps = {
        className: "reincharts-svg-path-annotation",
        opacity: 1,
        x: ({
            xScale,
            xAccessor,
            data,
        }: {
            xScale: ScaleContinuousNumeric<number, number>;
            xAccessor: any;
            data: any;
        }) => xScale(xAccessor(data)),
    };

    public render() {
        const { className, data, stroke, opacity, path, pathWidth, pathHeight } = this.props;

        const { x, y, fill, tooltip } = this.helper();

        return (
            <g className={className} onClick={this.handleClick}>
                <title>{tooltip}</title>
                <path
                    transform={`translate(${x - pathWidth},${y - pathHeight})`}
                    d={path(data)}
                    stroke={stroke}
                    fill={fill}
                    opacity={opacity}
                />
            </g>
        );
    }

    private readonly handleClick = (e: React.MouseEvent) => {
        const { onClick, xScale, yScale, data } = this.props;
        if (onClick !== undefined) {
            onClick(e, { xScale, yScale, data });
        }
    };

    private readonly helper = () => {
        const { x, y, data, fill, tooltip, xAccessor, xScale, yScale, plotData } = this.props;

        const xFunc = functor(x);
        const yFunc = functor(y);

        const [xPos, yPos]: [number, number] = [
            xFunc({ xScale, xAccessor, data, plotData }),
            yFunc({ yScale, data, plotData }),
        ];

        return {
            x: Math.round(xPos),
            y: Math.round(yPos),
            fill: functor(fill)(data),
            tooltip: functor(tooltip)(data),
        };
    };
}
