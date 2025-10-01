import * as React from "react";
import { getMouseCanvas, GenericChartComponent, ChartCanvasContext } from "@reincharts/core";

export interface EditableTextProps {
    /** Text content to display and edit. */
    readonly text: string;
    /** Position coordinates [x, y] for the text. */
    readonly position: [number, number];
    /** Font family for the text. */
    readonly fontFamily?: string;
    /** Font size for the text. */
    readonly fontSize?: number;
    /** Font style for the text (normal, italic, etc.). */
    readonly fontStyle?: string;
    /** Font weight for the text. */
    readonly fontWeight?: string | number;
    /** Fill color for the text. */
    readonly textFill?: string;
    /** Background fill color for the text container. */
    readonly bgFillStyle?: string;
    /** Background stroke color for the text container. */
    readonly bgStroke?: string;
    /** Background stroke width for the text container. */
    readonly bgStrokeWidth?: number;
    /** Fill color for text selection highlight. */
    readonly selectionFillStyle?: string;
    /** Whether the text is currently selected. */
    readonly selected?: boolean;
    /** Callback function when drag operation starts. */
    readonly onDragStart?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function during drag operation. */
    readonly onDrag?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when drag operation completes. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when hovering over the text. */
    readonly onHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when hover ends. */
    readonly onUnHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when text is double-clicked for editing. */
    readonly onDoubleClick?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback function when text content changes. */
    readonly onChange?: (newText: string, moreProps: any) => void;
    /** CSS class name for the interactive cursor. */
    readonly interactiveCursorClass?: string;
    /** Tolerance for mouse interaction detection. */
    readonly tolerance?: number;
}

interface EditableTextState {
    text: string;
    isEditing: boolean;
    isSelectingWithMouse: boolean;
    cursorPosition: number;
    selectionStart?: number;
    selectionEnd?: number;
    cursorVisible: boolean; // Control cursor blinking state
}

export class EditableText extends React.Component<EditableTextProps, EditableTextState> {
    declare public context: React.ContextType<typeof ChartCanvasContext>;
    public static defaultProps = {
        fontFamily: "Arial",
        fontSize: 12,
        fontStyle: "normal",
        fontWeight: "normal",
        textFill: "#000000",
        bgFillStyle: "rgba(200, 200, 200, 0.5)",
        bgStroke: "#000000",
        bgStrokeWidth: 1,
        selectionFillStyle: "rgba(0, 120, 215, 0.3)",
        selected: false,
        tolerance: 4,
    };

    private textWidth?: number;
    private cursorBlinkInterval?: number; // Timer for cursor blinking
    // Global keyup guard to prevent external deletion while editing
    private boundGlobalKeyUp?: (e: KeyboardEvent) => void;

    public constructor(props: EditableTextProps) {
        super(props);

        this.handleDoubleClick = this.handleDoubleClick.bind(this);

        this.state = {
            text: props.text,
            isEditing: false,
            isSelectingWithMouse: false,
            cursorPosition: props.text.length,
            selectionStart: undefined,
            selectionEnd: undefined,
            cursorVisible: true, // Start with cursor visible
        };
    }

    public componentDidUpdate(prevProps: EditableTextProps, prevState: EditableTextState) {
        // Update internal text if props text changes and we're not editing
        if (prevProps.text !== this.props.text && !this.state.isEditing) {
            this.setState({
                text: this.props.text,
                cursorPosition: this.props.text.length,
            });
        }

        // Start/stop cursor blinking based on editing state
        if (this.state.isEditing !== prevState.isEditing) {
            if (this.state.isEditing) {
                this.startCursorBlinking();
            } else {
                this.stopCursorBlinking();
            }
        }
    }

