import { functor } from "@reincharts/core";
import { ScaleContinuousNumeric } from "d3-scale";
import * as React from "react";

export interface LabelAnnotationProps {
    /** CSS class name for the annotation. */
    readonly className?: string;
    /** Data point for the annotation. */
    readonly data?: any;
    /** Fill color for the annotation text. */
    readonly fill?: string | ((data: any) => string);
    /** Font family for the annotation text. */
    readonly fontFamily?: string;
    /** Font size for the annotation text. */
    readonly fontSize?: number;
    /** Click event handler for the annotation. */
    readonly onClick?: (
        e: React.MouseEvent,
        data: {
            xScale?: ScaleContinuousNumeric<number, number>;
            yScale?: ScaleContinuousNumeric<number, number>;
            data: any;
        },
    ) => void;
    /** Opacity of the annotation. */
    readonly opacity?: number;
    /** Plot data array. */
    readonly plotData: any[];
    /** Rotation angle for the annotation text. */
    readonly rotate?: number;
    /** Text content of the annotation. */
    readonly text?: string | ((data: any) => string);
    /** Text anchor position. */
    readonly textAnchor?: "start" | "middle" | "end" | "inherit";
    /** Tooltip text for the annotation. */
    readonly tooltip?: string | ((data: any) => string);
    /** X accessor function for data. */
    readonly xAccessor?: (data: any) => any;
    /** X scale instance. */
    readonly xScale?: ScaleContinuousNumeric<number, number>;
    /** X position of the annotation. */
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
    /** Y scale instance. */
    readonly yScale?: ScaleContinuousNumeric<number, number>;
    /** Y position of the annotation. */
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

export class LabelAnnotation extends React.Component<LabelAnnotationProps> {
    public static defaultProps = {
        className: "reincharts-label-annotation",
        textAnchor: "middle",
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 12,
        fill: "#000000",
        opacity: 1,
        rotate: 0,
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
        const { className, textAnchor, fontFamily, fontSize, opacity, rotate } = this.props;

        const { xPos, yPos, fill, text, tooltip } = this.helper();

        return (
            <g className={className}>
                <title>{tooltip}</title>
                <text
                    x={xPos}
                    y={yPos}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    fill={fill}
                    opacity={opacity}
                    transform={`rotate(${rotate}, ${xPos}, ${yPos})`}
                    onClick={this.handleClick}
                    textAnchor={textAnchor}
                >
                    {text}
                </text>
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
        const { x, y, data, fill, text, tooltip, xAccessor, xScale, yScale, plotData } = this.props;

        const xFunc = functor(x);
        const yFunc = functor(y);

        const [xPos, yPos]: [number, number] = [
            xFunc({ xScale, xAccessor, data, plotData }),
            yFunc({ yScale, data, plotData }),
        ];

        return {
            xPos,
            yPos,
            text: functor(text)(data),
            fill: functor(fill)(data),
            tooltip: functor(tooltip)(data),
        };
    };
}
