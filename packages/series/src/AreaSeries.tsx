import { strokeDashTypes } from "@reincharts/core";
import { ScaleContinuousNumeric } from "d3-scale";
import { CurveFactory } from "d3-shape";
import { Component } from "react";
import { AreaOnlySeries } from "./AreaOnlySeries";
import { LineSeries } from "./LineSeries";

export interface AreaSeriesProps {
    /**
     * The base y value to draw the area to.
     */
    readonly baseAt?:
        | number
        | ((yScale: ScaleContinuousNumeric<number, number>, d: [number, number], moreProps: any) => number);
    readonly canvasClip?: (context: CanvasRenderingContext2D, moreProps: any) => void;
    /**
     * Whether to connect the area between undefined data points.
     */
    readonly connectNulls?: boolean;
    /**
     * Fill color for the area under the line.
     */
    readonly fillStyle?:
        | string
        | ((context: CanvasRenderingContext2D, moreProps: any) => string | CanvasGradient | CanvasPattern);
    /**
     * A factory for a curve generator for the area and line.
     */
    readonly curve?: CurveFactory;
    /**
     * Color of the area series line.
     */
    readonly strokeStyle?: string;
    /**
     * Stroke dash type for the area series line.
     */
    readonly strokeDasharray?: strokeDashTypes;
    /**
     * Stroke width for the area series line.
     */
    readonly strokeWidth?: number;
    /**
     * Selector for data to plot.
     */
    readonly yAccessor: (data: any) => number | undefined;
}

/**
 * `AreaSeries` component is similar to a `LineSeries` but with the area between the line and base filled.
 */
export class AreaSeries extends Component<AreaSeriesProps> {
    public static defaultProps: Partial<AreaSeriesProps> = {
        fillStyle: "rgba(33, 150, 243, 0.1)",
        strokeStyle: "#2196f3",
        strokeWidth: 3,
        strokeDasharray: "Solid",
    };

    public render() {
        const {
            baseAt,
            connectNulls,
            strokeStyle,
            strokeWidth,
            strokeDasharray,
            fillStyle,
            curve,
            canvasClip,
            yAccessor,
        } = this.props;

        return (
            <g>
                <AreaOnlySeries
                    connectNulls={connectNulls}
                    yAccessor={yAccessor}
                    curve={curve}
                    base={baseAt}
                    fillStyle={fillStyle}
                    canvasClip={canvasClip}
                />
                <LineSeries
                    connectNulls={connectNulls}
                    yAccessor={yAccessor}
                    strokeStyle={strokeStyle}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    curve={curve}
                    canvasClip={canvasClip}
                    highlightOnHover={false}
                />
            </g>
        );
    }
}
