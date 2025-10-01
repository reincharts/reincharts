import * as React from "react";
import { flushSync } from "react-dom";
import { noop, isDefined, isNotDefined } from "@reincharts/core";
import { HoverTextNearMouse, MouseLocationIndicator } from "./components";
import { generateID, isHoverForInteractiveType, saveNodeType, terminate } from "./utils";
import { EachDrawing } from "./wrapper/EachDrawing";

export interface DrawingProps {
    /** Whether the drawing tool is enabled. */
    readonly enabled: boolean;
    /** Callback function triggered when drawing starts. */
    readonly onStart?: () => void;
    /** Callback function triggered when drawing is completed. newDrawings is a
     *  list of all drawings with the new/updated drawing included.
     */
    readonly onComplete?: (e: React.MouseEvent, newDrawings: any[], moreProps: any) => void;
    /** Callback function triggered when a drawing is selected. index is
     *  the selected drawing index
     */
    readonly onSelect?: (e: React.MouseEvent, index: number | undefined, moreProps: any) => void;
    /** Stroke color for the current position indicator. */
    readonly currentPositionStroke?: string;
    /** Width of the current position indicator stroke. */
    readonly currentPositionStrokeWidth?: number;
    /** Opacity of the current position indicator. */
    readonly currentPositionOpacity?: number;
    /** Radius of the current position indicator. */
    readonly currentPositionRadius?: number;
    /** Styling configuration for the drawing appearance. */
    readonly appearance: {
        readonly stroke: string;
        readonly strokeWidth: number;
        readonly selectedStroke: string;
        readonly selectedStrokeWidth: number;
        readonly tolerance: number;
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
    /** Array of drawing objects that get drawn. */
    readonly drawings: Array<{
        points: [number, number][];
        selected?: boolean;
        appearance?: DrawingProps["appearance"];
    }>;
}

interface CurrentDrawing {
    points?: [number, number][];
}

interface OverrideDrawing {
    index: number;
    points?: [number, number][];
    selected?: boolean;
    appearance?: DrawingProps["appearance"];
}

interface DrawingState {
    current?: CurrentDrawing;
    override?: OverrideDrawing;
}

export class Drawing extends React.Component<DrawingProps, DrawingState> {
    public static displayName = "Drawing";

    public static defaultProps = {
        enabled: true,
        onStart: noop,
        onComplete: noop,
        appearance: {
            stroke: "black",
            strokeWidth: 2,
            selectedStroke: "red",
            selectedStrokeWidth: 4,
            tolerance: 10,
        },
        onSelect: noop,
        currentPositionStroke: "black",
        currentPositionOpacity: 1,
        currentPositionStrokeWidth: 3,
        currentPositionRadius: 4,
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click to select drawing",
        },
        drawings: [],
    };

    private mouseMoved: any;
    // @ts-ignore
    private getSelectionState: any;
    private saveNodeType: any;
    // @ts-ignore
    private terminate: any;

    public constructor(props: DrawingProps) {
        super(props);

        this.terminate = terminate.bind(this);
        this.saveNodeType = saveNodeType.bind(this);
        this.getSelectionState = isHoverForInteractiveType("drawings").bind(this);

        this.state = {};
    }

    public render() {
        const {
            appearance,
            currentPositionOpacity,
            currentPositionRadius = Drawing.defaultProps.currentPositionRadius,
            currentPositionStroke,
            currentPositionStrokeWidth,
            enabled,
            drawings,
            hoverText,
            onSelect,
        } = this.props;

        const { current, override } = this.state;
        const overrideIndex = isDefined(override) ? override.index : null;

        const tempDrawing =
            isDefined(current) && isDefined(current.points) ? (
                <EachDrawing
                    interactive={false}
                    points={current.points}
                    appearance={appearance}
                    hoverText={hoverText}
                />
            ) : null;

        return (
            <g>
                {drawings.map((each, idx) => {
                    const eachAppearance = isDefined(each.appearance)
                        ? { ...appearance, ...each.appearance }
                        : appearance;

                    return (
                        <EachDrawing
                            key={idx}
                            ref={this.saveNodeType(idx)}
                            index={idx}
                            selected={each.selected}
                            points={idx === overrideIndex ? (override?.points ?? []) : each.points}
                            appearance={eachAppearance}
                            hoverText={hoverText}
                            onDrag={this.handleDragDrawing}
                            onDragComplete={this.handleDragDrawingComplete}
                            onSelect={onSelect}
                        />
                    );
                })}
                {tempDrawing}
                <MouseLocationIndicator
                    enabled={enabled}
                    snap={false}
                    snapX={false}
                    r={currentPositionRadius}
                    stroke={currentPositionStroke}
                    opacity={currentPositionOpacity}
                    strokeWidth={currentPositionStrokeWidth}
                    onMouseDown={this.handleStart}
                    onClick={this.handleEnd}
                    onMouseMove={this.handleDrawDrawing}
                />
            </g>
        );
    }

    private readonly handleEnd = (e: React.MouseEvent, _: any, moreProps: any) => {
        const { current } = this.state;
        const { drawings, appearance } = this.props;

        if (this.mouseMoved && isDefined(current) && isDefined(current.points)) {
            const newDrawings = [
                ...drawings.map((d) => ({ ...d, selected: false })),
                { ...current, selected: true, appearance, id: generateID() },
            ];

            this.setState(
                {
                    current: undefined,
                },
                () => {
                    const { onComplete } = this.props;
                    if (onComplete !== undefined) {
                        // Only call onComplete if there are more than 5 points in the current drawing
                        if (current!.points!.length > 5) {
                            onComplete(e, newDrawings, moreProps);
                        }
                    }
                },
            );
        }
    };

    private readonly handleStart = (e: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;

        if (isNotDefined(current) || isNotDefined(current?.points)) {
            this.mouseMoved = false;

            this.setState(
                {
                    current: {
                        points: [xyValue],
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

    private readonly handleDrawDrawing = (e: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;

        if (isDefined(current) && isDefined(current.points)) {
            this.mouseMoved = true;

            flushSync(() => {
                if (current.points) {
                    this.setState({
                        current: {
                            points: [...current.points, xyValue],
                        },
                    });
                }
            });
        }
    };

    private readonly handleDragDrawingComplete = (e: React.MouseEvent, moreProps: any) => {
        const { override } = this.state;
        const { drawings } = this.props;

        if (override) {
            const { index, ...rest } = override;
            const newDrawings = drawings.map((each, idx) =>
                idx === index ? { ...each, ...rest, selected: true } : each,
            );

            this.setState(
                {
                    override: undefined,
                },
                () => {
                    const { onComplete } = this.props;
                    if (onComplete !== undefined) {
                        onComplete(e, newDrawings, moreProps);
                    }
                },
            );
        }
    };

    private readonly handleDragDrawing = (e: React.MouseEvent, index: number | undefined, newDrawingValue: any) => {
        flushSync(() => {
            this.setState({
                override: {
                    index: index,
                    ...newDrawingValue,
                },
            });
        });
    };
}
