import { ChartContext, strokeDashTypes, ChartContextType } from "@reincharts/core";
import * as React from "react";
import { Axis } from "./Axis";

export interface YAxisProps {
    /** Position of the Y axis. */
    readonly axisAt?: number | "left" | "right" | "middle";
    /** CSS class name for the axis. */
    readonly className?: string;
    /** CSS class name for the domain line. */
    readonly domainClassName?: string;
    /** Font family for tick labels. */
    readonly fontFamily?: string;
    /** Font size for tick labels. */
    readonly fontSize?: number;
    /** Font weight for tick labels. */
    readonly fontWeight?: number;
    /** Function to calculate mouse delta for zoom operations. */
    readonly getMouseDelta?: (startXY: [number, number], mouseXY: [number, number]) => number;
    /** Color of the grid lines. */
    readonly gridLinesStrokeStyle?: string;
    /** Width of the grid lines. */
    readonly gridLinesStrokeWidth?: number;
    /** Dash style for the grid lines. */
    readonly gridLinesStrokeDasharray?: strokeDashTypes;
    /** Length of the inner ticks. */
    readonly innerTickSize?: number;
    /** Context menu event handler. */
    readonly onContextMenu?: (e: React.MouseEvent, mousePosition: [number, number]) => void;
    /** Double click event handler. */
    readonly onDoubleClick?: (e: React.MouseEvent, mousePosition: [number, number]) => void;
    /** Orientation of the Y axis. */
    readonly orient?: "left" | "right";
    /** Length of the outer ticks. */
    readonly outerTickSize?: number;
    /** Show the axis domain line. */
    readonly showDomain?: boolean;
    /** Show grid lines. */
    readonly showGridLines?: boolean;
    /** Show axis ticks. */
    readonly showTicks?: boolean;
    /** Show tick labels. */
    readonly showTickLabel?: boolean;
    /** Color of the axis line. */
    readonly strokeStyle?: string;
    /** Width of the axis line. */
    readonly strokeWidth?: number;
    /** Function to format tick values. */
    readonly tickFormat?: (value: number) => string;
    /** Padding between ticks and labels. */
    readonly tickPadding?: number;
    /** Size of the ticks. */
    readonly tickSize?: number;
    /** Color of the tick labels. */
    readonly tickLabelFill?: string;
    /** Number of ticks. */
    readonly ticks?: number;
    /** Color of the tick marks. */
    readonly tickStrokeStyle?: string;
    /** Width of the tick marks. */
    readonly tickStrokeWidth?: number;
    /** Dash style for the tick marks. */
    readonly tickStrokeDasharray?: strokeDashTypes;
    /** Custom tick values to display. */
    readonly tickValues?: number[];
    /** Width of the zoom area. */
    readonly yZoomWidth?: number;
    /** Enable zoom functionality. */
    readonly zoomEnabled?: boolean;
    /** CSS class name for the zoom cursor. */
    readonly zoomCursorClassName?: string;
}

export class YAxis extends React.Component<YAxisProps> {
    public static defaultProps = {
        axisAt: "right",
        className: "reincharts-y-axis",
        domainClassName: "reincharts-axis-domain",
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 12,
        fontWeight: 400,
        getMouseDelta: (startXY: [number, number], mouseXY: [number, number]) => startXY[1] - mouseXY[1],
        gridLinesStrokeStyle: "#e2e4ec",
        gridLinesStrokeWidth: 1,
        innerTickSize: 4,
        outerTickSize: 0,
        orient: "right",
        showDomain: true,
        showGridLines: false,
        showTicks: true,
        showTickLabel: true,
        strokeStyle: "#000000",
        strokeWidth: 1,
        tickPadding: 4,
        tickLabelFill: "#000000",
        tickStrokeStyle: "#000000",
        yZoomWidth: 40,
        zoomEnabled: true,
        zoomCursorClassName: "reincharts-ns-resize-cursor",
    };

    public static contextType = ChartContext;
    declare public context: ChartContextType;

    public render() {
        const {
            getMouseDelta = YAxis.defaultProps.getMouseDelta,
            outerTickSize = YAxis.defaultProps.outerTickSize,
            strokeStyle = YAxis.defaultProps.strokeStyle,
            strokeWidth = YAxis.defaultProps.strokeWidth,
            ...rest
        } = this.props;

        const { zoomEnabled, ...moreProps } = this.helper();

        return (
            <Axis
                {...rest}
                {...moreProps}
                edgeClip
                getMouseDelta={getMouseDelta}
                outerTickSize={outerTickSize}
                strokeStyle={strokeStyle}
                strokeWidth={strokeWidth}
                zoomEnabled={this.props.zoomEnabled && zoomEnabled}
                axisZoomCallback={this.axisZoomCallback}
            />
        );
    }

    private readonly axisZoomCallback = (newYDomain: number[]) => {
        const { chartId, yAxisZoom } = this.context;

        if (yAxisZoom) {
            yAxisZoom(String(chartId), newYDomain);
        }
    };

    private readonly helper = () => {
        const { axisAt, ticks, yZoomWidth = YAxis.defaultProps.yZoomWidth, orient } = this.props;
        const {
            chartConfig: { width, height },
        } = this.context;

        let axisLocation: number = 0; // Default to 0 to ensure it's always a number
        const y = 0;
        const w = yZoomWidth;
        const h = height;

        switch (axisAt) {
            case "left":
                axisLocation = 0;
                break;
            case "right":
                axisLocation = width;
                break;
            case "middle":
                axisLocation = width / 2;
                break;
            default:
                axisLocation = axisAt ?? 0; // Provide a fallback value if axisAt is undefined
        }

        const x = orient === "left" ? -yZoomWidth : 0;

        return {
            transform: [axisLocation, 0],
            range: [0, height],
            getScale: this.getYScale,
            bg: { x, y, h, w },
            ticks: ticks ?? this.getYTicks(height),
            zoomEnabled: this.context.chartConfig.yPan,
        };
    };

    private readonly getYTicks = (height: number) => {
        if (height < 300) {
            return 2;
        }

        if (height < 500) {
            return 6;
        }

        return 8;
    };

    private readonly getYScale = (moreProps: any) => {
        const { yScale: scale, flipYScale, height } = moreProps.chartConfig;
        if (scale.invert) {
            const trueRange = flipYScale ? [0, height] : [height, 0];
            const trueDomain = trueRange.map(scale.invert);
            return scale.copy().domain(trueDomain).range(trueRange);
        }
        return scale;
    };
}
