"use client";
import * as React from "react";
import { ChartCanvas, Chart } from "@reincharts/core";
import { discontinuousTimeScaleProviderBuilder } from "@reincharts/scales";
import { CandlestickSeries, BarSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { CrossHairCursor, MouseCoordinateX, MouseCoordinateY } from "@reincharts/coordinates";
import { OHLCTooltip } from "@reincharts/tooltip";
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

class Step6_MultiPanel extends React.Component<ChartProps> {
    private readonly margin = { left: 25, right: 75, top: 10, bottom: 30 };
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor((d: any) => d.date);

    public render() {
        const { data: initialData, height, width, ratio } = this.props;
        const { data, xScale, xAccessor, displayXAccessor } = this.xScaleProvider(initialData);
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
                    <XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
                    <YAxis axisAt="right" orient="right" ticks={5} />
                    <MouseCoordinateX displayFormat={timeFormat("%Y-%m-%d")} />
                    <MouseCoordinateY rectWidth={this.margin.right} displayFormat={format(".2f")} />
                    <OHLCTooltip origin={[8, 16]} />
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

export default withOHLCData()(withSize({ style: { minHeight: 450 } })(withDeviceRatio()(Step6_MultiPanel)));
