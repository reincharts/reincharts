import { getCurrentItem } from "@reincharts/core/lib/utils/ChartDataUtil";
import * as React from "react";
import { flushSync } from "react-dom";
import { isHover, saveNodeType } from "../utils";
import { HoverTextNearMouse, ClickableCircle } from "../components";
import {
    edge1Provider,
    edge2Provider,
    LinearRegressionChannelWithArea,
} from "../components/LinearRegressionChannelWithArea";

export interface EachLinearRegressionChannelProps {
    /** Optional CSS class name for styling the linear regression channel. */
    readonly defaultClassName?: string;
    /** X-axis value for the first point of the linear regression channel. */
    readonly x1Value: any;
    /** X-axis value for the second point of the linear regression channel. */
    readonly x2Value: any;
    /** Optional index identifier for this linear regression channel. */
    readonly index?: number;
    /** Visual appearance configuration for the linear regression channel. */
    readonly appearance: {
        /** Stroke color for the channel lines. */
        readonly stroke: string;
        /** Width of the channel lines. */
        readonly strokeWidth: number;
        /** Fill color for the channel area between lines. */
        readonly fill: string;
        /** Stroke width for the edge control circles. */
        readonly edgeStrokeWidth: number;
        /** Stroke color for the edge control circles. */
        readonly edgeStroke: string;
        /** Fill color for the edge control circles. */
        readonly edgeFill: string;
        /** Radius of the edge control circles. */
        readonly r: number;
    };
    /** Cursor style to display when hovering over edge controls. */
    readonly edgeInteractiveCursor?: string;
    /** Callback fired when the linear regression channel is being dragged. */
    readonly onDrag?: (e: React.MouseEvent, index: number | undefined, x1y1: { x1Value: any; x2Value: any }) => void;
    /** Callback fired when dragging of the linear regression channel is completed. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Function to snap channel endpoints to specific data points. */
    readonly snapTo?: (data: any) => number;
    /** Whether the linear regression channel is interactive (can be dragged/modified). */
    readonly interactive: boolean;
    /** Whether this linear regression channel is currently selected. */
    readonly selected: boolean;
    /** Configuration for hover text display. */
    readonly hoverText: {
        /** Whether hover text is enabled. */
        readonly enable: boolean;
        /** Font family for the hover text. */
        readonly fontFamily: string;
        /** Font size for the hover text. */
        readonly fontSize: number;
        /** Fill color for the hover text. */
        readonly fill: string;
        /** Text content to display on hover. */
        readonly text: string;
        /** Background fill color for the hover text. */
        readonly bgFill: string;
        /** Width of the hover text background. */
        readonly bgWidth: number | string;
        /** Height of the hover text background. */
        readonly bgHeight: number | string;
        /** Text content to display when the linear regression channel is selected. */
        readonly selectedText: string;
    };
}

interface EachLinearRegressionChannelState {
    hover: boolean;
}

export class EachLinearRegressionChannel extends React.Component<
    EachLinearRegressionChannelProps,
    EachLinearRegressionChannelState
> {
    public static defaultProps = {
        appearance: {
            stroke: "#000000",
            strokeWidth: 1,
            fill: "rgba(138, 175, 226, 0.7)",
            edgeStrokeWidth: 2,
            edgeStroke: "#000000",
            edgeFill: "#FFFFFF",
            r: 5,
        },
        interactive: true,
        selected: false,
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click and drag the edge circles",
        },
    };

    // @ts-ignore
    private isHover: any;
    private saveNodeType: any;

    public constructor(props: EachLinearRegressionChannelProps) {
        super(props);

        this.isHover = isHover.bind(this);
        this.saveNodeType = saveNodeType.bind(this);

        this.state = {
            hover: false,
        };
    }

    public render() {
        const {
            x1Value,
            x2Value,
            appearance,
            edgeInteractiveCursor,
            hoverText,
            interactive,
            selected,
            onDragComplete,
        } = this.props;
        const { stroke, strokeWidth, fill, r, edgeStrokeWidth, edgeFill, edgeStroke } = appearance;
        const { hover } = this.state;

        const hoverHandler = interactive ? { onHover: this.handleHover, onUnHover: this.handleHover } : {};

        const {
            enable: hoverTextEnabled,
            selectedText: hoverTextSelected,
            text: hoverTextUnselected,
            ...restHoverTextProps
        } = hoverText;

        return (
            <g>
                <LinearRegressionChannelWithArea
                    ref={this.saveNodeType("area")}
                    selected={selected || hover}
                    {...hoverHandler}
                    x1Value={x1Value}
                    x2Value={x2Value}
                    fillStyle={fill}
                    strokeStyle={stroke}
                    strokeWidth={hover || selected ? strokeWidth + 1 : strokeWidth}
                />
                <ClickableCircle
                    ref={this.saveNodeType("edge1")}
                    show={selected || hover}
                    xyProvider={edge1Provider(this.props)}
                    r={r}
                    fillStyle={edgeFill}
                    strokeStyle={edgeStroke}
                    strokeWidth={edgeStrokeWidth}
                    interactiveCursorClass={edgeInteractiveCursor}
                    onDrag={this.handleEdge1Drag}
                    onDragComplete={onDragComplete}
                />
                <ClickableCircle
                    ref={this.saveNodeType("edge2")}
                    show={selected || hover}
                    xyProvider={edge2Provider(this.props)}
                    r={r}
                    fillStyle={edgeFill}
                    strokeStyle={edgeStroke}
                    strokeWidth={edgeStrokeWidth}
                    interactiveCursorClass={edgeInteractiveCursor}
                    onDrag={this.handleEdge2Drag}
                    onDragComplete={onDragComplete}
                />
                <HoverTextNearMouse
                    show={hoverTextEnabled && hover}
                    {...restHoverTextProps}
                    text={selected ? hoverTextSelected : hoverTextUnselected}
                />
            </g>
        );
    }

    private readonly handleHover = (_: React.MouseEvent, moreProps: any) => {
        if (this.state.hover !== moreProps.hovering) {
            flushSync(() => {
                this.setState({
                    hover: moreProps.hovering,
                });
            });
        }
    };

    private readonly handleEdge2Drag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag, snapTo, x1Value } = this.props;
        if (onDrag === undefined) {
            return;
        }

        const [x2Value] = getNewXY(moreProps, snapTo);

        onDrag(e, index, {
            x1Value,
            x2Value,
        });
    };

    private readonly handleEdge1Drag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag, snapTo, x2Value } = this.props;
        if (onDrag === undefined) {
            return;
        }

        const [x1Value] = getNewXY(moreProps, snapTo);

        onDrag(e, index, {
            x1Value,
            x2Value,
        });
    };
}

export function getNewXY(moreProps: any, snapTo: any) {
    const { xScale, xAccessor, plotData, mouseXY } = moreProps;

    const currentItem = getCurrentItem(xScale, xAccessor, mouseXY, plotData);
    const x = xAccessor(currentItem);
    const y = snapTo(currentItem);

    return [x, y];
}
