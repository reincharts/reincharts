import { functor, GenericChartComponent, last, MoreProps } from "@reincharts/core";
import { format } from "d3-format";
import * as React from "react";
import { ToolTipText } from "./ToolTipText";
import { ToolTipTSpanLabel } from "./ToolTipTSpanLabel";

export interface SingleMAToolTipProps {
    /** Color of the tooltip indicator line. */
    readonly color: string;
    /** Display name for the moving average. */
    readonly displayName: string;
    /** Font family for tooltips. */
    readonly fontFamily?: string;
    /** Font size for tooltips. */
    readonly fontSize?: number;
    /** Font weight for tooltips. */
    readonly fontWeight?: number;
    /** Chart ID this tooltip is associated with. */
    readonly forChart: number | string;
    /** Fill color for labels. */
    readonly labelFill?: string;
    /** Font weight for labels. */
    readonly labelFontWeight?: number;
    /** Click event handler for the tooltip. */
    readonly onClick?: (event: React.MouseEvent<SVGRectElement, MouseEvent>, details: any) => void;
    /** Configuration options for the moving average. */
    readonly options: any;
    /** Position of the tooltip. */
    readonly origin: [number, number];
    /** Fill color for text. */
    readonly textFill?: string;
    /** The formatted value to display. */
    readonly value: string;
}

export class SingleMAToolTip extends React.Component<SingleMAToolTipProps> {
    public render() {
        const { color, displayName, fontSize, fontFamily, fontWeight, textFill, labelFill, labelFontWeight, value } =
            this.props;

        const translate = "translate(" + this.props.origin[0] + ", " + this.props.origin[1] + ")";

        return (
            <g transform={translate}>
                <line x1={0} y1={2} x2={0} y2={28} stroke={color} strokeWidth={4} />
                <ToolTipText x={5} y={11} fontFamily={fontFamily} fontSize={fontSize} fontWeight={fontWeight}>
                    <ToolTipTSpanLabel fill={labelFill} fontWeight={labelFontWeight}>
                        {displayName}
                    </ToolTipTSpanLabel>
                    <tspan x={5} dy={15} fill={textFill}>
                        {value}
                    </tspan>
                </ToolTipText>
                <rect x={0} y={0} width={55} height={30} onClick={this.onClick} fill="none" stroke="none" />
            </g>
        );
    }

    private readonly onClick = (event: React.MouseEvent<SVGRectElement, MouseEvent>) => {
        const { onClick, forChart, options } = this.props;
        if (onClick !== undefined) {
            onClick(event, { chartId: forChart, ...options });
        }
    };
}

interface MovingAverageTooltipProps {
    /** CSS class name for the tooltip. */
    readonly className?: string;
    /** Function to format displayed values. */
    readonly displayFormat: (value: number) => string;
    /** Position of the tooltip. */
    readonly origin: number[];
    /** Initial display text when no data is available. */
    readonly displayInit?: string;
    /** Function to determine which values to display. */
    readonly displayValuesFor?: (props: MovingAverageTooltipProps, moreProps: any) => any;
    /** Click event handler for the tooltip. */
    readonly onClick?: (event: React.MouseEvent<SVGRectElement, MouseEvent>) => void;
    /** Fill color for text. */
    readonly textFill?: string;
    /** Fill color for labels. */
    readonly labelFill?: string;
    /** Font family for tooltips. */
    readonly fontFamily?: string;
    /** Font size for tooltips. */
    readonly fontSize?: number;
    /** Font weight for tooltips. */
    readonly fontWeight?: number;
    /** Width of the tooltip. */
    readonly width?: number;
    /** Configuration options for the moving averages to display. */
    readonly options: {
        yAccessor: (data: any) => number;
        type: string;
        stroke: string;
        windowSize: number;
    }[];
}

// tslint:disable-next-line: max-classes-per-file
export class MovingAverageTooltip extends React.Component<MovingAverageTooltipProps> {
    public static defaultProps = {
        className: "reincharts-tooltip reincharts-moving-average-tooltip",
        displayFormat: format(".2f"),
        displayInit: "n/a",
        displayValuesFor: (_: any, props: any) => props.currentItem,
        origin: [0, 10],
        width: 65,
    };

    public render() {
        return <GenericChartComponent clip={false} svgDraw={this.renderSVG} drawOn={["mousemove"]} />;
    }

    private readonly renderSVG = (moreProps: MoreProps) => {
        const { chartId, chartConfig, chartConfig: { height = 0 } = {}, fullData } = moreProps;

        const {
            className,
            displayInit = MovingAverageTooltip.defaultProps.displayInit,
            onClick,
            width = 65,
            fontFamily,
            fontSize,
            fontWeight,
            textFill,
            labelFill,
            origin: originProp,
            displayFormat,
            displayValuesFor = MovingAverageTooltip.defaultProps.displayValuesFor,
            options,
        } = this.props;

        const currentItem = displayValuesFor(this.props, moreProps) ?? last(fullData);

        const config = chartConfig!;

        const origin = functor(originProp);
        const [x, y] = origin(width, height);
        const [ox, oy] = config.origin;

        return (
            <g transform={`translate(${ox + x}, ${oy + y})`} className={className}>
                {options.map((each, idx) => {
                    const yValue = currentItem && each.yAccessor(currentItem);

                    const tooltipLabel = `${each.type} (${each.windowSize})`;
                    const yDisplayValue = yValue ? displayFormat(yValue) : displayInit;
                    return (
                        <SingleMAToolTip
                            key={idx}
                            origin={[width * idx, 0]}
                            color={each.stroke}
                            displayName={tooltipLabel}
                            value={yDisplayValue}
                            options={each}
                            forChart={chartId}
                            onClick={onClick}
                            fontFamily={fontFamily}
                            fontSize={fontSize}
                            fontWeight={fontWeight}
                            textFill={textFill}
                            labelFill={labelFill}
                        />
                    );
                })}
            </g>
        );
    };
}
