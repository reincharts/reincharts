import * as React from "react";
import { Chart, ChartCanvas } from "@reincharts/core";
import { XAxis, YAxis } from "@reincharts/axes";
import { sar } from "@reincharts/indicators";
import { discontinuousTimeScaleProviderBuilder } from "@reincharts/scales";
import { SARSeries } from "@reincharts/series";
import { SingleValueTooltip } from "@reincharts/tooltip";
import { IOHLCData, withOHLCData } from "@/data";
import { withDeviceRatio, withSize } from "@reincharts/utils";

interface ChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

class SARIndicator extends React.Component<ChartProps> {
    private readonly accelerationFactor = 0.02;
    private readonly maxAccelerationFactor = 0.2;
    private readonly margin = { left: 0, right: 40, top: 8, bottom: 24 };

    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => d.date,
    );

    private readonly sarCalculator = sar()
        .options({
            accelerationFactor: this.accelerationFactor,
            maxAccelerationFactor: this.maxAccelerationFactor,
        })
        .merge((d: any, c: any) => {
            d.sar = c;
        })
        .accessor((d: any) => d.sar);

    public render() {
        const { data: initialData, height, ratio, width, ...sarProps } = this.props;

        const calculatedData = this.sarCalculator(initialData);

        const { data, xScale, xAccessor, displayXAccessor } = this.xScaleProvider(calculatedData);

        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max];

        const yAccessor = this.sarCalculator.accessor();

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
                <Chart id={1} yExtents={yAccessor}>
                    <XAxis />
                    <YAxis />

                    <SARSeries yAccessor={yAccessor} {...sarProps} />

                    <SingleValueTooltip
                        yLabel={`SAR (${this.accelerationFactor}, ${this.maxAccelerationFactor})`}
                        yAccessor={yAccessor}
                        origin={[8, 8]}
                    />
                </Chart>
            </ChartCanvas>
        );
    }
}

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(SARIndicator)));
