import { accessor, type Accessor } from "@reincharts/core";
import { useBars, type BarColor, type BarStyleProps } from "./bars";
import { resolveColor } from "./BarSeries";
import { useMultiBars, type GroupedBarSeriesProps, type StackedBarSeriesProps } from "./MultiBarSeries";
import type { SeriesProps } from "./useSeries";

export interface HorizontalBarSeriesProps<T = any> extends SeriesProps, BarStyleProps {
    /** Value accessor (bar length along the x axis). */
    readonly x: Accessor<T, number | undefined>;
    /** Per-bar start value (floating / range bars, e.g. Gantt). Overrides `base`. */
    readonly x0?: Accessor<T, number | undefined>;
    /** Value bars grow from. Default 0. */
    readonly base?: number;
    /** Bar color, static or per bar. Defaults to theme.line. */
    readonly fill?: BarColor<T>;
}

/**
 * Horizontal bars. Datum i is drawn in category band i of a category price scale, so use it with
 * `<ChartCanvas xMode="linear">` and `<Pane scales={{ right: { categories: data.map((d) => d.label) } }}>`.
 * Hovering a band selects its datum; the x axis autoscale includes the bars.
 */
export function HorizontalBarSeries<T = any>({ x, x0, base = 0, fill, ...rest }: HorizontalBarSeriesProps<T>) {
    useBars<T>({
        ...rest,
        layout: "single",
        horizontal: true,
        ys: [accessor(x)],
        y0: accessor(x0),
        base,
        color: (_k, d, i, theme) => resolveColor(fill, d, i, theme),
    });
    return null;
}

/** Grouped horizontal bars: `ys` holds one accessor per bar of a category (see `HorizontalBarSeries` for the setup). */
export function GroupedHorizontalBarSeries<T = any>(props: GroupedBarSeriesProps<T>) {
    useMultiBars("grouped", true, props);
    return null;
}

/** Stacked horizontal bars: `ys` holds one accessor per segment (see `HorizontalBarSeries` for the setup). */
export function StackedHorizontalBarSeries<T = any>(props: StackedBarSeriesProps<T>) {
    useMultiBars("stacked", true, props);
    return null;
}
