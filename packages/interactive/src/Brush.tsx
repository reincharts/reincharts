import * as React from "react";
import { flushSync } from "react-dom";
import { getStrokeDasharrayCanvas, getMouseCanvas, GenericChartComponent, strokeDashTypes } from "@reincharts/core";

export interface BrushProps {
    /** Enable or disable the brush selection tool. */
    readonly enabled: boolean;
    /** Callback function called when the brush selection ends.
     * Returns a start and end value to compute new chart extents.
     */
    readonly onBrush: ({ start, end }: any, moreProps: any) => void;
    /** Color of the brush selection border. */
    readonly strokeStyle?: string;
    /** Fill color of the brush selection area. */
    readonly fillStyle?: string;
    /** Dash style for the brush border. */
    readonly strokeDashArray?: strokeDashTypes;
    /** Width of the brush selection border. */
    readonly strokeWidth?: number;
}

interface BrushState {
    end?: any;
    rect: any | null;
    selected?: boolean;
    start?: any;
    x1y1?: any;
}

export class Brush extends React.Component<BrushProps, BrushState> {
    public static displayName = "Brush";

    public static defaultProps = {
        strokeStyle: "#000000",
        fillStyle: "rgba(150, 150, 150, 0.3)",
        strokeDashArray: "ShortDash",
        strokeWidth: 1,
    };

    private zoomHappening?: boolean;

    public constructor(props: BrushProps) {
        super(props);

        this.terminate = this.terminate.bind(this);
        this.state = {
            rect: null,
        };
    }

    public terminate() {
        this.zoomHappening = false;
        this.setState({
            x1y1: null,
            start: null,
            end: null,
            rect: null,
        });
    }

    public render() {
        const { enabled } = this.props;
        if (!enabled) {
            return null;
        }

        return (
            <GenericChartComponent
                disablePan={enabled}
                canvasToDraw={getMouseCanvas}
                canvasDraw={this.drawOnCanvas}
                onMouseDown={this.handleZoomStart}
                onMouseMove={this.handleDrawSquare}
                onClick={this.handleZoomComplete}
                drawOn={["mousemove", "pan", "drag"]}
            />
        );
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D) => {
        const { rect } = this.state;
        if (rect === null) {
            return;
        }

        const { x, y, height, width } = rect;
        const {
            strokeStyle = Brush.defaultProps.strokeStyle,
            fillStyle = Brush.defaultProps.fillStyle,
            strokeDashArray,
            strokeWidth = Brush.defaultProps.strokeWidth,
        } = this.props;

        const dashArray = getStrokeDasharrayCanvas(strokeDashArray);

        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;
        ctx.fillStyle = fillStyle;
        ctx.setLineDash(dashArray);
        ctx.beginPath();
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
    };

    private readonly handleZoomStart = (_: React.MouseEvent, moreProps: any) => {
        this.zoomHappening = false;
        const {
            mouseXY: [, mouseY],
            currentItem,
            chartConfig: { yScale },
            xAccessor,
            xScale,
        } = moreProps;

        const x1y1 = [xScale(xAccessor(currentItem)), mouseY];

        this.setState({
            selected: true,
            x1y1,
            start: {
                item: currentItem,
                xValue: xAccessor(currentItem),
                yValue: yScale.invert(mouseY),
            },
        });
    };

    private readonly handleDrawSquare = (_: React.MouseEvent, moreProps: any) => {
        if (this.state.x1y1 == null) {
            return;
        }

        this.zoomHappening = true;

        const {
            mouseXY: [, mouseY],
            currentItem,
            chartConfig: { yScale },
            xAccessor,
            xScale,
        } = moreProps;

        const [x2, y2] = [xScale(xAccessor(currentItem)), mouseY];

        const {
            x1y1: [x1, y1],
        } = this.state;

        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const height = Math.abs(y2 - y1);
        const width = Math.abs(x2 - x1);

        flushSync(() => {
            this.setState({
                selected: true,
                end: {
                    item: currentItem,
                    xValue: xAccessor(currentItem),
                    yValue: yScale.invert(mouseY),
                },
                rect: {
                    x,
                    y,
                    height,
                    width,
                },
            });
        });
    };

    private readonly handleZoomComplete = (_: React.MouseEvent, moreProps: any) => {
        if (this.zoomHappening) {
            const { onBrush } = this.props;
            if (onBrush !== undefined) {
                const { start, end } = this.state;
                onBrush({ start, end }, moreProps);
            }
        }

        this.terminate();
    };
}
