import { pairs } from "d3-array";
import * as React from "react";
import { generateLine, isHoveringBasic } from "./InteractiveStraightLine";
import { isDefined, isNotDefined, getMouseCanvas, GenericChartComponent } from "@reincharts/core";

export interface GannFanProps {
    /** Starting X,Y coordinates for the Gann Fan origin point. */
    readonly startXY: number[];
    /** Optional CSS class name for styling the Gann Fan. */
    readonly defaultClassName?: string;
    /** Ending X,Y coordinates that define the Gann Fan angle and extent. */
    readonly endXY: number[];
    /** Array of fill colors for the Gann Fan areas between angle lines. */
    readonly fillStyle: Array<string>;
    /** Font family for the Gann Fan angle labels. */
    readonly fontFamily: string;
    /** Font size for the Gann Fan angle labels. */
    readonly fontSize: number;
    /** Fill color for the Gann Fan angle labels. */
    readonly fontFill: string;
    /** CSS cursor class to show when the Gann Fan is interactive. */
    readonly interactiveCursorClass?: string;
    /** Callback fired when dragging of the Gann Fan starts. */
    readonly onDragStart?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when the Gann Fan is being dragged. */
    readonly onDrag?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when dragging of the Gann Fan is completed. */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when the mouse hovers over the Gann Fan. */
    readonly onHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Callback fired when the mouse stops hovering over the Gann Fan. */
    readonly onUnHover?: (e: React.MouseEvent, moreProps: any) => void;
    /** Whether this Gann Fan is currently selected. */
    readonly selected: boolean;
    /** Stroke color for the Gann Fan angle lines. */
    readonly strokeStyle: string;
    /** Width of the Gann Fan angle lines. */
    readonly strokeWidth: number;
    /** Tolerance in pixels for hover and click detection. */
    readonly tolerance: number;
}

export class GannFan extends React.Component<GannFanProps> {
    public static defaultProps = {
        strokeWidth: 1,
        tolerance: 4,
        selected: false,
    };

    public render() {
        const { selected, interactiveCursorClass } = this.props;
        const { onDragStart, onDrag, onDragComplete, onHover, onUnHover } = this.props;

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
                onHover={onHover}
                onUnHover={onUnHover}
                drawOn={["mousemove", "mouseleave", "pan", "drag", "keydown"]}
            />
        );
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { strokeStyle, strokeWidth, fillStyle, fontFamily, fontSize, fontFill } = this.props;

        const lines = this.helper(this.props, moreProps);

        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = fontFill;

        lines.forEach((line) => {
            const { x1, y1, x2, y2, label } = line;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.beginPath();
            ctx.fillText(label.text, label.x, label.y);
        });
        const pairsOfLines = pairs(lines);

        pairsOfLines.forEach(([line1, line2], idx) => {
            ctx.fillStyle = fillStyle[idx];

            ctx.beginPath();
            ctx.moveTo(line1.x1, line1.y1);
            ctx.lineTo(line1.x2, line1.y2);
            ctx.lineTo(line2.x2, line2.y2);
            ctx.closePath();
            ctx.fill();
        });
    };

    private readonly isHover = (moreProps: any) => {
        const { tolerance, onHover } = this.props;
        const { mouseXY } = moreProps;
        const [mouseX, mouseY] = mouseXY;

        let hovering = false;
        if (isDefined(onHover)) {
            const lines = this.helper(this.props, moreProps);

            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < lines.length; i++) {
                const line1 = lines[i];

                const left = Math.min(line1.x1, line1.x2);
                const right = Math.max(line1.x1, line1.x2);
                const top = Math.min(line1.y1, line1.y2);
                const bottom = Math.max(line1.y1, line1.y2);

                const isWithinLineBounds = mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom;

                hovering =
                    isWithinLineBounds &&
                    isHoveringBasic([line1.x1, line1.y1], [line1.x2, line1.y2], mouseXY, tolerance);

                if (hovering) {
                    break;
                }
            }
        }
        return hovering;
    };

    private readonly getLineCoordinates = (start: number[], endX: number, endY: number, text: string) => {
        const end = [endX, endY];
        return {
            start,
            end,
            text,
        };
    };

    private readonly helper = (props: GannFanProps, moreProps: any) => {
        const { startXY, endXY } = props;

        const {
            xScale,
            chartConfig: { yScale },
        } = moreProps;
        if (isNotDefined(startXY) || isNotDefined(endXY)) {
            return [];
        }
        const [x1, y1] = startXY;
        const [x2, y2] = endXY;

        const dx = x2 - x1;
        const dy = y2 - y1;

        if (dx !== 0 && dy !== 0) {
            const halfY = this.getLineCoordinates(startXY, x2, y1 + dy / 2, "2/1");
            const oneThirdY = this.getLineCoordinates(startXY, x2, y1 + dy / 3, "3/1");
            const oneFourthY = this.getLineCoordinates(startXY, x2, y1 + dy / 4, "4/1");
            const oneEighthY = this.getLineCoordinates(startXY, x2, y1 + dy / 8, "8/1");
            const halfX = this.getLineCoordinates(startXY, x1 + dx / 2, y2, "1/2");
            const oneThirdX = this.getLineCoordinates(startXY, x1 + dx / 3, y2, "1/3");
            const oneFourthX = this.getLineCoordinates(startXY, x1 + dx / 4, y2, "1/4");
            const oneEighthX = this.getLineCoordinates(startXY, x1 + dx / 8, y2, "1/8");
            const lines = [
                oneEighthX,
                oneFourthX,
                oneThirdX,
                halfX,
                { start: startXY, end: endXY, text: "1/1" },
                halfY,
                oneThirdY,
                oneFourthY,
                oneEighthY,
            ];
            const lineCoods = lines.map((line) => {
                // tslint:disable-next-line: no-shadowed-variable
                const { x1, y1, x2, y2 } = generateLine({
                    type: "RAY",
                    start: line.start,
                    end: line.end,
                    xScale,
                    yScale,
                });
                return {
                    x1: xScale(x1),
                    y1: yScale(y1),
                    x2: xScale(x2),
                    y2: yScale(y2),
                    label: {
                        x: xScale(line.end[0]),
                        y: yScale(line.end[1]),
                        text: line.text,
                    },
                };
            });
            return lineCoods;
        }
        return [];
    };
}
