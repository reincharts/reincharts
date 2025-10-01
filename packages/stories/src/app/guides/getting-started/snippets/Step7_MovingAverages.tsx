"use client";
import * as React from "react";
import { ChartCanvas, Chart } from "@reincharts/core";
import { discontinuousTimeScaleProviderBuilder } from "@reincharts/scales";
import { CandlestickSeries, BarSeries, LineSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { CrossHairCursor, MouseCoordinateX, MouseCoordinateY } from "@reincharts/coordinates";
import { OHLCTooltip, MovingAverageTooltip } from "@reincharts/tooltip";
import { ema } from "@reincharts/indicators";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { withOHLCData } from "@/data";
import { withSize, withDeviceRatio } from "@reincharts/utils";

interface ChartProps {
    readonly data: any[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

class Step7_MovingAverages extends React.Component<ChartProps> {
    private readonly margin = { left: 25, right: 75, top: 10, bottom: 30 };
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor((d: any) => d.date);

    public render() {
        const { data: initialData, height, width, ratio } = this.props;

        // Calculate moving averages
        const ema12 = ema()
            .id(1)
            .options({ windowSize: 12 })
            .merge((d: any, c: any) => {
                d.ema12 = c;
            })
            .accessor((d: any) => d.ema12);

        const ema26 = ema()
            .id(2)
            .options({ windowSize: 26 })
            .merge((d: any, c: any) => {
                d.ema26 = c;
            })
            .accessor((d: any) => d.ema26);

        const calculatedData = ema26(ema12(initialData));
        const { data, xScale, xAccessor, displayXAccessor } = this.xScaleProvider(calculatedData);
        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max];

        const priceChartHeight = 300;
        const volumeChartHeight = 100;

        return (
            <ChartCanvas
                height={height}
                width={width}
                ratio={ratio}
                margin={this.margin}
                data={data}
                seriesName="MSFT"
                xScale={xScale}
                xAccessor={xAccessor}
                displayXAccessor={displayXAccessor}
                xExtents={xExtents}
            >
                {/* Price Chart */}
                <Chart id={1} height={priceChartHeight} origin={[0, 0]} yExtents={(d: any) => [d.high, d.low]}>
                    <CandlestickSeries />
                    <LineSeries yAccessor={ema12.accessor()} strokeStyle="#1f77b4" strokeWidth={1} />
                    <LineSeries yAccessor={ema26.accessor()} strokeStyle="#ff7f0e" strokeWidth={1} />
                    <XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
                    <YAxis axisAt="right" orient="right" ticks={5} />
                    <MouseCoordinateX displayFormat={timeFormat("%Y-%m-%d")} />
                    <MouseCoordinateY rectWidth={this.margin.right} displayFormat={format(".2f")} />
                    <OHLCTooltip origin={[8, 16]} />
                    <MovingAverageTooltip
                        origin={[8, 48]}
                        options={[
                            {
                                yAccessor: ema12.accessor(),
                                type: "EMA",
                                stroke: "#1f77b4",
                                windowSize: ema12.options().windowSize,
                            },
                            {
                                yAccessor: ema26.accessor(),
                                type: "EMA",
                                stroke: "#ff7f0e",
                                windowSize: ema26.options().windowSize,
                            },
                        ]}
                    />
                </Chart>

                {/* Volume Chart */}
                <Chart
                    id={2}
                    height={volumeChartHeight}
                    origin={[0, priceChartHeight + 10]}
                    yExtents={(d: any) => d.volume}
                >
                    <BarSeries
                        yAccessor={(d: any) => d.volume}
                        fillStyle={(d: any) => (d.close > d.open ? "#26a69a" : "#ef5350")}
                    />
                    <XAxis axisAt="bottom" orient="bottom" ticks={6} />
                    <YAxis axisAt="right" orient="right" ticks={3} />
                </Chart>
                <CrossHairCursor />
            </ChartCanvas>
        );
    }
}

export default withOHLCData()(withSize({ style: { minHeight: 450 } })(withDeviceRatio()(Step7_MovingAverages)));
