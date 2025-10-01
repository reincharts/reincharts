import * as React from "react";
import {
    getMouseCanvas,
    GenericChartComponent,
    isDefined,
    noop,
    strokeDashTypes,
    getStrokeDasharrayCanvas,
} from "@reincharts/core";

export interface HorizontalLineIndicatorProps {
    /** Flag to enable or disable the HorizontalLineIndicator rendering and event handling */
    readonly enabled: boolean;
    /** Callback invoked on mouse move; receives event, [xValue, yValue], and additional chart properties */
    readonly onMouseMove: (e: React.MouseEvent, xyValue: number[], moreProps: any) => void;
    /** Callback invoked on mouse down; receives event, [xValue, yValue], and additional chart properties */
    readonly onMouseDown: (e: React.MouseEvent, xyValue: number[], moreProps: any) => void;
    /** Callback invoked on mouse click; receives event, [xValue, yValue], and additional chart properties */
    readonly onClick: (e: React.MouseEvent, xyValue: number[], moreProps: any) => void;
    /** Stroke color of the horizontal line */
    readonly stroke: string;
    /** Stroke width of the horizontal line */
    readonly strokeWidth: number;
    /** Opacity of the horizontal line */
    readonly opacity: number;
    /** Stroke dash array for the line style */
    readonly strokeDasharray?: strokeDashTypes;
    /** If true, disables panning interactions while the indicator is enabled */
    readonly disablePan: boolean;
}

export class HorizontalLineIndicator extends React.Component<HorizontalLineIndicatorProps> {
    public static defaultProps: Partial<HorizontalLineIndicatorProps> = {
        onMouseMove: noop,
        onMouseDown: noop,
        onClick: noop,
        stroke: "#6574CD",
        strokeWidth: 2,
        opacity: 1,
        strokeDasharray: "Dash",
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

    private readonly xy = (
        e: React.MouseEvent,
        moreProps: any,
    ): { xValue: any; yValue: any; x: any; y: any } | undefined => {
        const { xAccessor } = moreProps;
        const {
            mouseXY,
            currentItem,
            xScale,
            chartConfig: { yScale },
        } = moreProps;
        const { enabled } = this.props;

        if (enabled && isDefined(currentItem) && isDefined(e)) {
            const xValue = xAccessor(currentItem);
            const yValue = yScale.invert(mouseXY[1]);
            const x = xScale(xValue);
            const y = yScale(yValue);

            return { xValue, yValue, x, y };
        }

        return undefined;
    };

    private readonly handleClick = (e: React.MouseEvent, moreProps: any) => {
        const pos = this.xy(e, moreProps);
        if (isDefined(pos)) {
            const { xValue, yValue, x, y } = pos!;
            this.mutableState = { x, y };
            this.props.onClick(e, [xValue, yValue], moreProps);
        }
    };

    private readonly handleMouseDown = (e: React.MouseEvent, moreProps: any) => {
        const pos = this.xy(e, moreProps);
        if (isDefined(pos)) {
            const { xValue, yValue, x, y } = pos!;
            this.mutableState = { x, y };
            this.props.onMouseDown(e, [xValue, yValue], moreProps);
        }
    };

    private readonly handleMousePosChange = (e: React.MouseEvent, moreProps: any) => {
        const { enabled } = this.props;
        if (!enabled) {
            return;
        }

        const pos = this.xy(e, moreProps);
        if (isDefined(pos)) {
            const { xValue, yValue, x, y } = pos!;
            this.mutableState = { x, y };
            this.props.onMouseMove(e, [xValue, yValue], moreProps);
        }
    };

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { enabled, stroke, strokeWidth, opacity, strokeDasharray } = this.props;

        if (!enabled) {
            return;
        }

        const { y } = this.mutableState;
        const {
            chartConfig: { width },
        } = moreProps;

        if (isDefined(y)) {
            ctx.save();

            ctx.globalAlpha = opacity;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = strokeWidth;

            const dashArray = getStrokeDasharrayCanvas(
                strokeDasharray ?? (HorizontalLineIndicator.defaultProps.strokeDasharray as strokeDashTypes),
            );
            ctx.setLineDash(dashArray);

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            ctx.restore();
        }
    };
}
