import React from "react";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import {
    ChartCanvas,
    Chart,
    CandlestickSeries,
    XAxis,
    YAxis,
    CrossHairCursor,
    EdgeIndicator,
    MouseCoordinateX,
    MouseCoordinateY,
    withDeviceRatio,
    withSize,
    discontinuousTimeScaleProvider,
    OHLCTooltip,
    ZoomButtons,
    ZoomButtonsProps,
    last,
} from "reincharts";
import { withOHLCData, IOHLCData } from "@/data";

interface ChartProps extends Partial<ZoomButtonsProps> {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly ratio: number;
    readonly width: number;
}

interface ChartState {
    readonly suffix: number;
}

class CandleStickChartWithZoomButtons extends React.Component<ChartProps, ChartState> {
    private canvasNode: any;

    public constructor(props: ChartProps) {
        super(props);
        this.saveCanvasNode = this.saveCanvasNode.bind(this);
        this.handleReset = this.handleReset.bind(this);

        this.state = {
            suffix: 1,
        };
    }

    public saveCanvasNode(node: any) {
        this.canvasNode = node;
    }

    public handleReset() {
        this.setState((prevState) => ({
            suffix: prevState.suffix + 1,
        }));
    }

    public render() {
        const { data: initialData, width, ratio, ...zoomButtonsProps } = this.props;

        const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor((d: any) => d.date);
        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData);

        const start = xAccessor(last(data));
        const end = xAccessor(data[Math.max(0, data.length - 150)]);
        const xExtents = [start, end];

        return (
            <ChartCanvas
                ref={this.saveCanvasNode}
                height={600}
                width={width}
                ratio={ratio}
                margin={{ left: 70, right: 70, top: 20, bottom: 30 }}
                seriesName={`MSFT_${this.state.suffix}`}
                data={data}
                xScale={xScale}
                xAccessor={xAccessor}
                displayXAccessor={displayXAccessor}
                xExtents={xExtents}
            >
                <Chart id={1} yExtents={(d: any) => [d.high, d.low]} padding={{ top: 10, bottom: 20 }}>
                    <YAxis axisAt="right" orient="right" ticks={5} />
                    <XAxis axisAt="bottom" orient="bottom" />

                    <MouseCoordinateY at="right" orient="right" displayFormat={format(".2f")} />
                    <MouseCoordinateX at="bottom" orient="bottom" displayFormat={timeFormat("%Y-%m-%d")} />
                    <CandlestickSeries />

                    <EdgeIndicator
                        itemType="last"
                        orient="right"
                        edgeAt="right"
                        yAccessor={(d: any) => d.close}
                        fill={(d: any) => (d.close > d.open ? "#6BA583" : "#FF0000")}
                    />

                    <OHLCTooltip origin={[-40, 0]} />

                    <ZoomButtons {...zoomButtonsProps} onReset={this.handleReset} />
                </Chart>
                <CrossHairCursor />
            </ChartCanvas>
        );
    }
}

export default withOHLCData()(
    withSize({ style: { minHeight: 600 } })(withDeviceRatio()(CandleStickChartWithZoomButtons)),
);