    public componentWillUnmount() {
        this.stopCursorBlinking();
        this.removeGlobalKeyGuards();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly isHover = (moreProps: any, e: React.MouseEvent) => {
        if (this.textWidth === undefined) {
            return false;
        }

        const { rect } = this.helper(moreProps, this.textWidth);
        const {
            mouseXY: [x, y],
        } = moreProps;

        return x >= rect.x && y >= rect.y && x <= rect.x + rect.width && y <= rect.y + rect.height;
    };

    private readonly helper = (moreProps: any, textWidth: number) => {
        const { position, fontSize = EditableText.defaultProps.fontSize } = this.props;

        const {
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        const [xValue, yValue] = position;
        const x = xScale(xValue);
        const y = yScale(yValue);
        const padding = fontSize * 0.5;
        const rectWidth = textWidth + padding * 2;
        const rectHeight = fontSize + padding * 2;

        return {
            x,
            y,
            rect: {
                x: x - rectWidth / 2,
                y: y - fontSize / 2 - padding,
                width: rectWidth,
                height: rectHeight,
            },
        };
    };

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const {
            bgFillStyle,
            bgStrokeWidth,
            bgStroke,
            textFill,
            fontFamily,
            fontSize,
            fontStyle,
            fontWeight,
            selectionFillStyle,
        } = this.props;

        const { text, isEditing, cursorPosition, selectionStart, selectionEnd, cursorVisible } = this.state;

        // Update font context
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

        this.textWidth = ctx.measureText(text).width;

        const { x: textCenterX, y: textCenterY, rect: bgRect } = this.helper(moreProps, this.textWidth);

        // Draw background
        ctx.fillStyle = bgFillStyle as string;
        ctx.fillRect(bgRect.x, bgRect.y, bgRect.width, bgRect.height);

        // Draw border if selected or editing
        if (isEditing || this.props.selected) {
            ctx.strokeStyle = bgStroke as string;
            ctx.lineWidth = bgStrokeWidth as number;
            ctx.strokeRect(bgRect.x, bgRect.y, bgRect.width, bgRect.height);
        }

        // Handle text selection
        const textStartX = textCenterX - this.textWidth / 2;
        if (
            isEditing &&
            selectionStart !== undefined &&
            selectionEnd !== undefined &&
            selectionStart !== selectionEnd
        ) {
            const selStart = Math.min(selectionStart, selectionEnd);
            const selEnd = Math.max(selectionStart, selectionEnd);
            const textBeforeSelection = text.substring(0, selStart);
            const selectedTextContent = text.substring(selStart, selEnd);
            const xOffsetForSelection = ctx.measureText(textBeforeSelection).width;
            const selectionRectWidth = ctx.measureText(selectedTextContent).width;
            const selectionVerticalPadding = bgRect.height * 0.1;

            ctx.fillStyle = selectionFillStyle as string;
            ctx.fillRect(
                textStartX + xOffsetForSelection,
                bgRect.y + selectionVerticalPadding,
                selectionRectWidth,
                bgRect.height - 2 * selectionVerticalPadding,
            );
        }

        // Draw text
        ctx.fillStyle = textFill as string;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text, textCenterX, textCenterY);

        // Draw cursor if editing
        if (isEditing && cursorVisible) {
            const textBeforeCursor = text.substring(0, cursorPosition);
            const cursorXOffset = ctx.measureText(textBeforeCursor).width;
            const cursorCanvasX = textStartX + cursorXOffset;
            const cursorTopMultiplier = 0.15;
            const cursorBottomMultiplier = 0.85;
            ctx.beginPath();
            ctx.moveTo(cursorCanvasX, bgRect.y + bgRect.height * cursorTopMultiplier);
            ctx.lineTo(cursorCanvasX, bgRect.y + bgRect.height * cursorBottomMultiplier);
            ctx.strokeStyle = textFill as string;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    };

    private readonly handleClick = (e: React.MouseEvent, moreProps: any) => {
        if (this.state.isEditing) {
            const isHoveringOnText = this.isHover(moreProps, e);
            if (!isHoveringOnText) {
                this.endEditing(moreProps);
            }
        }
    };

    private readonly startEditing = (e: React.MouseEvent, moreProps: any) => {
        this.setState(
            {
                isEditing: true,
                selectionStart: undefined,
                selectionEnd: undefined,
            },
            () => {
                // Position cursor at click position
                this.handleTextClick(e, moreProps);
            },
        );

        // Start cursor blinking
        this.startCursorBlinking();

        // While editing, block keyup for Backspace/Delete/Escape from reaching external handlers
        this.addGlobalKeyGuards();
    };

    private readonly endEditing = (moreProps: any) => {
        // Notify parent of text change if changed
        if (this.props.onChange && this.state.text !== this.props.text) {
            this.props.onChange(this.state.text, moreProps);
        }

        this.setState({
            isEditing: false,
            isSelectingWithMouse: false,
            selectionStart: undefined,
            selectionEnd: undefined,
        });

        // Stop cursor blinking
        this.stopCursorBlinking();

        // Remove global guards when leaving edit mode
        this.removeGlobalKeyGuards();
    };

    private readonly handleTextClick = (e: React.MouseEvent, moreProps: any) => {
        if (!this.state.isEditing) {
            return;
        }

        const { mouseXY } = moreProps;
        const canvasX = mouseXY[0];

        // Calculate character index at click position using canvas-relative coordinates
        const charIndex = this.getCharIndexAtX(canvasX, moreProps);

        this.setState(
            {
                cursorPosition: charIndex,
                selectionStart: undefined,
                selectionEnd: undefined,
            },
            () => {
                this.resetCursorBlink(); // Reset cursor blinking when clicking to position cursor
            },
        );
    };

    private readonly getCharIndexAtX = (canvasX: number, moreProps: any): number => {
        const { text } = this.state;
        if (!text) {
            return 0;
        }

        const { getCanvasContexts } = this.context;
        const contexts = getCanvasContexts!()!;
        const measurementCtx = getMouseCanvas(contexts);

        // Set font for accurate measurements
        const { fontFamily, fontSize, fontStyle, fontWeight } = this.props;

        measurementCtx!.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

        const currentTextWidth = measurementCtx!.measureText(text).width;
        const { x: textCenterX } = this.helper(moreProps, currentTextWidth);
        const textStartX = textCenterX - currentTextWidth / 2;
        const targetX = canvasX - textStartX;

        if (targetX <= 0) {
            return 0;
        }
        if (targetX >= currentTextWidth) {
            return text.length;
        }

        // Use grapheme clusters
        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
        const segments = Array.from(segmenter.segment(text));

        let accumulatedWidth = 0;
        let stringIndex = 0;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const segmentText = segment.segment;
            const segmentWidth = measurementCtx!.measureText(segmentText).width;

            if (targetX >= accumulatedWidth && targetX <= accumulatedWidth + segmentWidth / 2) {
                return stringIndex;
            }
            if (targetX > accumulatedWidth + segmentWidth / 2 && targetX <= accumulatedWidth + segmentWidth) {
                return stringIndex + segmentText.length;
            }

            accumulatedWidth += segmentWidth;
            stringIndex += segmentText.length;
        }
        return text.length;
    };

