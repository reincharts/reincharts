import * as React from "react";
import { flushSync } from "react-dom";
import { isDefined, isNotDefined, noop } from "@reincharts/core";
import { HoverTextNearMouse, MouseLocationIndicator } from "./components";
import { generateID, isHoverForInteractiveType, saveNodeType, terminate } from "./utils";
import { EachGannFan } from "./wrapper";

export interface GannFanProps {
    /** Whether the Gann fan drawing tool is enabled. */
    readonly enabled: boolean;
    /** Callback function triggered when fan drawing starts. */
    readonly onStart?: () => void;
    /** Callback function triggered when fan drawing is completed. newfans is a
     *  list of all fans with the new/updated fan included.
     */
    readonly onComplete?: (e: React.MouseEvent, newfans: any[], moreProps: any) => void;
    /** Stroke color for the current position indicator. */
    readonly currentPositionStroke?: string;
    /** Width of the current position indicator stroke. */
    readonly currentPositionStrokeWidth?: number;
    /** Opacity of the current position indicator. */
    readonly currentPositionOpacity?: number;
    /** Radius of the current position indicator. */
    readonly currentPositionRadius?: number;
    /** Styling configuration for the fan appearance including strokes, fills, fonts, and edge styling. */
    readonly appearance: {
        readonly stroke: string;
        readonly strokeWidth: number;
        readonly edgeStroke: string;
        readonly edgeFill: string;
        readonly edgeStrokeWidth: number;
        readonly r: number;
        readonly fill: string[];
        readonly fontFamily: string;
        readonly fontSize: number;
        readonly fontFill: string;
    };
    /** Configuration for hover text display. */
    readonly hoverText: {
        readonly enable: boolean;
        readonly fontFamily: string;
        readonly fontSize: number;
        readonly fill: string;
        readonly text: string;
        readonly bgFill: string;
        readonly bgWidth: number | string;
        readonly bgHeight: number | string;
    };
    /** Array of Gann fan objects that get drawn. */
    readonly fans: any[];
}

interface CurrentGannFan {
    startXY: number[];
    endXY?: number[];
}

interface OverrideGannFan {
    index: number;
    startXY?: number[];
    endXY?: number[];
    selected?: boolean;
    appearance?: GannFanProps["appearance"];
}

interface GannFanState {
    current?: CurrentGannFan;
    override?: OverrideGannFan;
}

export class GannFan extends React.Component<GannFanProps, GannFanState> {
    public static displayName = "GannFan";

    public static defaultProps = {
        enabled: true,
        appearance: {
            stroke: "#000000",
            strokeWidth: 1,
            edgeStroke: "#000000",
            edgeFill: "#FFFFFF",
            edgeStrokeWidth: 1,
            r: 5,
            fill: [
                "rgba(31, 119, 180, 0.2)",
                "rgba(255, 126, 14, 0.2)",
                "rgba(44, 160, 44, 0.2)",
                "rgba(214, 39, 39, 0.2)",
                "rgba(148, 103, 189, 0.2)",
                "rgba(140, 86, 75, 0.2)",
                "rgba(227, 119, 194, 0.2)",
                "rgba(127, 127, 127, 0.2)",
            ],
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 12,
            fontFill: "#000000",
        },
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
        fans: [],
    };

    private mouseMoved: any;
    // @ts-ignore
    private getSelectionState: any;
    private saveNodeType: any;

    // @ts-ignore
    private terminate: any;

    public constructor(props: GannFanProps) {
        super(props);

        this.terminate = terminate.bind(this);
        this.saveNodeType = saveNodeType.bind(this);

        this.getSelectionState = isHoverForInteractiveType("fans").bind(this);

        this.state = {};
    }

    public render() {
        const {
            appearance,
            currentPositionOpacity,
            currentPositionRadius = GannFan.defaultProps.currentPositionRadius,
            currentPositionStroke,
            currentPositionStrokeWidth,
            enabled,
            fans,
            hoverText,
        } = this.props;

        const { current, override } = this.state;
        const overrideIndex = isDefined(override) ? override.index : null;

        const tempChannel =
            isDefined(current) && isDefined(current.endXY) ? (
                <EachGannFan
                    interactive={false}
                    {...current}
                    endXY={current.endXY}
                    appearance={appearance}
                    hoverText={hoverText}
                />
            ) : null;

        return (
            <g>
                {fans.map((each, idx) => {
                    const eachAppearance = isDefined(each.appearance)
                        ? { ...appearance, ...each.appearance }
                        : appearance;

                    return (
                        <EachGannFan
                            key={idx}
                            ref={this.saveNodeType(idx)}
                            index={idx}
                            selected={each.selected}
                            {...(idx === overrideIndex ? override : each)}
                            appearance={eachAppearance}
                            hoverText={hoverText}
                            onDrag={this.handleDragFan}
                            onDragComplete={this.handleDragFanComplete}
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
                    onMouseMove={this.handleDrawFan}
                />
            </g>
        );
    }

    private readonly handleEnd = (e: React.MouseEvent, _: any, moreProps: any) => {
        const { current } = this.state;
        const { fans, appearance } = this.props;

        if (this.mouseMoved && isDefined(current) && isDefined(current.startXY)) {
            const newfans = [
                ...fans.map((d) => ({ ...d, selected: false })),
                { ...current, selected: true, id: generateID(), appearance },
            ];
            this.setState(
                {
                    current: undefined,
                },
                () => {
                    const { onComplete } = this.props;
                    if (onComplete !== undefined) {
                        onComplete(e, newfans, moreProps);
                    }
                },
            );
        }
    };

    private readonly handleStart = (_: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;

        if (isNotDefined(current) || isNotDefined(current?.startXY)) {
            this.mouseMoved = false;

            this.setState(
                {
                    current: {
                        startXY: xyValue,
                        endXY: undefined,
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

    private readonly handleDrawFan = (_: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;

        if (isDefined(current) && isDefined(current.startXY)) {
            this.mouseMoved = true;

            flushSync(() => {
                this.setState({
                    current: {
                        startXY: current.startXY,
                        endXY: xyValue,
                    },
                });
            });
        }
    };

    private readonly handleDragFanComplete = (e: React.MouseEvent, moreProps: any) => {
        const { override } = this.state;
        const { fans } = this.props;

        if (isDefined(override)) {
            const { index, ...rest } = override;
            const newfans = fans.map((each, idx) => (idx === index ? { ...each, ...rest, selected: true } : each));

            flushSync(() => {
                this.setState(
                    {
                        override: undefined,
                    },
                    () => {
                        const { onComplete } = this.props;
                        if (onComplete !== undefined) {
                            onComplete(e, newfans, moreProps);
                        }
                    },
                );
            });
        }
    };

    private readonly handleDragFan = (_: React.MouseEvent, index: number | undefined, newXYValue: any) => {
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
