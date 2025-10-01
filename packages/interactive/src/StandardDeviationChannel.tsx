import * as React from "react";
import { flushSync } from "react-dom";
import { isDefined, isNotDefined } from "@reincharts/core";
import { generateID, getValueFromOverride, isHoverForInteractiveType, saveNodeType, terminate } from "./utils";
import { HoverTextNearMouse, MouseLocationIndicator } from "./components";
import { EachLinearRegressionChannel } from "./wrapper";

export interface StandardDeviationChannelProps {
    /** Whether the standard deviation channel drawing is enabled. */
    readonly enabled: boolean;
    /** Function to snap the channel points to specific values in the data. */
    readonly snapTo?: (data: any) => number;
    /** Callback when channel drawing starts. */
    readonly onStart?: () => void;
    /** Callback when channel drawing is completed. newChannels is a
     *  list of all channels with the new/updated channel included.
     */
    readonly onComplete?: (e: React.MouseEvent, newChannels: any, moreProps: any) => void;
    /** Stroke color for the current position indicator. */
    readonly currentPositionStroke?: string;
    /** Stroke width for the current position indicator. */
    readonly currentPositionStrokeWidth?: number;
    /** Opacity of the current position indicator. */
    readonly currentPositionOpacity?: number;
    /** Radius of the current position indicator. */
    readonly currentPositionRadius?: number;
    /** Appearance configuration for the standard deviation channel. */
    readonly appearance: {
        /** Stroke color for the channel lines. */
        readonly stroke?: string;
        /** Stroke width for the channel lines. */
        readonly strokeWidth?: number;
        /** Fill color for the channel area. */
        readonly fill?: string;
        /** Stroke width for the channel edge indicators. */
        readonly edgeStrokeWidth?: number;
        /** Stroke color for the channel edge indicators. */
        readonly edgeStroke?: string;
        /** Fill color for the channel edge indicators. */
        readonly edgeFill?: string;
        /** Radius for the channel edge indicators. */
        readonly r?: number;
    };
    /** Configuration for hover text display. */
    readonly hoverText: object;
    /** Array of standard deviation channels that get drawn. */
    readonly channels: any[];
}

interface StandardDeviationChannelState {
    current?: any;
    override?: any;
}

export class StandardDeviationChannel extends React.Component<
    StandardDeviationChannelProps,
    StandardDeviationChannelState