    // Helper function to move cursor left by one grapheme cluster
    private readonly moveCursorLeft = (text: string, currentPosition: number): number => {
        if (currentPosition <= 0) {
            return 0;
        }

        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
        const segments = Array.from(segmenter.segment(text));

        let stringIndex = 0;
        let prevStringIndex = 0;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const nextIndex = stringIndex + segment.segment.length;

            // If current position is at the start of this segment, go to start of previous segment
            if (stringIndex >= currentPosition) {
                return prevStringIndex;
            }
            // If current position is within this segment, go to start of this segment
            if (nextIndex > currentPosition) {
                return stringIndex;
            }

            prevStringIndex = stringIndex;
            stringIndex = nextIndex;
        }

        // If we're at the end, go to the start of the last segment
        return prevStringIndex;
    };

    // Helper function to move cursor right by one grapheme cluster
    private readonly moveCursorRight = (text: string, currentPosition: number): number => {
        if (currentPosition >= text.length) {
            return text.length;
        }

        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
        const segments = Array.from(segmenter.segment(text));

        let stringIndex = 0;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const nextIndex = stringIndex + segment.segment.length;

            // If current position is before or at the start of this segment, go to end of this segment
            if (stringIndex >= currentPosition) {
                return nextIndex;
            }
            // If current position is within this segment, go to end of this segment
            if (nextIndex > currentPosition) {
                return nextIndex;
            }

            stringIndex = nextIndex;
        }

        return text.length;
    };

    // Helper function to delete one grapheme cluster to the left (for backspace)
    private readonly deleteGraphemeLeft = (
        text: string,
        currentPosition: number,
    ): { newText: string; newPosition: number } => {
        if (currentPosition <= 0) {
            return { newText: text, newPosition: currentPosition };
        }

        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
        const segments = Array.from(segmenter.segment(text));

        let stringIndex = 0;
        let prevStringIndex = 0;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const nextIndex = stringIndex + segment.segment.length;

            // If current position is at the start of this segment, delete the previous segment
            if (stringIndex >= currentPosition) {
                if (i > 0) {
                    const prevSegment = segments[i - 1];
                    const prevSegmentEnd = prevStringIndex + prevSegment.segment.length;
                    const newText = text.slice(0, prevStringIndex) + text.slice(prevSegmentEnd);
                    return { newText, newPosition: prevStringIndex };
                }
                return { newText: text, newPosition: currentPosition };
            }
            // If current position is within this segment, delete this segment
            if (nextIndex > currentPosition) {
                const newText = text.slice(0, stringIndex) + text.slice(nextIndex);
                return { newText, newPosition: stringIndex };
            }

            prevStringIndex = stringIndex;
            stringIndex = nextIndex;
        }

        // If we're at the end, delete the last segment
        if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1];
            const lastSegmentStart = text.length - lastSegment.segment.length;
            const newText = text.slice(0, lastSegmentStart);
            return { newText, newPosition: lastSegmentStart };
        }

        // Fallback - delete one character
        return {
            newText: text.slice(0, currentPosition - 1) + text.slice(currentPosition),
            newPosition: currentPosition - 1,
        };
    };

    // Helper function to delete one grapheme cluster to the right (for delete key)
    private readonly deleteGraphemeRight = (
        text: string,
        currentPosition: number,
    ): { newText: string; newPosition: number } => {
        if (currentPosition >= text.length) {
            return { newText: text, newPosition: currentPosition };
        }

        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
        const segments = Array.from(segmenter.segment(text));

        let stringIndex = 0;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const nextIndex = stringIndex + segment.segment.length;

            // If current position is before or at the start of this segment, delete this segment
            if (stringIndex >= currentPosition) {
                const newText = text.slice(0, stringIndex) + text.slice(nextIndex);
                return { newText, newPosition: currentPosition };
            }
            // If current position is within this segment, delete this segment
            if (nextIndex > currentPosition) {
                const newText = text.slice(0, stringIndex) + text.slice(nextIndex);
                return { newText, newPosition: currentPosition };
            }

            stringIndex = nextIndex;
        }

        // Fallback - delete one character
        return {
            newText: text.slice(0, currentPosition) + text.slice(currentPosition + 1),
            newPosition: currentPosition,
        };
    };

    // Used for starting highlight selection with mouse down
    private readonly handleMouseDown = (e: React.MouseEvent, moreProps: any) => {
        if (!this.state.isEditing || !this.isHover(moreProps, e)) {
            return;
        }

        e.preventDefault();

        const { mouseXY } = moreProps;
        const canvasX = mouseXY[0];

        const charIndex = this.getCharIndexAtX(canvasX, moreProps);

        this.setState(
            {
                isSelectingWithMouse: true,
                cursorPosition: charIndex,
                selectionStart: charIndex,
                selectionEnd: charIndex,
            },
            () => {
                this.resetCursorBlink();
            },
        );
    };

    // Used for updating highlight selection when mouse move occurs while mouse is down
    private readonly handleMouseMove = (e: React.MouseEvent, moreProps: any) => {
        if (!this.state.isEditing) {
            return;
        }

        if (this.state.isSelectingWithMouse) {
            const { mouseXY } = moreProps;
            const canvasX = mouseXY[0];

            const charIndex = this.getCharIndexAtX(canvasX, moreProps);
            this.setState({
                cursorPosition: charIndex,
                selectionEnd: charIndex,
            });
        }
    };

    // Used for finishing highlight selection when mouse up occurs
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly handleMouseUp = (_e: React.MouseEvent, _moreProps: any) => {
        if (!this.state.isEditing) {
            return;
        }

        if (this.state.isSelectingWithMouse) {
            this.setState({ isSelectingWithMouse: false });

            if (this.state.selectionStart === this.state.selectionEnd) {
                this.setState({ selectionStart: undefined, selectionEnd: undefined });
            }
        }
    };

    private readonly handleKeyDown = async (e: React.KeyboardEvent, moreProps: any) => {
        if (!this.state.isEditing) {
            return;
        }

        const { text, cursorPosition, selectionStart, selectionEnd } = this.state;
        let newText = text;
        let newCursorPosition = cursorPosition;
        let newSelectionStart = selectionStart;
        let newSelectionEnd = selectionEnd;
        let preventDefault = true;

        const hasSelection =
            selectionStart !== undefined && selectionEnd !== undefined && selectionStart !== selectionEnd;

        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case "a":
                    // Select all text
                    newSelectionStart = 0;
                    newSelectionEnd = text.length;
                    newCursorPosition = text.length;
                    break;
                case "c":
                    this.handleCopy();
                    break;
                case "x":
                    if (hasSelection) {
                        const start = Math.min(selectionStart, selectionEnd);
                        const end = Math.max(selectionStart, selectionEnd);
                        const selectedText = text.substring(start, end);

                        if (selectedText) {
                            const newSelection = this.deleteSelectedText();
                            newText = newSelection.newText;
                            newSelectionStart = undefined;
                            newSelectionEnd = undefined;
                            newCursorPosition = newSelection.newCursorPosition;
                            this.handleCut(selectedText);
                        }
                    }
                    break;
                case "v": {
                    const newSelection = await this.handlePaste();
                    newText = newSelection?.newText || "";
                    newSelectionStart = undefined;
                    newSelectionEnd = undefined;
                    newCursorPosition = newSelection?.newCursorPosition || 0;
                    break;
                }
                default:
                    preventDefault = false;
            }
        } else {
            switch (e.key) {
                case "Backspace":
                    if (hasSelection) {
                        const result = this.deleteSelectedText();
                        newText = result.newText;
                        newCursorPosition = result.newCursorPosition;
                        newSelectionStart = undefined;
                        newSelectionEnd = undefined;
                    } else if (cursorPosition > 0) {
                        const result = this.deleteGraphemeLeft(text, cursorPosition);
                        newText = result.newText;
                        newCursorPosition = result.newPosition;
                    }
                    break;
                case "Delete":
                    if (hasSelection) {
                        const result = this.deleteSelectedText();
                        newText = result.newText;
                        newCursorPosition = result.newCursorPosition;
                        newSelectionStart = undefined;
                        newSelectionEnd = undefined;
                    } else if (cursorPosition < text.length) {
                        const result = this.deleteGraphemeRight(text, cursorPosition);
                        newText = result.newText;
                        newCursorPosition = result.newPosition;
                    }

                    break;
                case "Escape":
                    // End editing and prevent external handlers (like deselect/delete) from acting
                    this.endEditing(moreProps);
                    break;
                case "ArrowLeft":
                    if (e.shiftKey) {
                        // Extend selection to the left
                        if (newSelectionStart === undefined) {
                            newSelectionStart = cursorPosition;
                        }
                        newCursorPosition = this.moveCursorLeft(text, cursorPosition);
                        newSelectionEnd = newCursorPosition;
                    } else {
                        // Move cursor or collapse selection
                        newCursorPosition = hasSelection
                            ? Math.min(selectionStart!, selectionEnd!)
                            : this.moveCursorLeft(text, cursorPosition);
                        newSelectionStart = undefined;
                        newSelectionEnd = undefined;
                    }
                    break;
                case "ArrowRight":
                    if (e.shiftKey) {
                        // Extend selection to the right
                        if (newSelectionStart === undefined) {
                            newSelectionStart = cursorPosition;
                        }
                        newCursorPosition = this.moveCursorRight(text, cursorPosition);
                        newSelectionEnd = newCursorPosition;
                    } else {
                        // Move cursor or collapse selection
                        newCursorPosition = hasSelection
                            ? Math.max(selectionStart!, selectionEnd!)
                            : this.moveCursorRight(text, cursorPosition);
                        newSelectionStart = undefined;
                        newSelectionEnd = undefined;
                    }
                    break;
                case "Home":
                    if (e.shiftKey) {
                        if (newSelectionStart === undefined) {
                            newSelectionStart = cursorPosition;
                        }
                        newSelectionEnd = 0;
                    } else {
                        newSelectionStart = undefined;
                        newSelectionEnd = undefined;
                    }
                    newCursorPosition = 0;
                    break;
                case "End":
                    if (e.shiftKey) {
                        if (newSelectionStart === undefined) {
                            newSelectionStart = cursorPosition;
                        }
                        newSelectionEnd = text.length;
                    } else {
                        newSelectionStart = undefined;
                        newSelectionEnd = undefined;
                    }
                    newCursorPosition = text.length;
                    break;
                case "Enter":
                    this.endEditing(moreProps);
                    break;
                default:
                    if (e.key.length === 1 && !e.altKey) {
                        if (hasSelection) {
                            const result = this.deleteSelectedText();
                            newText = result.newText;
                            newCursorPosition = result.newCursorPosition;
                            newSelectionStart = undefined;
                            newSelectionEnd = undefined;
                        }
                        newText = newText.slice(0, newCursorPosition) + e.key + newText.slice(newCursorPosition);
                        newCursorPosition++;
                    } else {
                        preventDefault = false;
                    }
                    break;
            }
        }

        if (preventDefault) {
            e.preventDefault();

            this.setState(
                {
                    text: newText,
                    cursorPosition: newCursorPosition,
                    selectionStart: newSelectionStart,
                    selectionEnd: newSelectionEnd,
                },
                () => {
                    this.resetCursorBlink(); // Reset cursor blinking on any key action
                },
            );
        }
    };

    // Add a capture-phase keyup listener while editing to stop the component from being
    // Deleted while being edited
    private addGlobalKeyGuards = () => {
        if (!this.boundGlobalKeyUp) {
            this.boundGlobalKeyUp = (evt: KeyboardEvent) => {
                if (!this.state.isEditing) {
                    return;
                }
                const k = evt.key;
                if (k === "Backspace" || k === "Delete") {
                    // Stop other key handlers from seeing this while editing
                    evt.stopImmediatePropagation();
                    evt.stopPropagation();
                    evt.preventDefault();
                }
            };
            // Use capture so we can intercept before document-level listeners in apps/stories
            document.addEventListener("keyup", this.boundGlobalKeyUp, true);
        }
    };

    private removeGlobalKeyGuards = () => {
        if (this.boundGlobalKeyUp) {
            document.removeEventListener("keyup", this.boundGlobalKeyUp, true);
            this.boundGlobalKeyUp = undefined;
        }
    };

    private deleteSelectedText = (): { newText: string; newCursorPosition: number } => {
        const { text, selectionStart, selectionEnd } = this.state;

        if (selectionStart === undefined || selectionEnd === undefined || selectionStart === selectionEnd) {
            return { newText: text, newCursorPosition: this.state.cursorPosition };
        }

        const start = Math.min(selectionStart, selectionEnd);
        const end = Math.max(selectionStart, selectionEnd);
        const newTextValue = text.substring(0, start) + text.substring(end);

        return { newText: newTextValue, newCursorPosition: start };
    };

    private handleCopy = async () => {
        const { text, selectionStart, selectionEnd } = this.state;

        if (selectionStart !== undefined && selectionEnd !== undefined && selectionStart !== selectionEnd) {
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            const selectedText = text.substring(start, end);

            if (selectedText && navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(selectedText);
            }
        }
    };

    private handleCut = async (selectedText: string) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(selectedText);
        }
    };

    private handlePaste = async (): Promise<{ newText: string; newCursorPosition: number } | undefined> => {
        if (navigator.clipboard && navigator.clipboard.readText) {
            const textToPaste = await navigator.clipboard.readText();

            if (textToPaste) {
                const { text, cursorPosition, selectionStart, selectionEnd } = this.state;
                let newText = text;
                let newCursorPosition = cursorPosition;

                if (selectionStart !== undefined && selectionEnd !== undefined && selectionStart !== selectionEnd) {
                    const { newText: textAfterDelete, newCursorPosition: positionAfterDelete } =
                        this.deleteSelectedText();
                    newText = textAfterDelete;
                    newCursorPosition = positionAfterDelete;
                }

                newText = newText.slice(0, newCursorPosition) + textToPaste + newText.slice(newCursorPosition);
                newCursorPosition += textToPaste.length;

                return { newText: newText, newCursorPosition: newCursorPosition };
            }
        }
        return undefined;
    };

    private startCursorBlinking = () => {
        this.stopCursorBlinking(); // Clear any existing interval
        this.setState({ cursorVisible: true }); // Start with cursor visible
        this.cursorBlinkInterval = window.setInterval(() => {
            this.setState((prevState) => ({ cursorVisible: !prevState.cursorVisible }));
        }, 400); // Blink every 400ms
    };

    private stopCursorBlinking = () => {
        if (this.cursorBlinkInterval !== null) {
            clearInterval(this.cursorBlinkInterval);
            this.cursorBlinkInterval = undefined;
        }
        this.setState({ cursorVisible: true }); // Reset to visible when not editing
    };

    private resetCursorBlink = () => {
        if (this.state.isEditing) {
            this.setState({ cursorVisible: true }); // Show cursor immediately
            this.startCursorBlinking(); // Restart the blinking cycle
        }
    };

    private readonly handleDoubleClick = (e: React.MouseEvent, moreProps?: any) => {
        const { onDoubleClick } = this.props;
        const { text } = this.state;

        if (!this.state.isEditing) {
            // Start editing
            this.startEditing(e, moreProps);
        }

        // Select all text on double click
        this.setState(
            {
                cursorPosition: text.length,
                selectionStart: 0,
                selectionEnd: text.length,
            },
            () => {
                this.resetCursorBlink();
            },
        );

        if (onDoubleClick !== undefined) {
            onDoubleClick(e, moreProps);
        }
    };

    public render() {
        const { onDragStart, onDrag, onDragComplete, onHover, onUnHover, interactiveCursorClass } = this.props;
        const { isEditing } = this.state;

        // Use different drag handlers when editing
        const dragHandlers = isEditing
            ? {
                  onDrag: this.handleMouseMove,
                  onDragComplete: this.handleMouseUp,
              }
            : {
                  onDragStart,
                  onDrag,
                  onDragComplete,
              };

        // Use text cursor when editing, move cursor when not editing
        const cursorClass = isEditing ? "reincharts-text-cursor" : interactiveCursorClass;

        return (
            <GenericChartComponent
                isHover={this.isHover}
                canvasToDraw={getMouseCanvas}
                canvasDraw={this.drawOnCanvas}
                onClick={this.handleClick}
                {...dragHandlers}
                onDoubleClickWhenHover={this.handleDoubleClick}
                onHover={onHover}
                onUnHover={onUnHover}
                onMouseDownWhenHover={this.handleMouseDown}
                onKeyDown={this.handleKeyDown}
                drawOn={["mousemove", "pan", "drag", "keydown"]}
                interactiveCursorClass={cursorClass}
                selected={this.props.selected || this.state.isEditing}
            />
        );
    }
}
EditableText.contextType = ChartCanvasContext;
