import { functor } from "@reincharts/core";
import { ScaleContinuousNumeric } from "d3-scale";
import * as React from "react";

export interface BarAnnotationProps {
    /** CSS class name for styling the bar annotation. */
    readonly className?: string;
    /** Function to generate SVG path for the bar shape. */
    readonly path?: ({ x, y }: { x: number; y: number }) => string;
    /** Click event handler that receives mouse event and scale/data data. */
    readonly onClick?: (
        e: React.MouseEvent,
        data: {
            xScale?: ScaleContinuousNumeric<number, number>;
            yScale?: ScaleContinuousNumeric<number, number>;
            data: any;
        },
    ) => void;
    /** Function to extract x-value from data points. */
    readonly xAccessor?: (data: any) => any;
    /** D3 scale for x-axis positioning. */
    readonly xScale?: ScaleContinuousNumeric<number, number>;
    /** D3 scale for y-axis positioning. */
    readonly yScale?: ScaleContinuousNumeric<number, number>;
    /** Data point associated with this annotation. */
    readonly data?: object;
    /** Stroke color for the bar border. */
    readonly stroke?: string;
    /** Fill color for the bar, can be static string or function based on data. */
    readonly fill?: string | ((data: any) => string);
    /** Opacity level of the bar annotation (0-1). */
    readonly opacity?: number;
    /** Array of plot data points. */
    readonly plotData: any[];
    /** Text content to display on the annotation. */
    readonly text?: string;
    /** Text anchor positioning (start, middle, end). */
    readonly textAnchor?: "start" | "middle" | "end" | "inherit";
    /** Font family for the annotation text. */
    readonly fontFamily?: string;
    /** Font size for the annotation text. */
    readonly fontSize?: number;
    /** Opacity level of the text (0-1). */
    readonly textOpacity?: number;
    /** Fill color for the text. */
    readonly textFill?: string;
    /** Rotation angle for the text in degrees. */
    readonly textRotate?: number;
    /** Horizontal offset for text positioning. */
    readonly textXOffset?: number;
    /** Vertical offset for text positioning. */
    readonly textYOffset?: number;
    /** Icon character to display alongside text. */
    readonly textIcon?: string;
    /** Font size for the icon. */
    readonly textIconFontSize?: number;
    /** Opacity level of the icon (0-1). */
    readonly textIconOpacity?: number;
    /** Fill color for the icon. */
    readonly textIconFill?: string;
    /** Rotation angle for the icon in degrees. */
    readonly textIconRotate?: number;
    /** Horizontal offset for icon positioning. */
    readonly textIconXOffset?: number;
    /** Vertical offset for icon positioning. */
    readonly textIconYOffset?: number;
    /** Text anchor positioning for the icon. */
    readonly textIconAnchor?: string;
    /** Tooltip text to display on hover, can be static string or function based on data. */
    readonly tooltip?: string | ((data: any) => string);
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
}

export class BarAnnotation extends React.Component<BarAnnotationProps> {
    public static defaultProps = {
        className: "reincharts-bar-annotation",
        opacity: 1,
        fill: "#000000",
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 10,
        textAnchor: "middle",
        textFill: "#000000",
        textOpacity: 1,
        textIconFill: "#000000",
        textIconFontSize: 10,
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
        const {
            className,
            stroke,
            opacity,
            xAccessor,
            xScale,
            yScale,
            path,
            text,
            textXOffset,
            textYOffset,
            textAnchor,
            fontFamily,
            fontSize,
            textFill,
            textOpacity,
            textRotate,
            textIcon,
            textIconFontSize,
            textIconFill,
            textIconOpacity,
            textIconRotate,
            textIconXOffset,
            textIconYOffset,
        } = this.props;

        const { x, y, fill, tooltip } = this.helper(this.props, xAccessor, xScale, yScale);

        return (
            <g className={className} onClick={this.onClick}>
                {tooltip !== undefined ? <title>{tooltip}</title> : null}
                {text !== undefined ? (
                    <text
                        x={x}
                        y={y}
                        dx={textXOffset}
                        dy={textYOffset}
                        fontFamily={fontFamily}
                        fontSize={fontSize}
                        fill={textFill}
                        opacity={textOpacity}
                        transform={textRotate != undefined ? `rotate(${textRotate}, ${x}, ${y})` : undefined}
                        textAnchor={textAnchor}
                    >
                        {text}
                    </text>
                ) : null}
                {textIcon !== undefined ? (
                    <text
                        x={x}
                        y={y}
                        dx={textIconXOffset}
                        dy={textIconYOffset}
                        fontSize={textIconFontSize}
                        fill={textIconFill}
                        opacity={textIconOpacity}
                        transform={textIconRotate != undefined ? `rotate(${textIconRotate}, ${x}, ${y})` : undefined}
                        textAnchor={textAnchor}
                    >
                        {textIcon}
                    </text>
                ) : null}
                {path !== undefined ? <path d={path({ x, y })} stroke={stroke} fill={fill} opacity={opacity} /> : null}
            </g>
        );
    }

    private readonly onClick = (e: React.MouseEvent) => {
        const { onClick, xScale, yScale, data } = this.props;
        if (onClick !== undefined) {
            onClick(e, { xScale, yScale, data });
        }
    };

    private readonly helper = (props: BarAnnotationProps, xAccessor: any, xScale: any, yScale: any) => {
        const { x, y, data, fill, tooltip, plotData } = props;

        const xFunc = functor(x);
        const yFunc = functor(y);

        const [xPos, yPos] = [xFunc({ xScale, xAccessor, data, plotData }), yFunc({ yScale, data, plotData })];

        return {
            x: xPos,
            y: yPos,
            fill: functor(fill)(data),
            tooltip: functor(tooltip)(data),
        };
    };
}
