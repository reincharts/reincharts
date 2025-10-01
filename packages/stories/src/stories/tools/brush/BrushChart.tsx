import React from "react";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import {
    ChartCanvas,
    Chart,
    BarSeries,
    CandlestickSeries,
    AreaSeries,
    MACDSeries,
    XAxis,
    YAxis,
    CrossHairCursor,
    EdgeIndicator,
    LineSeries,
    CurrentCoordinate,
    MovingAverageTooltip,
    MouseCoordinateX,
    MouseCoordinateY,
    withDeviceRatio,
    MACDTooltip,
    withSize,
    discontinuousTimeScaleProvider,
    ema,
    macd,
    sma,
    OHLCTooltip,
    Brush,
    BrushProps,
    last,
    isDefined,
} from "reincharts";

import { withOHLCData, IOHLCData } from "@/data";
import { saveInteractiveNode } from "../interactiveutils";

const ema26 = ema()
    .id(0)
    .options({
        windowSize: 26,
    })
    .merge((d: any, c: any) => {
        d.ema26 = c;
    })
    .accessor((d: any) => d.ema26);

const ema12 = ema()
    .id(1)
    .options({
        windowSize: 12,
    })
    .merge((d: any, c: any) => {
        d.ema12 = c;
    })
    .accessor((d: any) => d.ema12);

const macdCalculator = macd()
    .options({
        fast: 12,
        slow: 26,
        signal: 9,
    })
    .merge((d: any, c: any) => {
        d.macd = c;
    })
    .accessor((d: any) => d.macd);

const smaVolume50 = sma()
    .id(3)
    .options({
        windowSize: 10,
        sourcePath: "volume",
    })
    .merge((d: any, c: any) => {
        d.smaVolume50 = c;
    })
    .accessor((d: any) => d.smaVolume50);

const macdAppearance = {
    strokeStyle: {
        macd: "#FF0000",
        signal: "#00F300",
        zero: "#000000",
    },
    fillStyle: {
        divergence: "#4682B4",
    },
};

interface ChartProps extends Partial<BrushProps> {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
    readonly enabled: boolean;
    readonly disableInStory: () => void;
}

interface ChartState {
    data: IOHLCData[];
    xScale: any;
    xAccessor: any;
    displayXAccessor: any;
    xExtents: [any, any];
    yExtents1?: [number, number] | any;
    yExtents3?: [number, number] | any;
}

interface BrushCoords {
    start: { xValue: any; yValue: number };
    end: { xValue: any; yValue: number };
}

class CandlestickChart extends React.Component<ChartProps, ChartState> {
    private saveInteractiveNode: (chartId: number) => (node: any) => void;

