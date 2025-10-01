import { ScaleContinuousNumeric } from "d3-scale";
import type { ChartConfig } from "./utils/ChartDataUtil";

export interface MoreProps {
    /**
     * The unique identifier for the current chart instance.
     */
    chartId: string | number;
    /**
     * True if the mouse is currently hovering over the chart area.
     */
    hovering: boolean;
    /**
     * Array of chart IDs that the mouse is currently over (for multi-chart layouts).
     */
    currentCharts: (string | number)[];
    /**
     * The starting [x, y] position for mouse interactions (e.g., drag start), relative to the chart's origin.
     */
    startPos?: [number, number];
    /**
     * The current [x, y] mouse coordinates, relative to the chart's origin.
     */
    mouseXY?: [number, number];
    /**
     * All chart configuration objects in the ChartCanvas (for multi-chart support).
     */
    chartConfigs: ChartConfig[];
    /**
     * The configuration object for the current chart, derived from chartConfigs using chartId.
     */
    chartConfig?: ChartConfig;
    /**
     * The complete, unfiltered dataset for the chart(s).
     */
    fullData: any[];
    /**
     * The subset of data currently visible or plotted on the chart (after zoom/pan/filtering).
     */
    plotData: any[];
    /**
     * Function to access the x value from a data point. Used to extract the x-coordinate value from each data object.
     */
    xAccessor: (data: any) => any;
    /**
     * The scale function for the x-axis (typically a d3 scale). Maps domain values to pixel coordinates.
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    xScale: Function;
    /**
     * The scale function for the y-axis (typically a d3 scale), if available for the current chart.
     * Maps domain values to pixel coordinates.
     */
    yScale?: ScaleContinuousNumeric<number, number>;
}
