import { strokeDashTypes } from "@reincharts/core";
import * as React from "react";
import { OverlayBarSeries } from "./OverlayBarSeries";
import { StraightLine } from "./StraightLine";

export interface ElderRaySeriesProps {
    /** Fill colors for bear power and bull power bars. */
    readonly fillStyle?: {
        bearPower: string;
        bullPower: string;
    };
    /** CSS class name for the series. */
    readonly className?: string;
    /** Whether to clip the series to chart area. */
    readonly clip?: boolean;
    /** Stroke style for the bars, can be static or function based on data and y value. */
    readonly strokeStyle?: string;
    /** Stroke color for the zero line. */
    readonly straightLineStrokeStyle?: string;
    /** Dash style for the zero line. */
    readonly straightLineStrokeDasharray?: strokeDashTypes;
    /** Ratio of bar width to available space. */
    readonly widthRatio?: number;
    /** Data accessor function for Elder Ray values (bear power and bull power). */
    readonly yAccessor: (data: any) => { bearPower: number; bullPower: number };
}

/**
 * This indicator consists of three separate indicators
 * known as "bull power" and "bear power", which are derived from a 13-period
 * exponential moving average (EMA). The three indicator help traders determine
 * the trend direction and isolate spots to enter and exit trades.
 */
export class ElderRaySeries extends React.Component<ElderRaySeriesProps> {
    public static defaultProps = {
        fillStyle: {
            bearPower: "rgba(239, 83, 80, 0.7)",
            bullPower: "rgba(38, 166, 153, 0.7)",
        },
        clip: true,
        strokeStyle: "rgba(0, 0, 0, 0.3)",
        straightLineStrokeStyle: "rgba(0, 0, 0, 0.7)",
        straightLineStrokeDasharray: "Dash",
        widthRatio: 0.8,
    };

    public render() {
        const { className, clip, strokeStyle, straightLineStrokeStyle, straightLineStrokeDasharray, widthRatio } =
            this.props;

        return (
            <g className={className}>
                <OverlayBarSeries
                    baseAt={this.yAccessorForBarBase}
                    strokeStyle={strokeStyle}
                    fillStyle={this.fillForEachBar}
                    widthRatio={widthRatio}
                    clip={clip}
                    yAccessor={[
                        this.yAccessorBullTop,
                        this.yAccessorBearTop,
                        this.yAccessorBullBottom,
                        this.yAccessorBearBottom,
                    ]}
                />
                <StraightLine yValue={0} strokeStyle={straightLineStrokeStyle} lineDash={straightLineStrokeDasharray} />
            </g>
        );
    }

    private readonly yAccessorBullTop = (d: any) => {
        const { yAccessor } = this.props;
        return yAccessor(d) && (yAccessor(d).bullPower > 0 ? yAccessor(d).bullPower : undefined);
    };

    private readonly yAccessorBearTop = (d: any) => {
        const { yAccessor } = this.props;
        return yAccessor(d) && (yAccessor(d).bearPower > 0 ? yAccessor(d).bearPower : undefined);
    };

    private readonly yAccessorBullBottom = (d: any) => {
        const { yAccessor } = this.props;
        return yAccessor(d) && (yAccessor(d).bullPower < 0 ? 0 : undefined);
    };

    private readonly yAccessorBearBottom = (d: any) => {
        const { yAccessor } = this.props;
        return (
            yAccessor(d) &&
            (yAccessor(d).bullPower < 0 || yAccessor(d).bullPower * yAccessor(d).bearPower < 0 // bullPower is +ve and bearPower is -ve
                ? Math.min(0, yAccessor(d).bullPower)
                : undefined)
        );
    };

    private readonly yAccessorForBarBase = (_: any, yScale: any, d: any) => {
        const { yAccessor } = this.props;
        const y = yAccessor(d) && Math.min(yAccessor(d).bearPower, 0);
        return yScale(y);
    };

    private readonly fillForEachBar = (_: any, yAccessorNumber: number) => {
        const { fillStyle } = this.props;
        return yAccessorNumber % 2 === 0 ? fillStyle!.bullPower : fillStyle!.bearPower;
    };
}
