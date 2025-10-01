import * as React from "react";
import { strokeDashTypes } from "@reincharts/core";
import { isHover, saveNodeType } from "../utils";
import { ClickableShape, HoverTextNearMouse, InteractiveYCoordinate } from "../components";

export interface EachInteractiveYCoordinateProps {
    /** Optional index identifier for this Y coordinate. */
    readonly index?: number;
    /** Whether the Y coordinate can be dragged vertically. */
    readonly draggable: boolean;
    /** The Y-axis value where the coordinate line is positioned. */
    readonly yValue: number;
    /** Background fill color for the coordinate label. */
    readonly bgFill: string;
    /** Stroke color for the coordinate line. */
    readonly stroke: string;
    /** Width of the coordinate line stroke. */
    readonly strokeWidth: number;
    /** Dash pattern for the coordinate line. */
    readonly strokeDasharray: strokeDashTypes;
    /** Fill color for the coordinate label text. */
    readonly textFill: string;
    /** Font weight for the coordinate label text. */
    readonly fontWeight: string;
    /** Font family for the coordinate label text. */
    readonly fontFamily: string;
    /** Font style for the coordinate label text. */
    readonly fontStyle: string;
    /** Font size for the coordinate label text. */
    readonly fontSize: number;
    /** Text content to display in the coordinate label. */
    readonly text: string;
    /** Whether this Y coordinate is currently selected. */
    readonly selected: boolean;
    /** Configuration for the coordinate edge/label appearance. */
    readonly edge: object;
    /** Configuration for the text box containing the coordinate label. */
    readonly textBox: {
        /** Close icon configuration for removing the coordinate. */
        readonly closeIcon: any;
        /** Left position offset for the text box. */
        readonly left: number;
        /** Height of the text box. */
        readonly height: number;
        /** Padding configuration for the text box. */
        readonly padding: any;
    };
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
    };
    /** Callback fired when the Y coordinate is being dragged. */
    readonly onDrag?: (e: React.MouseEvent, index: number | undefined, moreProps: any) => void;
    /** Callback fired when dragging of the Y coordinate is completed. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when the Y coordinate is deleted. */
    readonly onDelete?: (e: React.MouseEvent, index: number | undefined, moreProps: any) => void;
}

interface EachInteractiveYCoordinateState {
    closeIconHover: boolean;
    hover: boolean;
}

export class EachInteractiveYCoordinate extends React.Component<
    EachInteractiveYCoordinateProps,
    EachInteractiveYCoordinateState
> {
    public static defaultProps = {
        strokeWidth: 1,
        selected: false,
        draggable: false,
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click to select object",
        },
    };

    private dragStartPosition: any;
    // @ts-ignore
    private isHover: any;
    private saveNodeType: any;

    public constructor(props: EachInteractiveYCoordinateProps) {
        super(props);

        this.isHover = isHover.bind(this);
        this.saveNodeType = saveNodeType.bind(this);

        this.state = {
            hover: false,
            closeIconHover: false,
        };
    }

    public render() {
        const {
            yValue,
            bgFill,
            textFill,
            fontFamily,
            fontSize,
            fontWeight,
            fontStyle,
            text,
            selected,
            onDragComplete,
            stroke,
            strokeDasharray,
            strokeWidth,
            edge,
            textBox,
            draggable,
            hoverText,
        } = this.props;

        const { hover, closeIconHover } = this.state;
        const { enable: hoverTextEnabled = false, ...restHoverTextProps } = hoverText;

        const hoverHandler = {
            onHover: this.handleHover,
            onUnHover: this.handleHover,
        };

        const dragProps = draggable
            ? {
                  onDragStart: this.handleDragStart,
                  onDrag: this.handleDrag,
                  onDragComplete,
              }
            : {};
        return (
            <g>
                <InteractiveYCoordinate
                    ref={this.saveNodeType("priceCoordinate")}
                    selected={selected && !closeIconHover}
                    hovering={hover || closeIconHover}
                    interactiveCursorClass="reincharts-move-cursor"
                    {...hoverHandler}
                    {...dragProps}
                    yValue={yValue}
                    bgFillStyle={bgFill}
                    textFill={textFill}
                    fontFamily={fontFamily}
                    fontStyle={fontStyle}
                    fontWeight={fontWeight}
                    fontSize={fontSize}
                    strokeStyle={stroke}
                    strokeDasharray={strokeDasharray}
                    strokeWidth={strokeWidth}
                    text={text}
                    textBox={textBox}
                    edge={edge}
                />
                <ClickableShape
                    show
                    hovering={closeIconHover}
                    text={text}
                    yValue={yValue}
                    fontFamily={fontFamily}
                    fontStyle={fontStyle}
                    fontWeight={fontWeight}
                    fontSize={fontSize}
                    textBox={textBox}
                    strokeStyle={stroke}
                    onHover={this.handleCloseIconHover}
                    onUnHover={this.handleCloseIconHover}
                    onClick={this.handleDelete}
                />
                <HoverTextNearMouse show={hoverTextEnabled && hover && !selected} {...restHoverTextProps} />
            </g>
        );
    }

    private readonly handleCloseIconHover = (_: React.MouseEvent, moreProps: any) => {
        if (this.state.closeIconHover !== moreProps.hovering) {
            this.setState({
                closeIconHover: moreProps.hovering,
            });
        }
    };

    private readonly handleHover = (e: React.MouseEvent, moreProps: any) => {
        if (this.state.hover !== moreProps.hovering) {
            this.setState({
                hover: moreProps.hovering,
                closeIconHover: moreProps.hovering ? this.state.closeIconHover : false,
            });
        }
    };

    private readonly handleDelete = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDelete } = this.props;
        if (onDelete !== undefined) {
            onDelete(e, index, moreProps);
        }
    };

    private readonly handleDrag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag } = this.props;
        if (onDrag === undefined) {
            return;
        }

        const {
            mouseXY: [, mouseY],
            chartConfig: { yScale },
        } = moreProps;

        const { dy } = this.dragStartPosition;

        const newYValue = yScale.invert(mouseY - dy);

        onDrag(e, index, newYValue);
    };

    private readonly handleDragStart = (_: React.MouseEvent, moreProps: any) => {
        const { yValue } = this.props;
        const { mouseXY } = moreProps;
        const {
            chartConfig: { yScale },
        } = moreProps;
        const [, mouseY] = mouseXY;

        const dy = mouseY - yScale(yValue);

        this.dragStartPosition = {
            yValue,
            dy,
        };
    };
}
