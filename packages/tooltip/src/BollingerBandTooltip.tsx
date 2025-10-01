import { functor, GenericChartComponent, last } from "@reincharts/core";
import { format } from "d3-format";
import * as React from "react";
import { ToolTipText } from "./ToolTipText";
import { ToolTipTSpanLabel } from "./ToolTipTSpanLabel";

export interface BollingerBandTooltipProps {
    /** CSS class name for styling the tooltip. */
    readonly className?: string;
    /** Function to format the displayed values. */
    readonly displayFormat: (value: number) => string;
    /** Initial display text when no data is available. */
    readonly displayInit?: string;
    /** Function to determine which data item to display values for. */
    readonly displayValuesFor?: (props: BollingerBandTooltipProps, moreProps: any) => any;
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
    readonly onClick?: (event: React.MouseEvent) => void;
    /** Configuration options for the Bollinger Band indicator. */
    readonly options: {
        movingAverageType: string;
        multiplier: number;
        sourcePath: string;
        windowSize: number;
    };
    /** Position of the tooltip, can be static coordinates or function that calculates position. */
    readonly origin?: [number, number] | ((width: number, height: number) => [number, number]);
    /** Fill color for the tooltip text content. */
    readonly textFill?: string;
    /** Data accessor function for Bollinger Band values. */
    readonly yAccessor?: (data: any) => { bottom: number; middle: number; top: number };
}

export class BollingerBandTooltip extends React.Component<BollingerBandTooltipProps> {
    public static defaultProps = {
        className: "reincharts-tooltip reincharts-bollingerband-tooltip",
        displayFormat: format(".2f"),
        displayValuesFor: (_: any, props: any) => props.currentItem,
        displayInit: "n/a",
        origin: [8, 8],
        yAccessor: (data: any) => data.bb,
    };

    public render() {
        return <GenericChartComponent clip={false} svgDraw={this.renderSVG} drawOn={["mousemove"]} />;
    }

    private readonly renderSVG = (moreProps: any) => {
        const {
            onClick,
            displayFormat,
            yAccessor = BollingerBandTooltip.defaultProps.yAccessor,
            options,
            origin: originProp,
            textFill,
            labelFill,
            labelFontWeight,
            className,
            displayValuesFor = BollingerBandTooltip.defaultProps.displayValuesFor,
            displayInit,
            fontFamily,
            fontSize,
            fontWeight,
        } = this.props;

        const {
            chartConfig: { width, height },
            fullData,
        } = moreProps;

        const currentItem = displayValuesFor(this.props, moreProps) ?? last(fullData);

        let top = displayInit;
        let middle = displayInit;
        let bottom = displayInit;

        if (currentItem !== undefined) {
            const item = yAccessor(currentItem);
            if (item !== undefined) {
                top = displayFormat(item.top);
                middle = displayFormat(item.middle);
                bottom = displayFormat(item.bottom);
            }
        }

        const origin = functor(originProp);
        const [x, y] = origin(width, height);

        const { sourcePath, windowSize, multiplier, movingAverageType } = options;
        const tooltipLabel = `BB(${sourcePath}, ${windowSize}, ${multiplier}, ${movingAverageType}): `;
        const tooltipValue = `${top}, ${middle}, ${bottom}`;

        return (
            <g transform={`translate(${x}, ${y})`} className={className} onClick={onClick}>
                <ToolTipText x={0} y={0} fontFamily={fontFamily} fontSize={fontSize} fontWeight={fontWeight}>
                    <ToolTipTSpanLabel fill={labelFill} fontWeight={labelFontWeight}>
                        {tooltipLabel}
                    </ToolTipTSpanLabel>
                    <tspan fill={textFill}>{tooltipValue}</tspan>
                </ToolTipText>
            </g>
        );
    };
}
