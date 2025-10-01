import * as React from "react";
import { first, getAxisCanvas, getMouseCanvas, GenericChartComponent, last } from "@reincharts/core";

export interface SARSeriesProps {
    /** Fill colors for SAR dots. */
    readonly fillStyle?: {
        falling: string;
        rising: string;
    };
    /** Stroke colors for SAR dots. */
    readonly strokeStyle?: {
        falling: string;
        rising: string;
    };
    /** Width of the stroke around SAR dots. */
    readonly strokeWidth?: number;
    /** Whether to highlight SAR dots on hover. */
    readonly highlightOnHover?: boolean;
    /** Key for the close price in the data. */
    readonly closePath?: string;
    /** Click event handler. */
    readonly onClick?: (e: React.MouseEvent, moreProps: any) => void;
    /** Double click event handler. */
    readonly onDoubleClick?: (e: React.MouseEvent, moreProps: any) => void;
    /** Context menu event handler. */
    readonly onContextMenu?: (e: React.MouseEvent, moreProps: any) => void;
    /** Data accessor function for SAR values. */
    readonly yAccessor: (data: any) => number | undefined;
}

/**
 * SAR stands for 'stop and reverse'.
 * The indicator is below prices as they're rising and above
 * prices as they're falling. In this regard, the indicator
 * stops and reverses when the price trend reverses and breaks above or below the indicator.
 */
export class SARSeries extends React.Component<SARSeriesProps> {
    public static defaultProps = {
        fillStyle: {
            falling: "#4682B4",
            rising: "#15EC2E",
        },
        highlightOnHover: false,
        strokeWidth: 1,
        closePath: "close",
    };

    public render() {
        const { highlightOnHover, onClick, onDoubleClick, onContextMenu } = this.props;

        const hoverProps = highlightOnHover
            ? {
                  isHover: this.isHover,
                  drawOn: ["mousemove", "pan"],
                  canvasToDraw: getMouseCanvas,
              }
            : {
                  drawOn: ["pan"],
                  canvasToDraw: getAxisCanvas,
              };

        return (
            <GenericChartComponent
                canvasDraw={this.drawOnCanvas}
                onClickWhenHover={onClick}
                onDoubleClickWhenHover={onDoubleClick}
                onContextMenuWhenHover={onContextMenu}
                {...hoverProps}
            />
        );
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const {
            yAccessor,
            fillStyle = SARSeries.defaultProps.fillStyle,
            strokeStyle,
            strokeWidth = SARSeries.defaultProps.strokeWidth,
            closePath = "close",
        } = this.props;
        const {
            xAccessor,
            plotData,
            xScale,
            chartConfig: { yScale },
            hovering,
        } = moreProps;

        const width = xScale(xAccessor(last(plotData))) - xScale(xAccessor(first(plotData)));

        const d = ((width / plotData.length) * 0.5) / 2;
        const radius = Math.min(2, Math.max(0.5, d)) + (hovering ? 2 : 0);

        (plotData as any[]).forEach((each) => {
            const yValue = yAccessor(each);
            if (yValue === undefined) {
                return;
            }

            const centerX = xScale(xAccessor(each));
            const centerY = yScale(yValue);
            const closeValue = each[closePath];
            const color = yValue > closeValue ? fillStyle.falling : fillStyle.rising;

            ctx.fillStyle = color;
            if (strokeStyle !== undefined) {
                ctx.strokeStyle = yValue > closeValue ? strokeStyle.falling : strokeStyle.rising;
                ctx.lineWidth = strokeWidth;
            }

            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radius, radius, 0, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
            if (strokeStyle !== undefined) {
                ctx.stroke();
            }
        });
    };

    private readonly isHover = (moreProps: any) => {
        const {
            mouseXY,
            currentItem,
            chartConfig: { yScale },
        } = moreProps;
        const { yAccessor } = this.props;
        const y = mouseXY[1];
        const currentY = yScale(yAccessor(currentItem));
        return y < currentY + 5 && y > currentY - 5;
    };
}
