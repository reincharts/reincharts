import React from "react";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import {
    ChartCanvas,
    Chart,
    BarSeries,
    CandlestickSeries,
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
    OHLCTooltip,
    TrendLine,
    TrendLineProps,
    InteractiveObjectSelector,
    last,
    toObject,
} from "reincharts";
import { IOHLCData, withOHLCData } from "@/data";

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

interface ChartProps extends Partial<TrendLineProps> {
    readonly data: IOHLCData[];
    readonly width: number;
    readonly height: number;
    readonly ratio: number;
    readonly enabled: boolean;
    readonly disableInStory: () => void;
}

interface ChartState {
    trends_1: any[];
    trends_3: any[];
}

class CandlestickChartWithTrendLine extends React.Component<ChartProps, ChartState> {
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
            trends_1: [{ start: [1606, 56], end: [1711, 53], appearance: { strokeStyle: "green" }, type: "XLINE" }],
            trends_3: [],
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
            return [`trends_${each.chartId}`, each.objects];
        });
        this.setState(state);
    }
    public onComplete(e: any, newTrends: any, moreProps: any) {
        const { id: chartId } = moreProps.chartConfig;
        const key = `trends_${chartId}`;
        this.setState((prev) => ({
            ...prev,
            [key]: newTrends,
        }));
        this.props.disableInStory();
    }
    public onKeyPress(e: any) {
        switch (e.which) {
            case 8: // Backspace
            case 46: {
                // DEL
                const trends_1 = this.state.trends_1.filter((each: any) => !each.selected);
                const trends_3 = this.state.trends_3.filter((each) => !each.selected);

                this.canvasNode.cancelDrag();
                this.setState({
                    trends_1,
                    trends_3,
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
        const { data: initialData, width, ratio, ...trendlineProps } = this.props;
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

        const calculatedData = macdCalculator(ema12(ema26(initialData)));
        const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor((d: any) => d.date);
        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

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
                    <XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
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
                    <TrendLine
                        ref={this.saveInteractiveNodes("TrendLine", 1)}
                        onComplete={this.onComplete}
                        trends={this.state.trends_1}
                        {...trendlineProps}
                    />
                </Chart>
                <Chart id={2} height={150} yExtents={(d: any) => d.volume} origin={(w, h) => [0, h - 300]}>
                    <YAxis axisAt="left" orient="left" ticks={5} tickFormat={format(".2s")} />

                    <MouseCoordinateY at="left" orient="left" displayFormat={format(".4s")} />

                    <BarSeries
                        yAccessor={(d) => d.volume}
                        strokeStyle={(d) => (d.close > d.open ? "#6BA583" : "#FF0000")}
                        fillStyle={(d) => (d.close > d.open ? "rgba(107, 165, 131, .5)" : "rgba(255, 0, 0, .5)")}
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
                    <MACDTooltip
                        origin={[-38, 15]}
                        yAccessor={(d) => d.macd}
                        options={macdCalculator.options()}
                        appearance={macdAppearance}
                    />
                    <TrendLine
                        ref={this.saveInteractiveNodes("TrendLine", 3)}
                        onComplete={this.onComplete}
                        trends={this.state.trends_3}
                        {...trendlineProps}
                    />
                </Chart>
                <CrossHairCursor />
                <InteractiveObjectSelector
                    enabled
                    getInteractiveNodes={this.getInteractiveNodes}
                    onSelect={this.handleSelection}
                />
            </ChartCanvas>
        );
    }
}

export default withOHLCData()(
    withSize({ style: { minHeight: 600 } })(withDeviceRatio()(CandlestickChartWithTrendLine)),
);
