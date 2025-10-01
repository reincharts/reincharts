import React from "react";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import {
    ChartCanvas,
    Chart,
    CandlestickSeries,
    BarSeries,
    MACDSeries,
    XAxis,
    YAxis,
    CrossHairCursor,
    EdgeIndicator,
    MouseCoordinateY,
    MouseCoordinateX,
    withDeviceRatio,
    withSize,
    discontinuousTimeScaleProvider,
    OHLCTooltip,
    MACDTooltip,
    macd,
    last,
    toObject,
    Drawing,
    DrawingProps,
    InteractiveObjectSelector,
} from "reincharts";
import { saveInteractiveNodes, getInteractiveNodes } from "../interactiveutils";
import { IOHLCData, withOHLCData } from "@/data";

const macdAppearance = {
    strokeStyle: {
        macd: "#FF0000",
        signal: "#00F300",
        zero: "#000000", // Add missing zero property
    },
    fillStyle: {
        divergence: "#4682B4",
    },
};

interface ChartProps extends Partial<DrawingProps> {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
    readonly enabled: boolean;
    readonly disableInStory: () => void;
}

interface ChartState {
    drawingList_1: any[];
    drawingList_3: any[];
}

class CandleStickChartWithDrawing extends React.Component<ChartProps, ChartState> {
    private saveInteractiveNodes: (type: string, chartId: number) => (node: any) => void;
    private getInteractiveNodes: () => any;
    private canvasNode: any;

    public constructor(props: ChartProps) {
        super(props);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.handleSelection = this.handleSelection.bind(this);
        this.onComplete = this.onComplete.bind(this);
        this.saveInteractiveNodes = saveInteractiveNodes.bind(this);
        this.getInteractiveNodes = getInteractiveNodes.bind(this);
        this.saveCanvasNode = this.saveCanvasNode.bind(this);
        this.state = {
            drawingList_1: [],
            drawingList_3: [],
        };
    }
    public onComplete(e: any, newDraw: any, moreProps: any) {
        const { id: chartId } = moreProps.chartConfig;
        const key = `drawingList_${chartId}`;
        this.setState((prev) => ({
            ...prev,
            [key]: newDraw,
        }));
        this.props.disableInStory();
    }

    public saveCanvasNode(node: any) {
        this.canvasNode = node;
    }
    public handleSelection(e: any, interactives: any) {
        const state = toObject(interactives, (each) => {
            return [`drawingList_${each.chartId}`, each.objects];
        });
        this.setState(state);
    }
    public onKeyPress(e: any) {
        switch (e.which) {
            case 8: // Backspace
            case 46: {
                // DEL
                const drawingList_1 = this.state.drawingList_1.filter((each: any) => !each.selected);
                const drawingList_3 = this.state.drawingList_3.filter((each) => !each.selected);

                this.canvasNode.cancelDrag();
                this.setState({
                    drawingList_1,
                    drawingList_3,
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

    public componentDidMount() {
        document.addEventListener("keyup", this.onKeyPress);
    }
    public componentWillUnmount() {
        document.removeEventListener("keyup", this.onKeyPress);
    }

    public render() {
        const { data: initialData, width, ratio, ...drawingProps } = this.props;
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

        const calculatedData = macdCalculator(initialData);
        const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor((d) => d.date);
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
                        yExtents={(d: IOHLCData) => [d.high, d.low]}
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
                        <EdgeIndicator
                            itemType="last"
                            orient="right"
                            edgeAt="right"
                            yAccessor={(d) => d.close}
                            fill={(d) => (d.close > d.open ? "#6BA583" : "#FF0000")}
                        />
                        <OHLCTooltip origin={[-40, 0]} />
                        <Drawing
                            ref={this.saveInteractiveNodes("Drawing", 1)}
                            onComplete={this.onComplete}
                            drawings={this.state.drawingList_1}
                            {...drawingProps}
                        />
                    </Chart>
                    <Chart
                        id={2}
                        height={150}
                        yExtents={(d: IOHLCData) => d.volume}
                        origin={(w: number, h: number) => [0, h - 300]}
                    >
                        <YAxis axisAt="left" orient="left" ticks={5} tickFormat={format(".2s")} />
                        <MouseCoordinateY at="left" orient="left" displayFormat={format(".4s")} />
                        <BarSeries
                            yAccessor={(d: any) => d.volume}
                            strokeStyle={(d: any) => (d.close > d.open ? "#6BA583" : "#FF0000")}
                            fillStyle={(d: any) =>
                                d.close > d.open ? "rgba(107, 165, 131, .5)" : "rgba(255, 0, 0, .5)"
                            }
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
                        <MACDSeries yAccessor={(d: any) => d.macd} {...macdAppearance} />
                        <MACDTooltip
                            origin={[-38, 15]}
                            yAccessor={(d: any) => d.macd}
                            options={macdCalculator.options()}
                            appearance={macdAppearance}
                        />
                        <Drawing
                            ref={this.saveInteractiveNodes("Drawing", 3)}
                            onComplete={this.onComplete}
                            drawings={this.state.drawingList_3}
                            {...drawingProps}
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

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(CandleStickChartWithDrawing)));
