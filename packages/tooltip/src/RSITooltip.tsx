import { functor, isDefined, GenericChartComponent } from "@reincharts/core";
import { format } from "d3-format";
import * as React from "react";
import { ToolTipText } from "./ToolTipText";
import { ToolTipTSpanLabel } from "./ToolTipTSpanLabel";

export interface RSITooltipProps {
    /** CSS class name for styling the tooltip. */
    readonly className?: string;
    /** Format function for displaying RSI values. */
    readonly displayFormat: (value: number) => string;
    /** Initial display text when no data is available. */
    readonly displayInit?: string;
    /** Function to determine which data should be displayed in the tooltip. */
    readonly displayValuesFor: (props: RSITooltipProps, moreProps: any) => any;
    /** Font family for the tooltip text. */
    readonly fontFamily?: string;
    /** Font size for the tooltip text. */
    readonly fontSize?: number;
    /** Font weight for the tooltip text. */
    readonly fontWeight?: number;
    /** Fill color for the tooltip labels. */
    readonly labelFill?: string;
    /** Font weight for the tooltip labels. */
    readonly labelFontWeight?: number;
    /** Click event handler for the tooltip. */
    readonly onClick?: (event: React.MouseEvent<SVGGElement, MouseEvent>) => void;
    /** Position of the tooltip, either as coordinates or a function that calculates position. */
    readonly origin: number[] | ((width: number, height: number) => number[]);
    /** Configuration options for RSI calculation. */
    readonly options: {
        windowSize: number;
    };
    /** Fill color for the tooltip text values. */
    readonly textFill?: string;
    /** Function to access RSI values from data. */
    readonly yAccessor: (data: any) => number | undefined;
}

export class RSITooltip extends React.Component<RSITooltipProps> {
    public static defaultProps = {
        displayFormat: format(".2f"),
        displayInit: "n/a",
        displayValuesFor: (_: RSITooltipProps, props: any) => props.currentItem,
        origin: [0, 0],
        className: "reincharts-tooltip",
    };

    public render() {
        return <GenericChartComponent clip={false} svgDraw={this.renderSVG} drawOn={["mousemove"]} />;
    }

    private readonly renderSVG = (moreProps: any) => {
        const {
            onClick,
            displayInit,
            fontFamily,
            fontSize,
            fontWeight,
            yAccessor,
            displayFormat,
            className,
            options,
            labelFill,
            labelFontWeight,
            textFill,
            displayValuesFor,
        } = this.props;

        const {
            chartConfig: { width, height },
        } = moreProps;

        const currentItem = displayValuesFor(this.props, moreProps);
        const rsi = isDefined(currentItem) && yAccessor(currentItem);
        const value = (rsi && displayFormat(rsi)) || displayInit;

        const { origin: originProp } = this.props;
        const origin = functor(originProp);
        const [x, y] = origin(width, height);

        const tooltipLabel = `RSI (${options.windowSize}): `;
        return (
            <g className={className} transform={`translate(${x}, ${y})`} onClick={onClick}>
                <ToolTipText x={0} y={0} fontFamily={fontFamily} fontSize={fontSize} fontWeight={fontWeight}>
                    <ToolTipTSpanLabel fill={labelFill} fontWeight={labelFontWeight}>
                        {tooltipLabel}
                    </ToolTipTSpanLabel>
                    <tspan fill={textFill}>{value}</tspan>
                </ToolTipText>
            </g>
        );
    };
}
