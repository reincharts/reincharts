import { heikinAshi, kagi, lineBreak, pointAndFigure, renko } from "@reincharts/indicators";
import {
    AreaSeries,
    BaselineSeries,
    CandlestickSeries,
    ColumnsSeries,
    HLCAreaSeries,
    KagiSeries,
    LineBreakSeries,
    LineSeries,
    OHLCSeries,
    PointAndFigureSeries,
    RenkoSeries,
} from "@reincharts/series";
import * as React from "react";
import type { ChartType } from "./state";

/** Describes one chart type of the chart type menu. */
export interface ChartTypeInfo {
    /** Chart type id (stored in the state). */
    readonly id: ChartType;
    /** Menu label. */
    readonly label: string;
    /** Turns OHLCV bars into the bars the series draws (Heikin Ashi, renko bricks...). */
    readonly transform?: (data: readonly any[]) => any[];
    /** False when the transform builds new, irregular bars (renko, kagi...): compare and time ranges are disabled. */
    readonly timeBased: boolean;
    /** Menu group. */
    readonly group: "bars" | "lines" | "other";
}

/** Every chart type, in menu order. */
export const CHART_TYPES: readonly ChartTypeInfo[] = [
    { id: "bars", label: "Bars", timeBased: true, group: "bars" },
    { id: "candles", label: "Candles", timeBased: true, group: "bars" },
    { id: "hollowCandles", label: "Hollow candles", timeBased: true, group: "bars" },
    { id: "heikinAshi", label: "Heikin Ashi", transform: (d) => heikinAshi(d), timeBased: true, group: "bars" },
    { id: "columns", label: "Columns", timeBased: true, group: "bars" },
    { id: "line", label: "Line", timeBased: true, group: "lines" },
    { id: "stepLine", label: "Step line", timeBased: true, group: "lines" },
    { id: "area", label: "Area", timeBased: true, group: "lines" },
    { id: "hlcArea", label: "HLC area", timeBased: true, group: "lines" },
    { id: "baseline", label: "Baseline", timeBased: true, group: "lines" },
    { id: "renko", label: "Renko", transform: (d) => renko(d), timeBased: false, group: "other" },
    { id: "lineBreak", label: "Line break", transform: (d) => lineBreak(d), timeBased: false, group: "other" },
    { id: "kagi", label: "Kagi", transform: (d) => kagi(d), timeBased: false, group: "other" },
    {
        id: "pointAndFigure",
        label: "Point & figure",
        transform: (d) => pointAndFigure(d),
        timeBased: false,
        group: "other",
    },
];

const byId = new Map(CHART_TYPES.map((t) => [t.id, t]));

/** Info of a chart type (candles for unknown ids). */
export const chartTypeInfo = (id: ChartType): ChartTypeInfo => byId.get(id) ?? byId.get("candles")!;

/** Chart data for a chart type: the bars unchanged, or the transform's new bars. */
export const chartData = (type: ChartType, data: readonly any[]): readonly any[] => {
    const transform = chartTypeInfo(type).transform;
    return transform && data.length ? transform(data) : data;
};

/**
 * Key that changes when the chart data stops being 1:1 with the source bars (resets the view).
 * Switching between candles, line, Heikin Ashi... keeps the view.
 */
export const dataFamily = (type: ChartType) => (chartTypeInfo(type).transform && type !== "heikinAshi" ? type : "bars");

/** Props passed to the main series. */
export interface MainSeriesProps {
    /** Chart type to draw. */
    readonly type: ChartType;
    /** Legend name (the symbol). */
    readonly name: string;
    /** Draw the series. Default true. */
    readonly visible?: boolean;
    /** Drawing order in the pane. Default 0. */
    readonly zIndex?: number;
}

/** The main series element for a chart type. */
export function MainSeries({ type, ...props }: MainSeriesProps): React.ReactElement {
    const h = React.createElement;
    switch (type) {
        case "hollowCandles":
            return h(CandlestickSeries, { ...props, hollow: true });
        case "bars":
            return h(OHLCSeries, props);
        case "line":
            return h(LineSeries, props);
        case "stepLine":
            return h(LineSeries, { ...props, curve: "step" });
        case "area":
            return h(AreaSeries, props);
        case "baseline":
            return h(BaselineSeries, props);
        case "columns":
            return h(ColumnsSeries, props);
        case "hlcArea":
            return h(HLCAreaSeries, props);
        case "renko":
            return h(RenkoSeries, props);
        case "lineBreak":
            return h(LineBreakSeries, props);
        case "kagi":
            return h(KagiSeries, props);
        case "pointAndFigure":
            return h(PointAndFigureSeries, props);
        default:
            return h(CandlestickSeries, props);
    }
}
