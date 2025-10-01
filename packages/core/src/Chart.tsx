import { ScaleContinuousNumeric } from "d3-scale";
import * as React from "react";
import { ChartCanvasContext, chartCanvasContextDefaultValue, ChartCanvasContextType } from "./ChartCanvas";
import type { ChartConfig } from "./utils/ChartDataUtil";

export type ChartContextType = Omit<ChartCanvasContextType<number | Date>, "chartConfig"> & {
    chartConfig: ChartConfig;
};
export const ChartContext = React.createContext<ChartContextType>({
    ...chartCanvasContextDefaultValue,
    // @ts-ignore
    chartConfig: {},
    chartId: 0,
});

export interface ChartProps {
    /** Whether to flip the Y scale direction. */
    readonly flipYScale?: boolean;
    /** Height of the chart or function to calculate height. */
    readonly height?: number | ((height: number) => number);
    /** Unique identifier for the chart. */
    readonly id: number | string;
    /** Context menu event handler. */
    readonly onContextMenu?: (event: React.MouseEvent, moreProps: any) => void;
    /** Double click event handler. */
    readonly onDoubleClick?: (event: React.MouseEvent, moreProps: any) => void;
    /** Origin position of the chart. */
    readonly origin?: number[] | ((width: number, height: number, chartHeight: number) => number[]);
    /** Padding around the chart content. */
    readonly padding?: number | { top: number; bottom: number };
    /**
     * Y extents for the chart scale. Accepts:
     * - a static number array to set a fixed domain,
     * - a function returning a single number for each data point, to compute a dynamic domain,
     * - a function returning an array of numbers (e.g., [low, high]) to include multiple values per data point.
     */
    readonly yExtents?: number[] | ((data: any) => number) | ((data: any) => number[]);
    /** Custom Y extents calculator function. */
    readonly yExtentsCalculator?: (options: {
        plotData: any[];
        xDomain: any;
        xAccessor: any;
        displayXAccessor: any;
        fullData: any[];
    }) => number[];
    /** Whether Y panning is enabled. */
    readonly yPan?: boolean;
    /** Whether Y pan is currently enabled. */
    readonly yPanEnabled?: boolean;
    /** Y scale instance to use. */
    readonly yScale?: ScaleContinuousNumeric<number, number>;
}

export const Chart = React.memo((props: React.PropsWithChildren<ChartProps>) => {
    const {
        // flipYScale = false,
        id = 0,
        // origin = [0, 0],
        // padding = 0,
        // yPan = true,
        // yPanEnabled = false,
        // yScale = scaleLinear(),
        onContextMenu,
        onDoubleClick,
    } = props;

    const chartCanvasContextValue = React.useContext(ChartCanvasContext);
    const { subscribe, unsubscribe, chartConfigs } = chartCanvasContextValue;

    const listener = React.useCallback(
        (type: string, moreProps: any, _: any, e: React.MouseEvent) => {
            switch (type) {
                case "contextmenu": {
                    if (onContextMenu === undefined) {
                        return;
                    }

                    const { currentCharts } = moreProps;
                    if (currentCharts.indexOf(id) > -1) {
                        onContextMenu(e, moreProps);
                    }

                    break;
                }
                case "dblclick": {
                    if (onDoubleClick === undefined) {
                        return;
                    }

                    const { currentCharts } = moreProps;
                    if (currentCharts.indexOf(id) > -1) {
                        onDoubleClick(e, moreProps);
                    }

                    break;
                }
            }
        },
        [onContextMenu, onDoubleClick, id],
    );

    React.useEffect(() => {
        subscribe(`chart_${id}`, {
            listener,
        });
        return () => unsubscribe(`chart_${id}`);
    }, [subscribe, unsubscribe, id, listener]);

    const config = chartConfigs.find(({ id }) => id === props.id)!;
    const contextValue = React.useMemo(() => {
        return {
            ...chartCanvasContextValue,
            chartId: id,
            chartConfig: config,
        };
    }, [id, config, chartCanvasContextValue]);

    const {
        origin: [x, y],
    } = config;

    return (
        <ChartContext.Provider value={contextValue}>
            <g transform={`translate(${x}, ${y})`} id={`chart_${id}`}>
                {props.children}
            </g>
        </ChartContext.Provider>
    );
});

Chart.displayName = "Chart";
