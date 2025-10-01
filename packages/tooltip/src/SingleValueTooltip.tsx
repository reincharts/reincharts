import { functor, identity, GenericChartComponent, noop, last } from "@reincharts/core";
import { format } from "d3-format";
import * as React from "react";
import { ToolTipText } from "./ToolTipText";
import { ToolTipTSpanLabel } from "./ToolTipTSpanLabel";

export interface SingleValueTooltipProps {
    /** Function to format the displayed X value. */
    readonly xDisplayFormat?: (value: number) => string;
    /** Function to format the displayed Y value. */
    readonly yDisplayFormat?: (value: number) => string;
    /** Initial display text for X value when no data is available. */
    readonly xInitDisplay?: string;
    /** Initial display text for Y value when no data is available. */
    readonly yInitDisplay?: string;
    /** Label text for the X value. */
    readonly xLabel?: string;
    /** Label text for the Y value. */
    readonly yLabel: string;
    /** Fill color for the tooltip labels. */
    readonly labelFill?: string;
    /** Font weight for the tooltip labels. */
    readonly labelFontWeight?: number;
    /** Fill color for the tooltip values. */
    readonly valueFill?: string;
    /** Position of the tooltip, can be static coordinates or function that calculates position. */
    readonly origin?: [number, number] | ((width: number, height: number) => [number, number]);
    /** CSS class name for styling the tooltip. */
    readonly className?: string;
    /** Font family for the tooltip text. */
    readonly fontFamily?: string;
    /** Font size for the tooltip text. */
    readonly fontSize?: number;
    /** Font weight for the tooltip text. */
    readonly fontWeight?: number;
    /** Click event handler for the tooltip. */
    readonly onClick?: (event: React.MouseEvent<SVGGElement, MouseEvent>) => void;
    /** Function to determine which data item to display values for. */
    readonly displayValuesFor?: (props: SingleValueTooltipProps, moreProps: any) => any;
    /** Data accessor function for X values. */
    readonly xAccessor?: (d: any) => number;
    /** Data accessor function for Y values. */
    readonly yAccessor?: (d: any) => number;
}

export class SingleValueTooltip extends React.Component<SingleValueTooltipProps> {
    public static defaultProps = {
        className: "reincharts-tooltip",
        displayValuesFor: (_: any, props: any) => props.currentItem,
        labelFill: "#4682B4",
        origin: [0, 0],
        valueFill: "#000000",
        xAccessor: noop,
        xDisplayFormat: identity as (value: number) => string,
        xInitDisplay: "n/a",
        yAccessor: identity as (d: any) => number,
        yDisplayFormat: format(".2f") as (value: number) => string,
        yInitDisplay: "n/a",
    };

    public render() {
        return <GenericChartComponent clip={false} svgDraw={this.renderSVG} drawOn={["mousemove"]} />;
    }

    private readonly renderSVG = (moreProps: any) => {
        const {
            onClick,
            fontFamily,
            fontSize,
            fontWeight,
            labelFill,
            labelFontWeight,
            valueFill,
            className,
            displayValuesFor = SingleValueTooltip.defaultProps.displayValuesFor,
            origin: originProp,
            xDisplayFormat = SingleValueTooltip.defaultProps.xDisplayFormat,
            yDisplayFormat = SingleValueTooltip.defaultProps.yDisplayFormat,
            xLabel,
            yLabel,
            xAccessor = SingleValueTooltip.defaultProps.xAccessor,
            yAccessor = SingleValueTooltip.defaultProps.yAccessor,
            xInitDisplay,
            yInitDisplay,
        } = this.props;

        const {
            chartConfig: { width, height },
            fullData,
        } = moreProps;

        const currentItem = displayValuesFor(this.props, moreProps) ?? last(fullData);

        let xDisplayValue = xInitDisplay;
        let yDisplayValue = yInitDisplay;
        if (currentItem !== undefined) {
            const xItem = xAccessor(currentItem);
            if (xItem !== undefined) {
                xDisplayValue = xDisplayFormat(xItem);
            }

            const yItem = yAccessor(currentItem);
            if (yItem !== undefined) {
                yDisplayValue = yDisplayFormat(yItem);
            }
        }

        const origin = functor(originProp);

        const [x, y] = origin(width, height);

        return (
            <g className={className} transform={`translate(${x}, ${y})`} onClick={onClick}>
                <ToolTipText x={0} y={0} fontFamily={fontFamily} fontSize={fontSize} fontWeight={fontWeight}>
                    {xLabel ? (
                        <ToolTipTSpanLabel x={0} dy="5" fill={labelFill}>{`${xLabel}: `}</ToolTipTSpanLabel>
                    ) : null}
                    {xLabel ? <tspan fill={valueFill}>{`${xDisplayValue} `}</tspan> : null}
                    <ToolTipTSpanLabel fill={labelFill} fontWeight={labelFontWeight}>{`${yLabel} `}</ToolTipTSpanLabel>
                    <tspan fill={valueFill}>{yDisplayValue}</tspan>
                </ToolTipText>
            </g>
        );
    };
}
