import * as React from "react";
import { flushSync } from "react-dom";
import { ChartContext, isDefined, strokeDashTypes } from "@reincharts/core";
import { HoverTextNearMouse, HorizontalLineIndicator } from "./components";
import { getValueFromOverride, isHoverForInteractiveType, saveNodeType, terminate, generateID } from "./utils";
import { EachInteractiveYCoordinate } from "./wrapper";

export interface InteractiveYCoordinateProps {
    /** Whether the interactive Y coordinate tool is enabled. */
    readonly enabled: boolean;
    /** Callback function triggered when Y coordinate creation is completed. newYCoordinateList is a
     *  list of all Y coordinates with the new/updated coordinate included.
     */
    readonly onComplete?: (e: React.MouseEvent, newYCoordinateList: any, moreProps: any) => void;
    /** Default styling configuration for new Y coordinate elements including text box and edge appearance. */
    readonly defaultPriceCoordinate: {
        readonly bgFill: string;
        readonly stroke: string;
        readonly strokeDasharray: strokeDashTypes;
        readonly strokeWidth: number;
        readonly textFill: string;
        readonly fontFamily: string;
        readonly fontWeight: string;
        readonly fontStyle: string;
        readonly fontSize: number;
        readonly text: string;
        readonly textBox: {
            readonly height: number;
            readonly left: number;
            readonly padding: {
                left: number;
                right: number;
            };
            readonly closeIcon: {
                padding: {
                    left: number;
                    right: number;
                };
                width: number;
            };
        };
        readonly edge: {
            readonly stroke: string;
            readonly strokeWidth: number;
            readonly fill: string;
        };
    };
    /** If true, allows Y coordinates that are created to be draggable. */
    readonly isDraggable?: boolean;
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
    /** Array of Y coordinate objects that get drawn. */
    readonly yCoordinateList: any[];
}

interface InteractiveYCoordinateState {
    current?: any;
    override?: any;
}

export class InteractiveYCoordinate extends React.Component<InteractiveYCoordinateProps, InteractiveYCoordinateState> {
    public static displayName = "InteractiveYCoordinate";

    public static defaultProps = {
        enabled: true,
        defaultPriceCoordinate: {
            bgFill: "rgba(255, 255, 255, 1)",
            stroke: "rgba(101, 116, 205, 1)",
            strokeDasharray: "LongDash",
            strokeWidth: 1,
            textFill: "#6574CD",
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 12,
            fontStyle: "normal",
            fontWeight: "normal",
            text: "Alert",
            textBox: {
                height: 24,
                left: 20,
                padding: { left: 10, right: 5 },
                closeIcon: {
                    padding: { left: 5, right: 8 },
                    width: 8,
                },
            },
            edge: {
                stroke: "rgba(101, 116, 205, 1)",
                strokeWidth: 1,
                fill: "rgba(255, 255, 255, 1)",
                orient: "right",
                at: "right",
                arrowWidth: 10,
                dx: 0,
                rectWidth: 50,
                rectHeight: 20,
            },
        },
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click to select object",
        },
        yCoordinateList: [],
    };

    public static contextType = ChartContext;
    declare public context: React.ContextType<typeof ChartContext>;

    // @ts-ignore
    private getSelectionState: any;
    private saveNodeType: any;
    // @ts-ignore
    private terminate: any;

    public constructor(props: InteractiveYCoordinateProps) {
        super(props);

        this.terminate = terminate.bind(this);
        this.saveNodeType = saveNodeType.bind(this);
        this.getSelectionState = isHoverForInteractiveType("yCoordinateList").bind(this);

        this.state = {};
    }

    public render() {
        const { yCoordinateList, enabled, hoverText } = this.props;
        const { override } = this.state;
        return (
            <g>
                {yCoordinateList.map((each, idx) => {
                    const props = each;
                    return (
                        <EachInteractiveYCoordinate
                            key={each.id}
                            ref={this.saveNodeType(idx)}
                            index={idx}
                            {...props}
                            selected={each.selected}
                            yValue={getValueFromOverride(override, idx, "yValue", each.yValue)}
                            hoverText={hoverText}
                            onDelete={this.handleDelete}
                            onDrag={this.handleDrag}
                            onDragComplete={this.handleDragComplete}
                            edgeInteractiveCursor="reincharts-move-cursor"
                        />
                    );
                })}
                <HorizontalLineIndicator
                    enabled={enabled}
                    onClick={this.handlePlace}
                    stroke="#6574CD"
                    strokeWidth={3}
                    strokeDasharray="Dash"
                />
            </g>
        );
    }

    private readonly handlePlace = (e: React.MouseEvent, xyValue: number[], moreProps: any) => {
        const { enabled } = this.props;
        if (enabled) {
            const { currentCharts } = moreProps;
            const { chartId } = this.context;

            if (currentCharts.indexOf(chartId) > -1) {
                const { defaultPriceCoordinate, onComplete, yCoordinateList, isDraggable } = this.props;
                const [, yValue] = xyValue;

                const newYCoordinate = {
                    ...defaultPriceCoordinate,
                    id: generateID(),
                    yValue,
                    selected: true,
                    draggable: isDraggable,
                };

                const newYCoordinateList = [...yCoordinateList.map((d) => ({ ...d, selected: false })), newYCoordinate];

                if (onComplete !== undefined) {
                    onComplete(e, newYCoordinateList, moreProps);
                }
            }
        }
    };

    private readonly handleDelete = (e: React.MouseEvent, index: number | undefined, moreProps: any) => {
        const { onComplete, yCoordinateList } = this.props;
        if (index !== undefined) {
            const newYCoordinateList = yCoordinateList.filter((_, i) => i !== index);

            if (onComplete !== undefined) {
                onComplete(e, newYCoordinateList, moreProps);
            }
        }
    };

    private readonly handleDragComplete = (e: React.MouseEvent, moreProps: any) => {
        const { override } = this.state;
        if (isDefined(override)) {
            const { yCoordinateList } = this.props;
            const newYCoordinateList = yCoordinateList.map((each, idx) => {
                const selected = idx === override.index;
                return selected
                    ? {
                          ...each,
                          yValue: override.yValue,
                          selected,
                      }
                    : {
                          ...each,
                          selected,
                      };
            });
            this.setState(
                {
                    override: null,
                },
                () => {
                    const { onComplete } = this.props;
                    if (onComplete !== undefined) {
                        onComplete(e, newYCoordinateList, moreProps);
                    }
                },
            );
        }
    };

    private readonly handleDrag = (_: React.MouseEvent, index: any, yValue: any) => {
        flushSync(() => {
            this.setState({
                override: {
                    index,
                    yValue,
                },
            });
        });
    };
}
