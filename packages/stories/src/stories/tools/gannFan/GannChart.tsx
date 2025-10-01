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
    GannFan,
    GannFanProps,
    InteractiveObjectSelector,
    last,
    toObject,
} from "reincharts";
import { withOHLCData, IOHLCData } from "@/data";
import { saveInteractiveNodes, getInteractiveNodes } from "../interactiveutils";

interface ChartProps extends Partial<GannFanProps> {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly ratio: number;
    readonly width: number;
    readonly enabled: boolean;
    readonly disableInStory: () => void;
}

interface ChartState {
    readonly fans_1: any[];
}

class CandleStickChartWithGannFan extends React.Component<ChartProps, ChartState> {
    private canvasNode: any;
    private saveInteractiveNodes: any;
    private getInteractiveNodes: any;

    public constructor(props: ChartProps) {
        super(props);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onComplete = this.onComplete.bind(this);
        this.saveCanvasNode = this.saveCanvasNode.bind(this);

        this.handleSelection = this.handleSelection.bind(this);

        this.saveInteractiveNodes = saveInteractiveNodes.bind(this);
        this.getInteractiveNodes = getInteractiveNodes.bind(this);

        this.state = {
            fans_1: [],
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
            return [`fans_${each.chartId}`, each.objects];
        });
        this.setState(state);
    }
    public onComplete(e: any, fans: any, moreProps: any) {
        const { id: chartId } = moreProps.chartConfig;
        const key = `fans_${chartId}`;
        this.setState((prev) => ({
            ...prev,
            [key]: fans,
        }));
        this.props.disableInStory();
    }
    public onKeyPress(e: any) {
        switch (e.which) {
            case 8: // Backspace
            case 46: {
                // DEL
                const fans_1 = this.state.fans_1.filter((each: any) => !each.selected);

                this.canvasNode.cancelDrag();
                this.setState({
                    fans_1,
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
        const { data: initialData, width, ratio, ...gannFanProps } = this.props;
        const { fans_1 } = this.state;

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
                seriesName="MSFT"
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

                    <GannFan
                        ref={this.saveInteractiveNodes("GannFan", 1)}
                        onComplete={this.onComplete}
                        fans={fans_1}
                        {...gannFanProps}
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

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(CandleStickChartWithGannFan)));