    public constructor(props: ChartProps) {
        super(props);
        this.handleBrush1 = this.handleBrush1.bind(this);
        this.handleBrush3 = this.handleBrush3.bind(this);
        this.saveInteractiveNode = saveInteractiveNode.bind(this);

        const { data: initialData } = props;

        const calculatedData = macdCalculator(smaVolume50(ema12(ema26(initialData))));
        const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor((d) => d.date);
        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

        const start = xAccessor(last(data));
        const end = xAccessor(data[Math.max(0, data.length - 150)]);

        this.state = {
            data,
            xScale,
            xAccessor,
            displayXAccessor,
            xExtents: [start, end] as [any, any],
        };
    }
    public handleBrush1(brushCoords: BrushCoords) {
        const { start, end } = brushCoords;
        const left = Math.min(start.xValue, end.xValue);
        const right = Math.max(start.xValue, end.xValue);

        const low = Math.min(start.yValue, end.yValue);
        const high = Math.max(start.yValue, end.yValue);

        // uncomment the line below to make the brush to zoom
        this.setState({
            xExtents: [left, right],
            yExtents1: [low, high],
        });

        this.props.disableInStory();
    }
    public handleBrush3(brushCoords: BrushCoords) {
        const { start, end } = brushCoords;
        const left = Math.min(start.xValue, end.xValue);
        const right = Math.max(start.xValue, end.xValue);

        const low = Math.min(start.yValue, end.yValue);
        const high = Math.max(start.yValue, end.yValue);

        // uncomment the line below to make the brush to zoom
        this.setState({
            xExtents: [left, right],
            yExtents3: [low, high],
        });

        this.props.disableInStory();
    }
    public render() {
        const { width, ratio, ...brushProps } = this.props;
        const { data, xExtents, xScale, xAccessor, displayXAccessor } = this.state;

        const yExtents1 = isDefined(this.state.yExtents1)
            ? this.state.yExtents1
            : [(d: IOHLCData) => [d.high, d.low], ema26.accessor(), ema12.accessor()];

        const yExtents3 = isDefined(this.state.yExtents3) ? this.state.yExtents3 : macdCalculator.accessor();
        return (
            <ChartCanvas
                height={600}
                width={width}
                ratio={ratio}
                margin={{ left: 70, right: 70, top: 20, bottom: 30 }}
                seriesName="MSFT"
                data={data}
                xScale={xScale}
                xAccessor={xAccessor}
                displayXAccessor={displayXAccessor}
                xExtents={xExtents}
            >
                <Chart
                    id={1}
                    height={400}
                    yPanEnabled={isDefined(this.state.yExtents1)}
                    yExtents={yExtents1}
                    padding={{ top: 10, bottom: 20 }}
                >
                    <XAxis axisAt="bottom" orient="bottom" showTicks={false} showTickLabel={false} outerTickSize={0} />
                    <YAxis axisAt="right" orient="right" ticks={5} />

                    <MouseCoordinateY at="right" orient="right" displayFormat={format(".2f")} />

                    <CandlestickSeries />
                    <LineSeries yAccessor={ema26.accessor()} strokeStyle={ema26.stroke()} />
                    <LineSeries yAccessor={ema12.accessor()} strokeStyle={ema12.stroke()} />

                    <CurrentCoordinate yAccessor={ema26.accessor()} fillStyle={ema26.stroke()} />
                    <CurrentCoordinate yAccessor={ema12.accessor()} fillStyle={ema12.stroke()} />

                    <EdgeIndicator
                        itemType="last"
                        orient="right"
                        edgeAt="right"
                        yAccessor={(d) => d.close}
                        fill={(d) => (d.close > d.open ? "#6BA583" : "#FF0000")}
                    />

                    <OHLCTooltip origin={[-40, 0]} />

                    <MovingAverageTooltip
                        onClick={(e) => console.log(e)}
                        origin={[-38, 15]}
                        options={[
                            {
                                yAccessor: ema26.accessor(),
                                type: ema26.type(),
                                stroke: ema26.stroke(),
                                windowSize: ema26.options().windowSize,
                            },
                            {
                                yAccessor: ema12.accessor(),
                                type: ema12.type(),
                                stroke: ema12.stroke(),
                                windowSize: ema12.options().windowSize,
                            },
                        ]}
                    />
                    <Brush ref={this.saveInteractiveNode(1)} onBrush={this.handleBrush1} {...brushProps} />
                </Chart>
                <Chart
                    id={2}
                    height={150}
                    yExtents={[(d: any) => d.volume, smaVolume50.accessor()]}
                    origin={(w, h) => [0, h - 300]}
                >
                    <YAxis axisAt="left" orient="left" ticks={5} tickFormat={format(".2s")} />

                    <MouseCoordinateY at="left" orient="left" displayFormat={format(".4s")} />

                    <BarSeries
                        yAccessor={(d: any) => d.volume}
                        strokeStyle={(d: any) => (d.close > d.open ? "#6BA583" : "#FF0000")}
                        fillStyle={(d: any) => (d.close > d.open ? "rgba(107, 165, 131, .5)" : "rgba(255, 0, 0, .5)")}
                    />
                    <AreaSeries
                        yAccessor={smaVolume50.accessor()}
                        strokeStyle={smaVolume50.stroke()}
                        fillStyle={smaVolume50.fill()}
                    />
                </Chart>
                <Chart
                    id={3}
                    height={150}
                    yExtents={yExtents3}
                    yPanEnabled={isDefined(this.state.yExtents3)}
                    origin={(w, h) => [0, h - 150]}
                    padding={{ top: 10, bottom: 10 }}
                >
                    <XAxis axisAt="bottom" orient="bottom" />
                    <YAxis axisAt="right" orient="right" ticks={2} />
                    <MouseCoordinateX at="bottom" orient="bottom" displayFormat={timeFormat("%Y-%m-%d")} />
                    <MouseCoordinateY at="right" orient="right" displayFormat={format(".2f")} />
                    <Brush ref={this.saveInteractiveNode(3)} onBrush={this.handleBrush3} {...brushProps} />
                    <MACDSeries yAccessor={(d: any) => d.macd} {...macdAppearance} />
                    <MACDTooltip
                        origin={[-38, 15]}
                        yAccessor={(d: any) => d.macd}
                        options={macdCalculator.options()}
                        appearance={macdAppearance}
                    />
                </Chart>
                <CrossHairCursor />
            </ChartCanvas>
        );
    }
}

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(CandlestickChart)));
