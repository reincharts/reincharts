import * as React from "react";
import { getMouseCanvas, GenericChartComponent } from "@reincharts/core";

export interface InteractiveTextProps {
    /** Background fill color for the text container. */
    readonly bgFillStyle: string;
    /** Background stroke width for the text container. */
    readonly bgStrokeWidth: number;
    /** Background stroke color for the text container. */
    readonly bgStroke: string;
    /** Default CSS class name for the component. */
    readonly defaultClassName?: string;
    /** Font family for the text. */
    readonly fontFamily: string;
    /** Font size for the text. */
    readonly fontSize: number;
    /** Font weight for the text. */
    readonly fontWeight: number | string;
    /** Font style for the text. */
    readonly fontStyle: string;
    /** Callback function when drag operation starts. */
    readonly onDragStart?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function during drag operation. */
    readonly onDrag?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when drag operation completes. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when text is double-clicked. */
    readonly onDoubleClick?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when hovering over the text. */
    readonly onHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when hover ends. */
    readonly onUnHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Position coordinates for the text. */
    readonly position?: any;
    /** CSS class name for the interactive cursor. */
    readonly interactiveCursorClass?: string;
    /** Whether the text is currently selected. */
    readonly selected: boolean;
    /** Text content to display. */
    readonly text: string;
    /** Fill color for the text. */
    readonly textFill: string;
    /** Tolerance for mouse interaction detection. */
    readonly tolerance: number;
}

export class InteractiveText extends React.Component<InteractiveTextProps> {
    public static defaultProps = {
        fontWeight: "normal", // standard dev
        tolerance: 4,
        selected: false,
    };

    private calculateTextWidth = true;
    private textWidth?: number;

    public componentDidUpdate(previousProps: InteractiveTextProps) {
        this.calculateTextWidth =
            previousProps.text !== this.props.text ||
            previousProps.fontStyle !== this.props.fontStyle ||
            previousProps.fontWeight !== this.props.fontWeight ||
            previousProps.fontSize !== this.props.fontSize ||
            previousProps.fontFamily !== this.props.fontFamily;
    }

    public render() {
        const { selected, interactiveCursorClass } = this.props;
        const { onHover, onUnHover } = this.props;
        const { onDragStart, onDrag, onDragComplete, onDoubleClick } = this.props;

        return (
            <GenericChartComponent
                isHover={this.isHover}
                canvasToDraw={getMouseCanvas}
                canvasDraw={this.drawOnCanvas}
                interactiveCursorClass={interactiveCursorClass}
                selected={selected}
                onDragStart={onDragStart}
                onDrag={onDrag}
                onDragComplete={onDragComplete}
                onDoubleClickWhenHover={onDoubleClick}
                onHover={onHover}
                onUnHover={onUnHover}
                drawOn={["mousemove", "mouseleave", "pan", "drag", "dblclick", "keydown"]}
            />
        );
    }

    private readonly isHover = (moreProps: any) => {
        const { onHover } = this.props;

        if (onHover !== undefined && this.textWidth !== undefined && !this.calculateTextWidth) {
            const { rect } = this.helper(moreProps, this.textWidth);
            const {
                mouseXY: [x, y],
            } = moreProps;

            if (x >= rect.x && y >= rect.y && x <= rect.x + rect.width && y <= rect.y + rect.height) {
                return true;
            }
        }
        return false;
    };

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { bgFillStyle, bgStrokeWidth, bgStroke, textFill, fontFamily, fontSize, fontStyle, fontWeight, text } =
            this.props;

        if (this.calculateTextWidth) {
            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
            const { width } = ctx.measureText(text);
            this.textWidth = width;
            this.calculateTextWidth = false;
        }

        const { selected } = this.props;

        const { x, y, rect } = this.helper(moreProps, this.textWidth ?? 0);

        ctx.fillStyle = bgFillStyle;

        ctx.beginPath();
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

        if (selected) {
            ctx.strokeStyle = bgStroke;
            ctx.lineWidth = bgStrokeWidth;
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }

        ctx.fillStyle = textFill;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

        ctx.beginPath();
        ctx.fillText(text, x, y);
    };

    private readonly helper = (moreProps: any, textWidth: number) => {
        const { position, fontSize } = this.props;

        const {
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        const [xValue, yValue] = position;
        const x = xScale(xValue);
        const y = yScale(yValue);

        const rect = {
            x: x - textWidth / 2 - fontSize,
            y: y - fontSize,
            width: textWidth + fontSize * 2,
            height: fontSize * 2,
        };

        return {
            x,
            y,
            rect,
        };
    };
}
