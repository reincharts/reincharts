import * as React from "react";
import { noop } from "@reincharts/core";
import { Drawing } from "../components/Drawing";
import { HoverTextNearMouse } from "../components";
import { isHover, saveNodeType } from "../utils";

export interface EachDrawingProps {
    /** Array of points defining the drawing path. */
    readonly points: [number, number][];
    /** Whether the drawing is interactive. */
    readonly interactive: boolean;
    /** Whether the drawing is currently selected. */
    readonly selected: boolean;
    /** Appearance configuration for the drawing. */
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
    /** Index of this drawing in the collection. */
    readonly index?: number;
    /** Callback function during drag operation. */
    readonly onDrag: (e: React.MouseEvent, index: number | undefined, moreProps: any) => void;
    /** Callback function when drag operation completes. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when drawing is selected. */
    readonly onSelect?: (e: React.MouseEvent, index: number | undefined, moreProps: any) => void;
}

interface EachDrawingState {
    hover: boolean;
}

export class EachDrawing extends React.Component<EachDrawingProps, EachDrawingState> {
    public static defaultProps = {
        interactive: true,
        selected: false,
        appearance: {
            stroke: "black",
            strokeWidth: 2,
            selectedStroke: "red",
            selectedStrokeWidth: 3,
            tolerance: 10,
        },
        onDrag: noop,
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click to select drawing",
        },
    };

    // @ts-ignore
    private isHover: any;
    private dragStart: any;
    private saveNodeType: any;

    public constructor(props: EachDrawingProps) {
        super(props);

        this.isHover = isHover.bind(this);
        this.saveNodeType = saveNodeType.bind(this);

        this.state = {
            hover: false,
        };
    }

    public render() {
        const { points, interactive, appearance, selected } = this.props;
        const { stroke, strokeWidth, selectedStroke, selectedStrokeWidth, tolerance } = appearance;
        const { hoverText } = this.props;
        const { onDragComplete } = this.props;
        const { hover } = this.state;
        const { enable: hoverTextEnabled, ...restHoverTextProps } = hoverText;

        const hoverHandler = interactive ? { onHover: this.handleHover, onUnHover: this.handleHover } : {};

        return (
            <g>
                <Drawing
                    ref={this.saveNodeType("drawing")}
                    points={points}
                    strokeStyle={stroke}
                    strokeWidth={strokeWidth}
                    selectedStrokeStyle={selectedStroke}
                    selectedStrokeWidth={selectedStrokeWidth}
                    tolerance={tolerance}
                    selected={hover || selected}
                    interactiveCursorClass="reincharts-move-cursor"
                    onDragStart={this.handleDragStart}
                    onDrag={this.handleDrawingDrag}
                    onDragComplete={onDragComplete}
                    onClick={this.handleClick}
                    {...hoverHandler}
                />
                <HoverTextNearMouse show={hoverTextEnabled && hover && !selected} {...restHoverTextProps} />
            </g>
        );
    }

    private readonly handleDrawingDrag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag } = this.props;

        if (!this.dragStart) {
            return;
        }

        const { points } = this.dragStart;
        const {
            startPos,
            mouseXY,
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        // Calculate the drag delta
        const dx = startPos[0] - mouseXY[0];
        const dy = startPos[1] - mouseXY[1];

        // Transform all points by the drag delta
        const newPoints = points.map((point: [number, number]) => {
            const x = xScale(point[0]);
            const y = yScale(point[1]);

            // Apply the drag offset
            const newX = x - dx;
            const newY = y - dy;

            // Convert back to data coordinates
            const newXValue = xScale.invert(newX);
            const newYValue = yScale.invert(newY);

            return [newXValue, newYValue] as [number, number];
        });

        onDrag(e, index, { points: newPoints });
    };

    private readonly handleClick = (e: React.MouseEvent, moreProps: any) => {
        const { index, onSelect } = this.props;
        if (onSelect) {
            onSelect(e, index, moreProps);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly handleDragStart = (_: React.MouseEvent, moreProps: any) => {
        const { points } = this.props;

        this.dragStart = {
            points,
        };
    };

    private readonly handleHover = (_: React.MouseEvent, moreProps: any) => {
        if (this.state.hover !== moreProps.hovering) {
            this.setState({
                hover: moreProps.hovering,
            });
        }
    };
}
