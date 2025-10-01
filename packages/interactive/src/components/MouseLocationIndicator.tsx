import {
    functor,
    getClosestValue,
    getMouseCanvas,
    GenericChartComponent,
    isDefined,
    noop,
    shallowEqual,
} from "@reincharts/core";
import * as React from "react";
import { getXValue } from "@reincharts/core/lib/utils/ChartDataUtil";

export interface MouseLocationIndicatorProps {
    /** Flag to enable or disable the MouseLocationIndicator rendering and event handling */
    readonly enabled: boolean;
    /** Whether the indicator should snap to the nearest data point X position */
    readonly snap: boolean;
    /** Function to determine if snapping should be disabled for a given mouse event */
    readonly shouldDisableSnap: (e: React.MouseEvent) => boolean;
    /** Optional function to map the current data to Y value(s) for Y-axis snapping. Only used when snap is true. */
    readonly snapTo?: (data: any) => number | number[];
    /** If false, allows X coordinate to not be snapped to data points */
    readonly snapX: boolean;
    /** Callback invoked on mouse move; receives event, [xValue, yValue], and additional chart properties */
    readonly onMouseMove: (e: React.MouseEvent, xyValue: number[], moreProps: any) => void;
    /** Callback invoked on mouse down; receives event, [xValue, yValue], and additional chart properties */
    readonly onMouseDown: (e: React.MouseEvent, xyValue: number[], moreProps: any) => void;
    /** Callback invoked on mouse click; receives event, [xValue, yValue], and additional chart properties */
    readonly onClick: (e: React.MouseEvent, xyValue: number[], moreProps: any) => void;
    /** Radius of the indicator circle in pixels */
    readonly r: number;
    /** Stroke color of the indicator circle */
    readonly stroke: string;
    /** Stroke width of the indicator circle line */
    readonly strokeWidth: number;
    /** Opacity of the indicator circle */
    readonly opacity: number;
    /** If true, disables panning interactions while the indicator is enabled */
    readonly disablePan: boolean;
}

export class MouseLocationIndicator extends React.Component<MouseLocationIndicatorProps> {
    public static defaultProps = {
        onMouseMove: noop,
        onMouseDown: noop,
        onClick: noop,
        shouldDisableSnap: functor(false),
        snapX: true,
        stroke: "#000000",
        strokeWidth: 1,
        opacity: 1,
        disablePan: true,
    };

    private mutableState: any = {};

    public render() {
        const { enabled, disablePan } = this.props;

        return (
            <GenericChartComponent
                onMouseDown={this.handleMouseDown}
                onClick={this.handleClick}
                onMouseMove={this.handleMousePosChange}
                onPan={this.handleMousePosChange}
                disablePan={enabled && disablePan}
                canvasDraw={this.drawOnCanvas}
                canvasToDraw={getMouseCanvas}
                drawOn={["mousemove", "pan", "keydown"]}
            />
        );
    }

    private readonly xy = (e: React.MouseEvent, moreProps: any) => {
        const { xAccessor, plotData } = moreProps;
        const {
            mouseXY,
            currentItem,
            xScale,
            chartConfig: { yScale },
        } = moreProps;
        const { enabled, snap, shouldDisableSnap, snapTo, snapX } = this.props;

        if (enabled && isDefined(currentItem) && isDefined(e)) {
            const xValue =
                snap && !shouldDisableSnap(e)
                    ? xAccessor(currentItem)
                    : !snapX
                      ? xScale.invert(mouseXY[0])
                      : getXValue(xScale, xAccessor, mouseXY, plotData);
            const yValue =
                snap && snapTo !== undefined && !shouldDisableSnap(e)
                    ? getClosestValue(snapTo(currentItem), yScale.invert(mouseXY[1]))
                    : yScale.invert(mouseXY[1]);

            const x = xScale(xValue);
            const y = yScale(yValue);

            return { xValue, yValue, x, y };
        }
    };

    private readonly handleClick = (e: React.MouseEvent, moreProps: any) => {
        const pos = this.xy(e, moreProps);
        if (isDefined(pos)) {
            const { xValue, yValue, x, y } = pos;
            this.mutableState = { x, y };
            this.props.onClick(e, [xValue, yValue], moreProps);
        }
    };

    private readonly handleMouseDown = (e: React.MouseEvent, moreProps: any) => {
        const pos = this.xy(e, moreProps);
        if (isDefined(pos)) {
            const { xValue, yValue, x, y } = pos;
            this.mutableState = { x, y };
            this.props.onMouseDown(e, [xValue, yValue], moreProps);
        }
    };

    private readonly handleMousePosChange = (e: React.MouseEvent, moreProps: any) => {
        if (!shallowEqual(moreProps.mouseXY, moreProps.prevMouseXY)) {
            const pos = this.xy(e, moreProps);
            if (isDefined(pos)) {
                const { xValue, yValue, x, y } = pos;
                this.mutableState = { x, y };
                this.props.onMouseMove(e, [xValue, yValue], moreProps);
            }
        }
    };

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { enabled, r, stroke, strokeWidth, opacity } = this.props;
        const { x, y } = this.mutableState;
        const { show } = moreProps;
        if (enabled && show && isDefined(x)) {
            const originalAlpha = ctx.globalAlpha;
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = stroke;
            ctx.globalAlpha = opacity;
            ctx.moveTo(x, y);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI, false);
            ctx.stroke();
            ctx.globalAlpha = originalAlpha;
        }
    };
}
