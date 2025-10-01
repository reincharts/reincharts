import { ChartContext, last } from "@reincharts/core";
import { interpolateNumber } from "d3-interpolate";
import * as React from "react";

export interface ZoomButtonsProps {
    /** Fill color for the zoom buttons. */
    readonly fill: string;
    /** Height offset from the base position. */
    readonly heightFromBase: number;
    /** Callback function when reset button is clicked. */
    readonly onReset?: () => void;
    /** Radius of the zoom buttons. */
    readonly r: number;
    /** Stroke color for the button borders. */
    readonly stroke: string;
    /** Width of the button stroke. */
    readonly strokeWidth: number;
    /** Fill color for the button text. */
    readonly textFill: string;
    /** Multiplier for zoom sensitivity. */
    readonly zoomMultiplier: number;
}

export class ZoomButtons extends React.Component<ZoomButtonsProps> {
    public static defaultProps = {
        fill: "rgba(255,255,255,0.75)",
        heightFromBase: 32,
        r: 16,
        stroke: "#e0e3eb",
        strokeWidth: 1,
        textFill: "#000000",
        zoomMultiplier: 1.5,
    };

    public static contextType = ChartContext;
    declare public context: React.ContextType<typeof ChartContext>;

    private interval?: number;

    public render() {
        const { chartConfig } = this.context;

        const { width, height } = chartConfig;

        const { heightFromBase, r, fill, onReset, stroke, strokeWidth, textFill } = this.props;

        const centerX = Math.round(width / 2);
        const y = height - heightFromBase;

        const zoomOutX = centerX - 16 - r * 2;
        const zoomInX = centerX - 8;
        const resetX = centerX + 16 + r * 2;

        const iconSize = r * 1.2;
        const iconOffset = iconSize / 2;

        return (
            <g className="reincharts-zoom-buttons">
                {/* Zoom Out Button */}
                <circle
                    className="reincharts-button"
                    cx={zoomOutX - r / 2}
                    cy={y + r / 2}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    r={r}
                />
                <g
                    transform={`translate(${zoomOutX - r / 2 - iconOffset}, ${y + r / 2 - iconOffset}) scale(${iconSize / 24})`}
                >
                    <path d="M19,13H5V11H19V13Z" fill={textFill} />
                </g>

                {/* Zoom In Button */}
                <circle
                    className="reincharts-button"
                    cx={zoomInX - r / 2}
                    cy={y + r / 2}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    r={r}
                />
                <g
                    transform={`translate(${zoomInX - r / 2 - iconOffset}, ${y + r / 2 - iconOffset}) scale(${iconSize / 24})`}
                >
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" fill={textFill} />
                </g>

                {/* Reset Button */}
                <circle
                    className="reincharts-button"
                    cx={resetX - r / 2}
                    cy={y + r / 2}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    r={r}
                />
                <g
                    transform={`translate(${resetX - r / 2 - iconOffset}, ${y + r / 2 - iconOffset}) scale(${iconSize / 16})`}
                >
                    <path
                        d="M2.35 2.35A7.958 7.958 0 018 0a8 8 0 110 16c-3.73 0-6.84-2.55-7.73-6h2.08c.82 2.33 3.04 4 5.65 4A6 6 0 108 2c-1.66 0-3.14.69-4.22 1.78L7 7H0V0l2.35 2.35z"
                        fill={textFill}
                    />
                </g>

                {/* Interaction Circles */}
                <circle
                    className="reincharts-enable-interaction out"
                    onClick={this.handleZoomOut}
                    cx={zoomOutX - r / 2}
                    cy={y + r / 2}
                    r={r}
                    fill="none"
                />
                <circle
                    className="reincharts-enable-interaction in"
                    onClick={this.handleZoomIn}
                    cx={zoomInX - r / 2}
                    cy={y + r / 2}
                    r={r}
                    fill="none"
                />
                <circle
                    className="reincharts-enable-interaction reset"
                    onClick={onReset}
                    cx={resetX - r / 2}
                    cy={y + r / 2}
                    r={r}
                    fill="none"
                />
            </g>
        );
    }

    private readonly handleZoomIn = () => {
        if (this.interval) {
            return;
        }

        this.zoom(-1);
    };

    private readonly handleZoomOut = () => {
        if (this.interval) {
            return;
        }

        this.zoom(1);
    };

    private readonly zoom = (direction: number) => {
        const { xAxisZoom, xScale, plotData, xAccessor } = this.context;

        const cx = xScale(xAccessor(last(plotData)));

        const { zoomMultiplier } = this.props;

        const c = direction > 0 ? 1 * zoomMultiplier : 1 / zoomMultiplier;

        const [start, end] = xScale.domain();
        const [newStart, newEnd] = xScale
            .range()
            .map((x: number) => cx + (x - cx) * c)
            .map((value: number) => xScale.invert(value));

        const left = interpolateNumber(start, newStart);
        const right = interpolateNumber(end, newEnd);

        const foo = [0.25, 0.3, 0.5, 0.6, 0.75, 1].map((i) => {
            return [left(i), right(i)];
        });

        this.interval = window.setInterval(() => {
            if (xAxisZoom) {
                xAxisZoom(foo.shift());
            }
            if (foo.length === 0) {
                clearInterval(this.interval);
                delete this.interval;
            }
        }, 10);
    };
}
