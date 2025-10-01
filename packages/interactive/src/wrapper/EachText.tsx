import * as React from "react";
import { flushSync } from "react-dom";
import { getXValue } from "@reincharts/core/lib/utils/ChartDataUtil";
import { isHover, saveNodeType } from "../utils";
import { HoverTextNearMouse, EditableText } from "../components";

export interface EachTextProps {
    /** Optional index identifier for this text element. */
    readonly index?: number;
    /** Position coordinates for the text element. */
    readonly position?: any;
    /** Background fill color for the text box. */
    readonly bgFill: string;
    /** Border width for the text box background. */
    readonly bgStrokeWidth: number;
    /** Border color for the text box background. */
    readonly bgStroke?: string;
    /** Fill color for the text content. */
    readonly textFill: string;
    /** Font weight for the text (normal, bold, etc.). */
    readonly fontWeight: string;
    /** Font family for the text. */
    readonly fontFamily: string;
    /** Font style for the text (normal, italic, etc.). */
    readonly fontStyle: string;
    /** Font size for the text. */
    readonly fontSize: number;
    /** The text content to display. */
    readonly text: string;
    /** Whether this text element is currently selected. */
    readonly selected: boolean;
    /** Callback fired when the text element is being dragged. */
    readonly onDrag?: (e: React.MouseEvent, index: number | undefined, xyValue: number[]) => void;
    /** Callback fired when dragging of the text element is completed. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when the text element is double-clicked for editing. */
    readonly onDoubleClick?: (e: React.MouseEvent, index: number | undefined, moreProps?: any) => void;
    /** Callback fired when the text content is changed during editing. */
    readonly onChange?: (newText: string, moreProps: any, index?: number) => void;
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
        /** Text content to display when the text element is selected. */
        readonly selectedText: string;
        /** Background fill color for the hover text. */
        readonly bgFill: string;
        /** Width of the hover text background. */
        readonly bgWidth: number | string;
        /** Height of the hover text background. */
        readonly bgHeight: number | string;
    };
}

interface EachTextState {
    hover: boolean;
}

export class EachText extends React.Component<EachTextProps, EachTextState> {
    public static defaultProps = {
        bgStrokeWidth: 1,
        selected: false,
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

    public constructor(props: EachTextProps) {
        super(props);

        this.handleHover = this.handleHover.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);

        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDrag = this.handleDrag.bind(this);

        this.isHover = isHover.bind(this);
        this.saveNodeType = saveNodeType.bind(this);

        this.state = {
            hover: false,
        };
    }

    public render() {
        const {
            position,
            bgFill,
            bgStroke,
            bgStrokeWidth,
            textFill,
            fontFamily,
            fontSize,
            fontWeight,
            fontStyle,
            text,
            hoverText,
            selected,
            onDragComplete,
        } = this.props;
        const { hover } = this.state;

        const hoverHandler = {
            onHover: this.handleHover,
            onUnHover: this.handleHover,
        };

        const {
            enable: hoverTextEnabled,
            selectedText: hoverTextSelected,
            text: hoverTextUnselected,
            ...restHoverTextProps
        } = hoverText;

        return (
            <g>
                <EditableText
                    ref={this.saveNodeType("text")}
                    selected={selected || hover}
                    interactiveCursorClass="reincharts-move-cursor"
                    {...hoverHandler}
                    onDragStart={this.handleDragStart}
                    onDrag={this.handleDrag}
                    onDragComplete={onDragComplete}
                    onDoubleClick={this.handleDoubleClick}
                    onChange={this.handleChange}
                    position={position}
                    bgFillStyle={bgFill}
                    bgStroke={bgStroke || textFill}
                    bgStrokeWidth={bgStrokeWidth}
                    textFill={textFill}
                    fontFamily={fontFamily}
                    fontStyle={fontStyle}
                    fontWeight={fontWeight}
                    fontSize={fontSize}
                    text={text}
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

    private readonly handleDrag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag } = this.props;
        if (onDrag === undefined) {
            return;
        }

        const {
            mouseXY: [, mouseY],
            chartConfig: { yScale },
            xAccessor,
            mouseXY,
            plotData,
            xScale,
        } = moreProps;

        const { dx, dy } = this.dragStartPosition;
        const xValue = xScale.invert(xScale(getXValue(xScale, xAccessor, mouseXY, plotData)) - dx);
        // xScale.invert(xScale(xAccessor(currentItem)) - dx);
        const xyValue = [xValue, yScale.invert(mouseY - dy)];

        onDrag(e, index, xyValue);
    };

    private readonly handleDragStart = (_: React.MouseEvent, moreProps: any) => {
        const { position } = this.props;
        const { mouseXY } = moreProps;
        const {
            chartConfig: { yScale },
            xScale,
        } = moreProps;
        const [mouseX, mouseY] = mouseXY;

        const [textCX, textCY] = position;
        const dx = mouseX - xScale(textCX);
        const dy = mouseY - yScale(textCY);

        this.dragStartPosition = {
            position,
            dx,
            dy,
        };
    };

    private readonly handleDoubleClick = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDoubleClick } = this.props;
        if (onDoubleClick !== undefined) {
            onDoubleClick(e, index, moreProps);
        }
    };

    private readonly handleChange = (newText: string, moreProps: any) => {
        const { index, onChange } = this.props;
        if (onChange !== undefined) {
            onChange(newText, moreProps, index);
        }
    };
}
