import * as React from "react";
import { ChartCanvas, Chart } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { discontinuousTimeScaleProviderBuilder } from "@reincharts/scales";
import { withOHLCData } from "@/data";

interface ChartProps {
    readonly data: any[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

class MinimalLine extends React.Component<ChartProps> {
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor((d: any) => d.date);

    public render() {
        const { data: initialData, height, width, ratio } = this.props;
        const { data, xScale, xAccessor, displayXAccessor } = this.xScaleProvider(initialData);
        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max];

        return (
            <ChartCanvas
                width={width}
                height={height}
                ratio={ratio}
                data={data}
                displayXAccessor={displayXAccessor}
                xScale={xScale}
                xAccessor={xAccessor}
                xExtents={xExtents}
                margin={{ left: 50, right: 48, top: 10, bottom: 24 }}
                seriesName="MSFT"
            >
                <Chart id={1} yExtents={(d: any) => d.close}>
                    <LineSeries yAccessor={(d: any) => d.close} strokeStyle="#4f46e5" />
                    <XAxis />
                    <YAxis />
                </Chart>
            </ChartCanvas>
        );
    }
}

export default withOHLCData()(MinimalLine);
