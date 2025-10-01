import * as React from "react";
import { flushSync } from "react-dom";
import { isDefined, isNotDefined, noop } from "@reincharts/core";
import { HoverTextNearMouse, MouseLocationIndicator } from "./components";
import { getSlope, getYIntercept } from "./components/InteractiveStraightLine";
import { generateID, isHoverForInteractiveType, saveNodeType, terminate } from "./utils";
import { EachEquidistantChannel } from "./wrapper";

export interface EquidistantChannelProps {
    /** Whether the equidistant channel drawing tool is enabled. */
    readonly enabled: boolean;
    /** Callback function triggered when channel drawing starts. */
    readonly onStart?: () => void;
    /** Callback function triggered when channel drawing is completed. newChannels is a
     *  list of all channels with the new/updated channel included.
     */
    readonly onComplete?: (e: React.MouseEvent, newChannels: any[], moreProps: any) => void;
    /** Stroke color for the current position indicator. */
    readonly currentPositionStroke?: string;
    /** Width of the current position indicator stroke. */
    readonly currentPositionStrokeWidth?: number;
    /** Opacity of the current position indicator. */
    readonly currentPositionOpacity?: number;
    /** Radius of the current position indicator. */
    readonly currentPositionRadius?: number;
    /** Configuration for hover text display. */
    readonly hoverText: object;
    /** Array of channel objects that get drawn. */
    readonly channels: any[];
    /** Styling configuration for the channel appearance including strokes, fills, and edge styling. */
    readonly appearance: {
        readonly stroke: string;
        readonly strokeWidth: number;
        readonly fill: string;
        readonly edgeStroke: string;
        readonly edgeFill: string;
        readonly edgeFill2: string;
        readonly edgeStrokeWidth: number;
        readonly r: number;
    };
}

interface EquidistantChannelState {
    current?: any;
    override?: any;
}

export class EquidistantChannel extends React.Component<EquidistantChannelProps, EquidistantChannelState> {
    public static displayName = "EquidistantChannel";

    public static defaultProps = {
        enabled: true,
        onComplete: noop,
        currentPositionStroke: "#000000",
        currentPositionOpacity: 1,
        currentPositionStrokeWidth: 3,
        currentPositionRadius: 4,
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click to select object",
        },
        channels: [],
        appearance: {
            stroke: "#000000",
            strokeWidth: 1,
            fill: "rgba(138, 175, 226, 0.7)",
            edgeStroke: "#000000",
            edgeFill: "#FFFFFF",
            edgeFill2: "#250B98",
            edgeStrokeWidth: 1,
            r: 5,
        },
    };

    // @ts-ignore
    private terminate: () => void;
    private saveNodeType: any;
    // @ts-ignore
    private getSelectionState: any;
    private mouseMoved: any;

    public constructor(props: EquidistantChannelProps) {
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
            currentPositionRadius = EquidistantChannel.defaultProps.currentPositionRadius,
            currentPositionStroke,
            currentPositionStrokeWidth,
            enabled,
            hoverText,
        } = this.props;

        const { current, override } = this.state;

        const overrideIndex = isDefined(override) ? override.index : null;

        const tempChannel =
            isDefined(current) && isDefined(current.endXY) ? (
                <EachEquidistantChannel
                    interactive={false}
                    {...current}
                    appearance={appearance}
                    hoverText={hoverText}
                />
            ) : null;

        return (
            <g>
                {channels.map((each, idx) => {
                    const eachAppearance = isDefined(each.appearance)
                        ? { ...appearance, ...each.appearance }
                        : appearance;

                    return (
                        <EachEquidistantChannel
                            key={idx}
                            ref={this.saveNodeType(idx)}
                            index={idx}
                            selected={each.selected}
                            hoverText={hoverText}
                            {...(idx === overrideIndex ? override : each)}
                            appearance={eachAppearance}
                            onDrag={this.handleDragChannel}
                            onDragComplete={this.handleDragChannelComplete}
                        />
                    );
                })}
                {tempChannel}
                <MouseLocationIndicator
                    enabled={enabled}
                    snap={false}
                    r={currentPositionRadius}
                    stroke={currentPositionStroke}
                    opacity={currentPositionOpacity}
                    strokeWidth={currentPositionStrokeWidth}
                    onMouseDown={this.handleStart}
                    onClick={this.handleEnd}
                    onMouseMove={this.handleDrawChannel}
                />
            </g>
        );
    }

    private readonly handleDragChannel = (_: React.MouseEvent, index: any, newXYValue: any) => {
        flushSync(() => {
            this.setState({
                override: {
                    index,
                    ...newXYValue,
                },
            });
        });
    };

    private readonly handleDragChannelComplete = (e: React.MouseEvent, moreProps: any) => {
        const { override } = this.state;
        const { channels } = this.props;

        if (isDefined(override)) {
            const { index, ...rest } = override;
            const newChannels = channels.map((each, idx) =>
                idx === index ? { ...each, ...rest, selected: true } : each,
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

    private readonly handleStart = (_: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;

        if (isNotDefined(current) || isNotDefined(current.startXY)) {
            this.mouseMoved = false;
            this.setState(
                {
                    current: {
                        startXY: xyValue,
                        endXY: null,
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

    private readonly handleEnd = (e: React.MouseEvent, _: any, moreProps: any) => {
        const { current } = this.state;
        const { channels, appearance } = this.props;

        if (this.mouseMoved && isDefined(current) && isDefined(current.startXY)) {
            if (isNotDefined(current.dy)) {
                this.setState({
                    current: {
                        ...current,
                        dy: 0,
                    },
                });
            } else {
                const newChannels = [
                    ...channels.map((d) => ({ ...d, selected: false })),
                    {
                        ...current,
                        selected: true,
                        id: generateID(),
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
        }
    };

    private readonly handleDrawChannel = (_: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;

        if (isDefined(current) && isDefined(current.startXY)) {
            this.mouseMoved = true;
            if (isNotDefined(current.dy)) {
                flushSync(() => {
                    this.setState({
                        current: {
                            startXY: current.startXY,
                            endXY: xyValue,
                        },
                    });
                });
            } else {
                const m = getSlope(current.startXY, current.endXY);
                const b = getYIntercept(m, current.endXY);

                // @ts-ignore
                const y = m * xyValue[0] + b;
                const dy = xyValue[1] - y;

                flushSync(() => {
                    this.setState({
                        current: {
                            ...current,
                            dy,
                        },
                    });
                });
            }
        }
    };
}
