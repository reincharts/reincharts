import React from "react";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import {
    ChartCanvas,
    Chart,
    BarSeries,
    AreaSeries,
    CandlestickSeries,
    LineSeries,
    MACDSeries,
    XAxis,
    YAxis,
    CrossHairCursor,
    EdgeIndicator,
    CurrentCoordinate,
    MouseCoordinateX,
    MouseCoordinateY,
    withDeviceRatio,
    withSize,
    discontinuousTimeScaleProvider,
    OHLCTooltip,
    MovingAverageTooltip,
    MACDTooltip,
    ema,
    macd,
    sma,
    FibonacciRetracement,
    FibonacciRetracementProps,
    InteractiveObjectSelector,
    last,
    toObject,
} from "reincharts";
import { withOHLCData, IOHLCData } from "@/data";
import { saveInteractiveNodes, getInteractiveNodes } from "../interactiveutils";

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

interface ChartProps extends Partial<FibonacciRetracementProps> {
    readonly data: IOHLCData[];
    readonly width: number;
    readonly height: number;
    readonly ratio: number;
    readonly enabled: boolean;
    readonly disableInStory: () => void;
}

interface ChartState {
    retracements_1: any[];
    retracements_3: any[];
}

class CandleStickChartWithFibonacciInteractiveIndicator extends React.Component<ChartProps, ChartState> {
    private canvasNode: any;
    private saveInteractiveNodes: (type: string, chartId: number) => (node: any) => void;
    private getInteractiveNodes: () => any;

    public constructor(props: ChartProps) {
        super(props);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onComplete = this.onComplete.bind(this);
        this.handleSelection = this.handleSelection.bind(this);

        this.saveInteractiveNodes = saveInteractiveNodes.bind(this);
        this.getInteractiveNodes = getInteractiveNodes.bind(this);

        this.saveCanvasNode = this.saveCanvasNode.bind(this);
        this.state = {
            retracements_1: [],
            retracements_3: [],
        };
    }
    public saveCanvasNode(node: any) {
        this.canvasNode = node;
    }
    public componentDidMount() {
        document.addEventListener("keyup", this.onKeyPress);
    }
    public componentWillUnmount() {
        document.removeEventListener("keyup", this.onKeyPress);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public handleSelection(e: any, interactives: any, moreProps: any) {
        const state = toObject(interactives, (each: any) => {
            return [`retracements_${each.chartId}`, each.objects];
        });
        this.setState(state);
    }
    public onComplete(e: any, newRetracements: any, moreProps: any) {
        const { id: chartId } = moreProps.chartConfig;
        const key = `retracements_${chartId}`;
        this.setState((prev) => ({
            ...prev,
            [key]: newRetracements,
        }));
        this.props.disableInStory();
    }
    public onKeyPress(e: any) {
        switch (e.which) {
            case 8: // Backspace
            case 46: {
                // DEL
                const retracements_1 = this.state.retracements_1.filter((each: any) => !each.selected);
                const retracements_3 = this.state.retracements_3.filter((each: any) => !each.selected);

                this.canvasNode.cancelDrag();
                this.setState({
                    retracements_1,
                    retracements_3,
                });
                break;
            }
            case 27: {
                // ESC
                this.canvasNode.cancelDrag();
                this.props.disableInStory();
                break;
            }
        }
    }
    public render() {
        const { data: initialData, width, ratio, ...fibProps } = this.props;
        const ema26 = ema()
            .id(0)
            .options({ windowSize: 26 })
            .merge((d: any, c: any) => {
                d.ema26 = c;
            })
            .accessor((d: any) => d.ema26);

        const ema12 = ema()
            .id(1)
            .options({ windowSize: 12 })
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
                windowSize: 50,
                sourcePath: "volume",
            })
            .merge((d: any, c: any) => {
                d.smaVolume50 = c;
            })
            .accessor((d: any) => d.smaVolume50);

        const calculatedData = macdCalculator(smaVolume50(ema12(ema26(initialData))));
        const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor((d: any) => d.date);
        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

        const start = xAccessor(last(data));
        const end = xAccessor(data[Math.max(0, data.length - 150)]);
        const xExtents = [start, end];

        return (
            <div>
                <ChartCanvas
                    ref={this.saveCanvasNode}
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
                        yExtents={[(d: any) => [d.high, d.low], ema26.accessor(), ema12.accessor()]}
                        padding={{ top: 10, bottom: 20 }}
                    >
                        <XAxis
                            axisAt="bottom"
                            orient="bottom"
                            showTicks={false}
                            showTickLabel={false}
                            outerTickSize={0}
                        />
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

                        <FibonacciRetracement
                            ref={this.saveInteractiveNodes("FibonacciRetracement", 1)}
                            retracements={this.state.retracements_1}
                            onComplete={this.onComplete}
                            {...fibProps}
                        />
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
                            yAccessor={(d) => d.volume}
                            strokeStyle={(d) => (d.close > d.open ? "#6BA583" : "#FF0000")}
                            fillStyle={(d) => (d.close > d.open ? "rgba(107, 165, 131, .5)" : "rgba(255, 0, 0, .5)")}
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
                        yExtents={macdCalculator.accessor()}
                        origin={(w, h) => [0, h - 150]}
                        padding={{ top: 10, bottom: 10 }}
                    >
                        <XAxis axisAt="bottom" orient="bottom" />
                        <YAxis axisAt="right" orient="right" ticks={2} />
                        <MouseCoordinateX at="bottom" orient="bottom" displayFormat={timeFormat("%Y-%m-%d")} />
                        <MouseCoordinateY at="right" orient="right" displayFormat={format(".2f")} />

                        <MACDSeries yAccessor={(d) => d.macd} {...macdAppearance} />

                        <FibonacciRetracement
                            ref={this.saveInteractiveNodes("FibonacciRetracement", 3)}
                            retracements={this.state.retracements_3}
                            onComplete={this.onComplete}
                            {...fibProps}
                        />

                        <MACDTooltip
                            origin={[-38, 15]}
                            yAccessor={(d) => d.macd}
                            options={macdCalculator.options()}
                            appearance={macdAppearance}
                        />
                    </Chart>
                    <CrossHairCursor />
                    <InteractiveObjectSelector
                        enabled
                        getInteractiveNodes={this.getInteractiveNodes}
                        onSelect={this.handleSelection}
                    />
                </ChartCanvas>
            </div>
        );
    }
}

export default withOHLCData()(
    withSize({ style: { minHeight: 600 } })(withDeviceRatio()(CandleStickChartWithFibonacciInteractiveIndicator)),
);
