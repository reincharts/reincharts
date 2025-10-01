"use client";
import * as React from "react";
import { ChartCanvas, Chart } from "@reincharts/core";
import { discontinuousTimeScaleProviderBuilder } from "@reincharts/scales";
import { LineSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { withOHLCData } from "@/data";
import { withSize, withDeviceRatio } from "@reincharts/utils";

interface ChartProps {
    readonly data: any[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

class Step2_AddAxes extends React.Component<ChartProps> {
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor((d: any) => d.date);

    public render() {
        const { data: initialData, height, width, ratio } = this.props;
        const { data, xScale, xAccessor, displayXAccessor } = this.xScaleProvider(initialData);
        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max];

        return (
            <ChartCanvas
                height={height}
                width={width}
                ratio={ratio}
                margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
                data={data}
                seriesName="MSFT"
                xScale={xScale}
                xAccessor={xAccessor}
                displayXAccessor={displayXAccessor}
                xExtents={xExtents}
            >
                <Chart id={1} yExtents={(d: any) => d.close}>
                    <LineSeries yAccessor={(d: any) => d.close} strokeStyle="#4f46e5" strokeWidth={2} />
                    <XAxis axisAt="bottom" orient="bottom" ticks={6} />
                    <YAxis axisAt="right" orient="right" ticks={5} />
                </Chart>
            </ChartCanvas>
        );
    }
}

export default withOHLCData()(withSize({ style: { minHeight: 300 } })(withDeviceRatio()(Step2_AddAxes)));
