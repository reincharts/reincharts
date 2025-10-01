import { ChartContext, strokeDashTypes, ChartContextType } from "@reincharts/core";
import * as React from "react";
import { Axis } from "./Axis";

export interface XAxisProps<T extends number | Date> {
    /** Position of the axis. */
    readonly axisAt?: number | "top" | "bottom" | "middle";
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
    /** Orientation of the axis. */
    readonly orient?: "top" | "bottom";
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
    readonly tickFormat?: (value: T) => string;
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
    /** Height of the zoom area. */
    readonly xZoomHeight?: number;
    /** Enable zoom functionality. */
    readonly zoomEnabled?: boolean;
    /** CSS class name for the zoom cursor. */
    readonly zoomCursorClassName?: string;
}

export class XAxis<T extends number | Date> extends React.Component<XAxisProps<T>> {
    public static defaultProps = {
        axisAt: "bottom",
        className: "reincharts-x-axis",
        domainClassName: "reincharts-axis-domain",
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 12,
        fontWeight: 400,
        getMouseDelta: (startXY: [number, number], mouseXY: [number, number]) => startXY[0] - mouseXY[0],
        gridLinesStrokeStyle: "#E2E4EC",
        gridLinesStrokeWidth: 1,
        orient: "bottom",
        outerTickSize: 0,
        innerTickSize: 4,
        showDomain: true,
        showGridLines: false,
        showTicks: true,
        showTickLabel: true,
        strokeStyle: "#000000",
        strokeWidth: 1,
        tickPadding: 4,
        tickLabelFill: "#000000",
        tickStrokeStyle: "#000000",
        xZoomHeight: 25,
        zoomEnabled: true,
        zoomCursorClassName: "reincharts-ew-resize-cursor",
    };

    public static contextType = ChartContext;
    declare public context: ChartContextType;

    public render() {
        const {
            getMouseDelta = XAxis.defaultProps.getMouseDelta,
            outerTickSize = XAxis.defaultProps.outerTickSize,
            showTicks,
            strokeStyle = XAxis.defaultProps.strokeStyle,
            strokeWidth = XAxis.defaultProps.strokeWidth,
            zoomEnabled,
            ...rest
        } = this.props;

        const { ...moreProps } = this.helper();

        return (
            <Axis
                {...rest}
                {...moreProps}
                getMouseDelta={getMouseDelta}
                outerTickSize={outerTickSize}
                showTicks={showTicks}
                strokeStyle={strokeStyle}
                strokeWidth={strokeWidth}
                zoomEnabled={zoomEnabled && showTicks}
                axisZoomCallback={this.axisZoomCallback}
            />
        );
    }

    private readonly axisZoomCallback = (newXDomain: number[]) => {
        const { xAxisZoom } = this.context;

        if (xAxisZoom) {
            xAxisZoom(newXDomain);
        }
    };

    private readonly helper = () => {
        const { axisAt, xZoomHeight = XAxis.defaultProps.xZoomHeight, orient, ticks } = this.props;
        const {
            chartConfig: { width, height },
        } = this.context;

        let axisLocation: number = 0; // Default value to ensure it's always a number
        const x = 0;
        const w = width;
        const h = xZoomHeight;

        switch (axisAt) {
            case "top":
                axisLocation = 0;
                break;
            case "bottom":
                axisLocation = height;
                break;
            case "middle":
                axisLocation = height / 2;
                break;
            default:
                axisLocation = axisAt ?? 0; // Fallback to 0 if axisAt is undefined
        }

        const y = orient === "top" ? -xZoomHeight : 0;

        return {
            transform: [0, axisLocation],
            range: [0, width],
            getScale: this.getXScale,
            bg: { x, y, h, w },
            ticks: ticks ?? this.getXTicks(width),
        };
    };

    private readonly getXTicks = (width: number) => {
        if (width < 400) {
            return 2;
        }

        if (width < 500) {
            return 6;
        }

        return 8;
    };

    private readonly getXScale = (moreProps: any) => {
        const { xScale: scale, width } = moreProps;

        if (scale.invert) {
            const trueRange = [0, width];
            const trueDomain = trueRange.map(scale.invert);
            return scale.copy().domain(trueDomain).range(trueRange);
        }

        return scale;
    };
}
