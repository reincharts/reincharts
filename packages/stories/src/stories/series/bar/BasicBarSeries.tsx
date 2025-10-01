import * as React from "react";
import { Chart, ChartCanvas } from "@reincharts/core";
import { XAxis, YAxis } from "@reincharts/axes";
import { discontinuousTimeScaleProviderBuilder } from "@reincharts/scales";
import { BarSeries, BarSeriesProps } from "@reincharts/series";
import { IOHLCData, withOHLCData } from "@/data";
import { withDeviceRatio, withSize } from "@reincharts/utils";

interface ChartProps extends Partial<BarSeriesProps> {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
    readonly barWidth?: number;
}

class BasicBarSeries extends React.Component<ChartProps> {
    private readonly margin = { left: 0, right: 90, top: 0, bottom: 24 };
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => d.date,
    );

    public render() {
        const { data: initialData, height, ratio, width, barWidth, ...rest } = this.props;

        const { data, xScale, xAccessor, displayXAccessor } = this.xScaleProvider(initialData);

        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max];

        return (
            <ChartCanvas
                height={height}
                ratio={ratio}
                width={width}
                margin={this.margin}
                data={data}
                displayXAccessor={displayXAccessor}
                seriesName="Data"
                xScale={xScale}
                xAccessor={xAccessor}
                xExtents={xExtents}
            >
                <Chart id={1} yExtents={this.yExtents}>
                    <BarSeries yAccessor={this.yAccessor} width={barWidth} {...rest} />
                    <XAxis />
                    <YAxis />
                </Chart>
            </ChartCanvas>
        );
    }

    private readonly yAccessor = (data: IOHLCData) => {
        return data.volume;
    };

    private readonly yExtents = (data: IOHLCData) => {
        return data.volume;
    };
}

export const Daily = withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(BasicBarSeries)));

export const Intraday = withOHLCData("MINUTES")(
    withSize({ style: { minHeight: 600 } })(withDeviceRatio()(BasicBarSeries)),
);
