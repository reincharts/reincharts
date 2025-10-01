import {
    ChartCanvasContext,
    first,
    GenericComponent,
    getMouseCanvas,
    getStrokeDasharrayCanvas,
    last,
    strokeDashTypes,
} from "@reincharts/core";
import * as React from "react";

export interface CursorProps {
    /** Custom function to calculate the X coordinate position. */
    readonly customX?: (props: CursorProps, moreProps: any) => number;
    /** Whether to disable the Y cursor line. */
    readonly disableYCursor?: boolean;
    /** Controls whether the X coordinate of the cursor snaps to the nearest data point. */
    readonly snapX?: boolean;
    /** Dash style for the cursor lines. */
    readonly strokeDasharray?: strokeDashTypes;
    /** Color of the cursor lines. */
    readonly strokeStyle?: string;
    /** Whether to use a custom shape for the X cursor. */
    readonly useXCursorShape?: boolean;
    /** Fill for the custom XCursorShape. Can be color or custom function. */
    readonly xCursorShapeFillStyle?: string | ((currentItem: any) => string);
    /** Stroke for the custom XCursorShape. Can be color or custom function. */
    readonly xCursorShapeStrokeStyle?: string | ((currentItem: any) => string);
    /** Stroke dash style for the custom XCursorShape. */
    readonly xCursorShapeStrokeDasharray?: strokeDashTypes;
}

const defaultCustomSnapX = (props: CursorProps, moreProps: any) => {
    const { xScale, xAccessor, currentItem, mouseXY } = moreProps;
    const { snapX } = props;
    const x = snapX ? Math.round(xScale(xAccessor(currentItem))) : mouseXY[0];
    return x;
};

export class Cursor extends React.Component<CursorProps> {
    public static defaultProps = {
        strokeStyle: "rgba(55, 71, 79, 0.8)",
        strokeDasharray: "ShortDash",
        snapX: true,
        customX: defaultCustomSnapX,
        disableYCursor: false,
        useXCursorShape: false,
        xCursorShapeFillStyle: "rgba(0, 0, 0, 0.5)",
        xCursorShapeStrokeStyle: "rgba(0, 0, 0, 0.5)",
    };

    public static contextType = ChartCanvasContext;
    declare public context: React.ContextType<typeof ChartCanvasContext>;

    public render() {
        return (
            <GenericComponent
                clip={false}
                canvasDraw={this.drawOnCanvas}
                canvasToDraw={getMouseCanvas}
                drawOn={["mousemove", "pan", "drag"]}
            />
        );
    }

    private getXCursorShapeStroke({ currentItem }: any): string | undefined {
        const { xCursorShapeStrokeStyle } = this.props;

        return xCursorShapeStrokeStyle instanceof Function
            ? xCursorShapeStrokeStyle(currentItem)
            : xCursorShapeStrokeStyle;
    }

    private getXCursorShapeFill({ currentItem }: any): string | undefined {
        const { xCursorShapeFillStyle } = this.props;

        return xCursorShapeFillStyle instanceof Function ? xCursorShapeFillStyle(currentItem) : xCursorShapeFillStyle;
    }

    private getXCursorShape(moreProps: any) {
        const { height, xScale, currentItem, plotData } = moreProps;
        const { xAccessor } = moreProps;
        const xValue = xAccessor(currentItem);
        const centerX = xScale(xValue);
        const shapeWidth =
            Math.abs(xScale(xAccessor(last(plotData))) - xScale(xAccessor(first(plotData)))) / (plotData.length - 1);
        const xPos = centerX - shapeWidth / 2;

        return { height, xPos, shapeWidth };
    }

    private getXYCursor(props: CursorProps, moreProps: any) {
        const { mouseXY, currentItem, show, height, width } = moreProps;

        const { customX = Cursor.defaultProps.customX, strokeStyle, strokeDasharray, disableYCursor } = props;

        if (!show || currentItem === undefined) {
            return undefined;
        }

        const yCursor = {
            x1: 0,
            x2: width,
            y1: mouseXY[1] + 0.5,
            y2: mouseXY[1] + 0.5,
            strokeStyle,
            strokeDasharray,
            isXCursor: false,
        };

        const x = customX(props, moreProps);

        const xCursor = {
            x1: x,
            x2: x,
            y1: 0,
            y2: height,
            strokeStyle,
            strokeDasharray,
            isXCursor: true,
        };

        return disableYCursor ? [xCursor] : [yCursor, xCursor];
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const cursors = this.getXYCursor(this.props, moreProps);
        if (cursors === undefined) {
            return;
        }

        const { useXCursorShape } = this.props;

        const { margin, ratio } = this.context;

        const originX = 0.5 * ratio + margin.left;
        const originY = 0.5 * ratio + margin.top;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);
        ctx.translate(originX, originY);

        cursors.forEach((line) => {
            if (useXCursorShape && line.isXCursor) {
                const { xCursorShapeStrokeDasharray } = this.props;
                if (xCursorShapeStrokeDasharray !== undefined) {
                    const xShapeStrokeStyle = this.getXCursorShapeStroke(moreProps);
                    if (xShapeStrokeStyle !== undefined) {
                        ctx.strokeStyle = xShapeStrokeStyle;
                    }
                    ctx.setLineDash(getStrokeDasharrayCanvas(xCursorShapeStrokeDasharray));
                }

                ctx.beginPath();
                const xShapeFillStyle = this.getXCursorShapeFill(moreProps);
                if (xShapeFillStyle !== undefined) {
                    ctx.fillStyle = xShapeFillStyle;
                }

                ctx.beginPath();

                const xShape = this.getXCursorShape(moreProps);
                if (xCursorShapeStrokeDasharray === undefined) {
                    ctx.fillRect(xShape.xPos, 0, xShape.shapeWidth, xShape.height);
                } else {
                    ctx.rect(xShape.xPos, 0, xShape.shapeWidth, xShape.height);
                }
                ctx.fill();
            } else {
                if (line.strokeStyle !== undefined) {
                    ctx.strokeStyle = line.strokeStyle;
                }

                const dashArray = getStrokeDasharrayCanvas(line.strokeDasharray);
                ctx.setLineDash(dashArray);
                ctx.beginPath();
                ctx.moveTo(line.x1, line.y1);
                ctx.lineTo(line.x2, line.y2);
            }

            ctx.stroke();
        });

        ctx.restore();
    };
}
