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
    Drawing,
    GannFan,
    InteractiveManager,
    EquidistantChannel,
    FibonacciRetracement,
    StandardDeviationChannel,
    InteractiveText,
    TrendLine,
    InteractiveYCoordinate,
} from "reincharts";
import { withOHLCData, IOHLCData } from "@/data";

interface ChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly ratio: number;
    readonly width: number;
}

interface ChartState {
    readonly interactiveStates: any;
    readonly textboxValue: string;
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

class CandleStickChartWithMenu extends React.Component<ChartProps, ChartState> {
    public constructor(props: ChartProps) {
        super(props);

        this.state = {
            interactiveStates: {},
            textboxValue: "",
        };
    }
    public render() {
        const { data: initialData, width, ratio, height, ...managerProps } = this.props;
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
        const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor((d: any) => d.date);
        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

        const start = xAccessor(last(data));
        const end = xAccessor(data[Math.max(0, data.length - 150)]);
        const xExtents = [start, end];

        const handleInteractiveToggle = (type: any, enabled: any) => {
            console.log(`${type} tool ${enabled ? "enabled" : "disabled"}`);
        };

        return (
            <div>
                <InteractiveManager
                    onInteractiveToggle={handleInteractiveToggle}
                    height={600}
                    width={width}
                    onSave={(data) => {
                        alert("Check console for data");
                        console.log("Save Data: ", data);
                    }}
                    initialStates={this.state.interactiveStates}
                    {...managerProps}
                >
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
                            // 400 is the height I want it to be without the menu bar and 550 is
                            // the chart height with ChartCanvas.margin taken into account and h
                            // is the current height of ChartCanvas
                            height={(h: any) => (400 / 550) * h}
                            yExtents={(d: any) => [d.high, d.low]}
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
                            <Drawing />
                            <GannFan />
                            <FibonacciRetracement />
                            <EquidistantChannel />
                            <StandardDeviationChannel />
                            <InteractiveText />
                            <TrendLine />
                            <InteractiveYCoordinate isDraggable />
                        </Chart>
                        <Chart
                            id={2}
                            // 150 is the height I want it to be without the menu bar and 550 is
                            // the chart height with ChartCanvas.margin taken into account and h
                            // is the current height of ChartCanvas
                            height={(h) => (150 / 550) * h}
                            yExtents={(d) => d.volume}
                            // h is the current height of ChartCanvas and ch is the current height
                            // of this Chart. I want this to be positioned relative to the other
                            // charts and I know that the Chart below has the same "ch" as this
                            origin={(w, h, ch) => [0, h - 2 * ch]}
                        >
                            <YAxis axisAt="left" orient="left" ticks={5} tickFormat={format(".2s")} />
                            <MouseCoordinateY at="left" orient="left" displayFormat={format(".4s")} />
                            <BarSeries
                                yAccessor={(d) => d.volume}
                                strokeStyle={(d) => (d.close > d.open ? "#6BA583" : "#FF0000")}
                                fillStyle={(d) =>
                                    d.close > d.open ? "rgba(107, 165, 131, .5)" : "rgba(255, 0, 0, .5)"
                                }
                            />
                        </Chart>
                        <Chart
                            id={3}
                            // 150 is the height I want it to be without the menu bar and 550 is
                            // the chart height with ChartCanvas.margin taken into account and h
                            // is the current height of ChartCanvas
                            height={(h) => (150 / 550) * h}
                            yExtents={macdCalculator.accessor()}
                            // h is the current height of ChartCanvas and ch is the current height
                            // of this Chart. I want this to be positioned relative to the bottom
                            // of the chart and based on the current height of this Chart
                            origin={(w, h, ch) => [0, h - ch]}
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
                            <Drawing />
                        </Chart>
                        <CrossHairCursor />
                    </ChartCanvas>
                </InteractiveManager>
                {/* Toggle Sidebar Button below the chart, with textbox and set button REMOVE FOR FINAL */}
                <div style={{ marginTop: 16 }}>
                    {/* Textbox and button to set interactiveStates */}
                    <input
                        type="text"
                        placeholder="Set interactiveStates JSON"
                        style={{ padding: "8px", fontSize: "14px", minWidth: "220px" }}
                        value={this.state.textboxValue}
                        onChange={(e) => this.setState({ textboxValue: e.target.value })}
                    />
                    <button
                        style={{
                            backgroundColor: "#ffc107",
                            color: "#333",
                            borderColor: "#ffa000",
                            fontWeight: "bold",
                        }}
                        onClick={() => {
                            try {
                                const parsed = JSON.parse(this.state.textboxValue);
                                if (typeof parsed === "object" && parsed !== null) {
                                    // Ensure that any interactive state maintains proper structure
                                    const validatedStates = Object.keys(parsed).reduce(
                                        (acc, key) => {
                                            if (Array.isArray(parsed[key])) {
                                                acc[key] = parsed[key];
                                            }
                                            return acc;
                                        },
                                        {} as Record<string, Array<any>>,
                                    );
                                    this.setState({ interactiveStates: validatedStates });
                                }
                            } catch (err) {
                                alert("Invalid JSON: " + (err as Error).message);
                            }
                        }}
                    >
                        Set State
                    </button>
                </div>
            </div>
        );
    }
}

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(CandleStickChartWithMenu)));
