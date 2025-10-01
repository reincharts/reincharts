import * as React from "react";
import { getMouseCanvas, GenericChartComponent } from "@reincharts/core";

export interface TextProps {
    /** Text content to display. */
    readonly children: string;
    /** Font family for the text. */
    readonly fontFamily: string;
    /** Font size for the text. */
    readonly fontSize: number;
    /** Fill color for the text. */
    readonly fillStyle: string;
    /** Whether the text is currently selected. */
    readonly selected?: boolean;
    /** Function that provides the [x, y] coordinates for positioning the text. */
    readonly xyProvider: (moreProps: any) => number[];
}

export class Text extends React.Component<TextProps> {
    public static defaultProps = {
        selected: false,
    };

    public render() {
        const { selected } = this.props;

        return (
            <GenericChartComponent
                isHover={this.isHover}
                selected={selected}
                canvasToDraw={getMouseCanvas}
                canvasDraw={this.drawOnCanvas}
                drawOn={["mousemove", "pan", "drag", "keydown"]}
            />
        );
    }

    private readonly isHover = () => {
        return false;
    };

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { xyProvider, fontFamily, fontSize, fillStyle, children } = this.props;

        const [x, y] = xyProvider(moreProps);

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = fillStyle;

        ctx.beginPath();
        ctx.fillText(children, x, y);
    };
}
