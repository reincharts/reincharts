import { getAxisCanvas, GenericChartComponent } from "@reincharts/core";
import { ScaleContinuousNumeric, ScaleTime } from "d3-scale";
import * as React from "react";
import { drawOnCanvasHelper, identityStack, StackedBarSeries } from "./StackedBarSeries";

export interface GroupedBarSeriesProps {
    /** Function or number for the base of the bars. */
    readonly baseAt:
        | number
        | ((
              xScale: ScaleContinuousNumeric<number, number> | ScaleTime<number, number>,
              yScale: ScaleContinuousNumeric<number, number>,
              data: any,
          ) => number);
    /** Direction the bars grow from the base. */
    readonly direction: "up" | "down";
    /** Fill color for the bars, can be static or function based on data. */
    readonly fillStyle?: string | ((data: any) => string);
    /** Space between bars in pixels. */
    readonly spaceBetweenBar?: number;
    /** Whether to show stroke outline on bars. */
    readonly stroke: boolean;
    /** Ratio of bar width to available space. */
    readonly widthRatio?: number;
    /** Data accessor function(s) for y-values. Can be single function or array of functions for multiple groups. */
    readonly yAccessor: ((data: any) => number | undefined) | ((d: any) => number)[];
}

export class GroupedBarSeries extends React.Component<GroupedBarSeriesProps> {
    public static defaultProps = {
        ...StackedBarSeries.defaultProps,
        spaceBetweenBar: 5,
        widthRatio: 0.8,
    };

    public render() {
        return <GenericChartComponent canvasDraw={this.drawOnCanvas} canvasToDraw={getAxisCanvas} drawOn={["pan"]} />;
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { xAccessor } = moreProps;

        drawOnCanvasHelper(ctx, this.props, moreProps, xAccessor, identityStack, this.postProcessor);
    };

    private readonly postProcessor = (array: any[]) => {
        return array.map((each) => {
            return {
                ...each,
                x: each.x + each.offset - each.groupOffset,
                width: each.groupWidth,
            };
        });
    };
}
