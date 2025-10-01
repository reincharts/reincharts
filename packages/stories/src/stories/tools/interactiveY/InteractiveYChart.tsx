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
    MouseCoordinateXV2,
    MouseCoordinateY,
    withDeviceRatio,
    withSize,
    discontinuousTimeScaleProvider,
    OHLCTooltip,
    macd,
    InteractiveYCoordinate,
    InteractiveYCoordinateProps,
    InteractiveObjectSelector,
    last,
    toObject,
} from "reincharts";
import { IOHLCData, withOHLCData } from "@/data";

import { saveInteractiveNodes, getInteractiveNodes } from "../interactiveutils";

interface ChartProps extends Partial<InteractiveYCoordinateProps> {
    readonly data: IOHLCData[];
    readonly enabled: boolean;
    readonly disableInStory: () => void;
    readonly height: number;
    readonly ratio: number;
    readonly width: number;
}

interface ChartState {
    readonly yCoordinateList_1: any[];
    readonly yCoordinateList_3: any[];
}

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

const sell = {
    ...InteractiveYCoordinate.defaultProps.defaultPriceCoordinate,
    stroke: "#E3342F",
    textFill: "#E3342F",
    text: "Sell 320",
    edge: {
        ...InteractiveYCoordinate.defaultProps.defaultPriceCoordinate.edge,
        stroke: "#E3342F",
    },
};
const buy = {
    ...InteractiveYCoordinate.defaultProps.defaultPriceCoordinate,
    stroke: "#1F9D55",
    textFill: "#1F9D55",
    text: "Buy 120",
    edge: {
        ...InteractiveYCoordinate.defaultProps.defaultPriceCoordinate.edge,
        stroke: "#1F9D55",
    },
};

class CandleStickChartWithInteractiveYCoordinate extends React.Component<ChartProps, ChartState> {
    public canvasNode: any;
    private saveInteractiveNodes: any;
    private getInteractiveNodes: any;

    public constructor(props: ChartProps) {
        super(props);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onComplete = this.onComplete.bind(this);
        this.handleSelection = this.handleSelection.bind(this);
        this.saveCanvasNode = this.saveCanvasNode.bind(this);
        this.saveInteractiveNodes = saveInteractiveNodes.bind(this);
        this.getInteractiveNodes = getInteractiveNodes.bind(this);

        this.state = {
            yCoordinateList_1: [
                {
                    ...InteractiveYCoordinate.defaultProps.defaultPriceCoordinate,
                    yValue: 55.9,
                    id: Math.random().toString(36).substring(2, 10),
                    strokeDasharray: "Dot",
                    draggable: true,
                },
                {
                    ...buy,
                    yValue: 50.9,
                    id: Math.random().toString(36).substring(2, 10),
                    draggable: false,
                },
                {
                    ...sell,
                    yValue: 58.9,
                    id: Math.random().toString(36).substring(2, 10),
                    draggable: false,
                },
            ],
            yCoordinateList_3: [],
        };
    }
    public saveCanvasNode(node: any) {
        this.canvasNode = node;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public handleSelection(e: any, interactives: any, moreProps: any) {
        const state = toObject(interactives, (each: any) => {
            return [`yCoordinateList_${each.chartId}`, each.objects];
        });
        this.setState(state);
    }
    public onComplete(e: any, newYCoordList: any, moreProps: any) {
        const { id: chartId } = moreProps.chartConfig;
        const key = `yCoordinateList_${chartId}`;
        this.setState((prev) => ({
            ...prev,
            [key]: newYCoordList,
        }));
        this.props.disableInStory();
    }
    public onKeyPress(e: any) {
        switch (e.which) {
            case 8: // Backspace
            case 46: {
                // DEL
                const yCoordinateList_1 = this.state.yCoordinateList_1.filter((each: any) => !each.selected);
                const yCoordinateList_3 = this.state.yCoordinateList_3.filter((each: any) => !each.selected);

                this.canvasNode.cancelDrag();
                this.setState({
                    yCoordinateList_1,
                    yCoordinateList_3,
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

        const { data: initialData, width, ratio, enabled, ...interactiveYProps } = this.props;

        const calculatedData = macdCalculator(initialData);
        const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor((d: any) => d.date);

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

        const start = xAccessor(last(data));
        const end = xAccessor(data[Math.max(0, data.length - 150)]);
        const xExtents = [start, end];

        return (
            <div style={{ position: "relative" }}>
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
                    <Chart id={1} height={400} yExtents={(d: any) => [d.high, d.low]} padding={{ top: 10, bottom: 20 }}>
                        <XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
                        <YAxis axisAt="right" orient="right" ticks={5} />
                        <MouseCoordinateY at="right" orient="right" displayFormat={format(".2f")} />

                        <CandlestickSeries />

                        <EdgeIndicator
                            itemType="last"
                            orient="right"
                            edgeAt="right"
                            yAccessor={(d: any) => d.close}
                            fill={(d: any) => (d.close > d.open ? "#6BA583" : "#FF0000")}
                        />

                        <OHLCTooltip origin={[-40, 0]} />

                        <InteractiveYCoordinate
                            ref={this.saveInteractiveNodes("InteractiveYCoordinate", 1)}
                            enabled={enabled}
                            onComplete={this.onComplete}
                            yCoordinateList={this.state.yCoordinateList_1}
                            {...interactiveYProps}
                        />
                    </Chart>
                    <Chart
                        id={2}
                        height={150}
                        yExtents={(d: any) => d.volume}
                        origin={(w: any, h: any) => [0, h - 300]}
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
                        origin={(w: any, h: any) => [0, h - 150]}
                        padding={{ top: 10, bottom: 10 }}
                    >
                        <XAxis axisAt="bottom" orient="bottom" />
                        <YAxis axisAt="right" orient="right" ticks={2} />

                        <MouseCoordinateXV2
                            at="bottom"
                            orient="bottom"
                            displayFormat={(value: number) => timeFormat("%Y-%m-%d")(new Date(value))}
                        />
                        <MouseCoordinateY at="right" orient="right" displayFormat={format(".2f")} />

                        <MACDSeries yAccessor={(d: any) => d.macd} {...macdAppearance} />
                        <InteractiveYCoordinate
                            ref={this.saveInteractiveNodes("InteractiveYCoordinate", 3)}
                            enabled={enabled}
                            onComplete={this.onComplete}
                            yCoordinateList={this.state.yCoordinateList_3}
                            {...interactiveYProps}
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
    withSize({ style: { minHeight: 600 } })(withDeviceRatio()(CandleStickChartWithInteractiveYCoordinate)),
);