> {
    public static displayName = "StandardDeviationChannel";

    public static defaultProps = {
        enabled: true,
        snapTo: (d: any) => d.close,
        appearance: {
            stroke: "#000000",
            strokeWidth: 1,
            fill: "rgba(138, 175, 226, 0.3)",
            edgeStrokeWidth: 2,
            edgeStroke: "#000000",
            edgeFill: "#FFFFFF",
            r: 5,
        },
        currentPositionStroke: "#000000",
        currentPositionOpacity: 1,
        currentPositionStrokeWidth: 3,
        currentPositionRadius: 4,
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click and drag the edge circles",
            selectedText: "",
        },
        channels: [],
    };

    // @ts-ignore
    private getSelectionState: any;
    private mouseMoved: any;
    private saveNodeType: any;

    // @ts-ignore
    private terminate: any;

    public constructor(props: StandardDeviationChannelProps) {
        super(props);

        this.terminate = terminate.bind(this);
        this.saveNodeType = saveNodeType.bind(this);
        this.getSelectionState = isHoverForInteractiveType("channels").bind(this);

        this.state = {};
    }

    public render() {
        const {
            appearance,
            channels,
            currentPositionOpacity,
            currentPositionRadius = StandardDeviationChannel.defaultProps.currentPositionRadius,
            currentPositionStroke,
            currentPositionStrokeWidth,
            enabled,
            hoverText,
            snapTo,
        } = this.props;
        const { current, override } = this.state;

        const eachDefaultAppearance = {
            ...StandardDeviationChannel.defaultProps.appearance,
            ...appearance,
        };

        const hoverTextDefault = {
            ...StandardDeviationChannel.defaultProps.hoverText,
            ...hoverText,
        };

        const tempLine =
            isDefined(current) && isDefined(current.end) ? (
                <EachLinearRegressionChannel
                    interactive={false}
                    x1Value={current.start[0]}
                    x2Value={current.end[0]}
                    appearance={eachDefaultAppearance}
                    hoverText={hoverTextDefault}
                />
            ) : null;

        return (
            <g>
                {channels.map((each, idx) => {
                    const eachAppearance = isDefined(each.appearance)
                        ? { ...eachDefaultAppearance, ...each.appearance }
                        : eachDefaultAppearance;

                    const eachHoverText = isDefined(each.hoverText)
                        ? { ...hoverTextDefault, ...each.hoverText }
                        : hoverTextDefault;

                    return (
                        <EachLinearRegressionChannel
                            key={idx}
                            ref={this.saveNodeType(idx)}
                            index={idx}
                            selected={each.selected}
                            x1Value={getValueFromOverride(override, idx, "x1Value", each.start[0])}
                            x2Value={getValueFromOverride(override, idx, "x2Value", each.end[0])}
                            appearance={eachAppearance}
                            snapTo={snapTo}
                            hoverText={eachHoverText}
                            onDrag={this.handleDragLine}
                            onDragComplete={this.handleDragLineComplete}
                            edgeInteractiveCursor="reincharts-move-cursor"
                        />
                    );
                })}
                {tempLine}
                <MouseLocationIndicator
                    enabled={enabled}
                    snap
                    snapTo={snapTo}
                    r={currentPositionRadius}
                    stroke={currentPositionStroke}
                    opacity={currentPositionOpacity}
                    strokeWidth={currentPositionStrokeWidth}
                    onMouseDown={this.handleStart}
                    onClick={this.handleEnd}
                    onMouseMove={this.handleDrawLine}
                />
            </g>
        );
    }

    private handleEnd = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        const { appearance, channels } = this.props;

        if (this.mouseMoved && isDefined(current) && isDefined(current.start)) {
            const newChannels = [
                ...channels.map((d) => ({ ...d, selected: false })),
                {
                    start: current.start,
                    end: xyValue,
                    id: generateID(),
                    selected: true,
                    appearance,
                },
            ];

            this.setState(
                {
                    current: null,
                },
                () => {
                    const { onComplete } = this.props;
                    if (onComplete !== undefined) {
                        onComplete(e, newChannels, moreProps);
                    }
                },
            );
        }
    };

    private readonly handleStart = (_: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;

        if (isNotDefined(current) || isNotDefined(current.start)) {
            this.mouseMoved = false;

            this.setState(
                {
                    current: {
                        start: xyValue,
                        end: null,
                    },
                },
                () => {
                    const { onStart } = this.props;
                    if (onStart !== undefined) {
                        onStart();
                    }
                },
            );
        }
    };

    private readonly handleDrawLine = (e: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;

        if (isDefined(current) && isDefined(current.start)) {
            this.mouseMoved = true;

            flushSync(() => {
                this.setState({
                    current: {
                        start: current.start,
                        end: xyValue,
                    },
                });
            });
        }
    };

    private readonly handleDragLineComplete = (e: React.MouseEvent, moreProps: any) => {
        const { override } = this.state;
        const { channels } = this.props;
        if (isDefined(override)) {
            const newChannels = channels.map((each, idx) =>
                idx === override.index
                    ? {
                          ...each,
                          start: [override.x1Value, override.y1Value],
                          end: [override.x2Value, override.y2Value],
                          selected: true,
                      }
                    : each,
            );
            this.setState(
                {
                    override: null,
                },
                () => {
                    const { onComplete } = this.props;
                    if (onComplete !== undefined) {
                        onComplete(e, newChannels, moreProps);
                    }
                },
            );
        }
    };

    private readonly handleDragLine = (e: React.MouseEvent, index: number | undefined, newXYValue: any) => {
        flushSync(() => {
            this.setState({
                override: {
                    index,
                    ...newXYValue,
                },
            });
        });
    };
}
