import * as React from "react";
import { Chart, ChartCanvas } from "@reincharts/core";
import { XAxis, YAxis } from "@reincharts/axes";
import { rsi } from "@reincharts/indicators";
import { discontinuousTimeScaleProviderBuilder } from "@reincharts/scales";
import { RSISeries } from "@reincharts/series";
import { RSITooltip } from "@reincharts/tooltip";
import { IOHLCData, withOHLCData } from "@/data";
import { withDeviceRatio, withSize } from "@reincharts/utils";

interface ChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

class RSIIndicator extends React.Component<ChartProps> {
    private readonly margin = { left: 0, right: 40, top: 0, bottom: 24 };
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => d.date,
    );

    private readonly rsiCalculator = rsi()
        .options({ windowSize: 14 })
        .merge((d: any, c: any) => {
            d.rsi = c;
        })
        .accessor((d: any) => d.rsi);

    public render() {
        const { data: initialData, height, ratio, width, ...rsiProps } = this.props;

        const calculatedData = this.rsiCalculator(initialData);

        const { data, xScale, xAccessor, displayXAccessor } = this.xScaleProvider(calculatedData);

        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max];

        const yAccessor = this.rsiCalculator.accessor();

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
                <Chart id={1} yExtents={[0, 100]}>
                    <XAxis />
                    <YAxis tickValues={[30, 50, 70]} />

                    <RSISeries yAccessor={yAccessor} {...rsiProps} />

                    <RSITooltip origin={[8, 16]} yAccessor={yAccessor} options={this.rsiCalculator.options()} />
                </Chart>
            </ChartCanvas>
        );
    }
}

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(RSIIndicator)));
