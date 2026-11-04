import { accessor, type Accessor, type Theme } from "@reincharts/core";
import { useBars, type BarLayout, type BarStyleProps } from "./bars";
import type { SeriesProps } from "./useSeries";

export interface MultiBarProps<T = any> extends SeriesProps, BarStyleProps {
    /** One accessor per bar of a datum, e.g. `["apples", "pears"]`. */
    readonly ys: readonly Accessor<T, number | undefined>[];
    /** Color per accessor. Defaults to the theme palette. */
    readonly colors?: readonly string[];
    /** Legend label per accessor. */
    readonly names?: readonly string[];
    /** Value bars grow from. Default 0. */
    readonly base?: number;
}

export interface GroupedBarSeriesProps<T = any> extends MultiBarProps<T> {
    /** Gap between the bars of a group in pixels. Default 2. */
    readonly gap?: number;
}

export interface StackedBarSeriesProps<T = any> extends MultiBarProps<T> {
    /** "percent" normalises each stack to 100. Default "none". */
    readonly offset?: "none" | "percent";
}

export type OverlayBarSeriesProps<T = any> = MultiBarProps<T>;

/** Palette color for value k. */
export const paletteColor = (colors: readonly string[] | undefined, k: number, theme: Theme) =>
    colors?.[k] ?? theme.palette[k % theme.palette.length];

export const useMultiBars = <T,>(
    layout: BarLayout,
    horizontal: boolean,
    { ys, colors, base = 0, ...rest }: StackedBarSeriesProps<T> & GroupedBarSeriesProps<T>,
) =>
    useBars<T>({
        ...rest,
        layout,
        horizontal,
        ys: ys.map((y) => accessor(y)),
        base,
        color: (k, _d, _i, theme) => paletteColor(colors, k, theme),
    });

/** Several bars side by side per x slot (category or bar). */
export function GroupedBarSeries<T = any>(props: GroupedBarSeriesProps<T>) {
    useMultiBars("grouped", false, props);
    return null;
}

/** Bars stacked on top of each other per x slot (negative values stack downwards). */
export function StackedBarSeries<T = any>(props: StackedBarSeriesProps<T>) {
    useMultiBars("stacked", false, props);
    return null;
}

/** Several bars drawn over each other from the same base, largest at the back. */
export function OverlayBarSeries<T = any>(props: OverlayBarSeriesProps<T>) {
    useMultiBars("overlay", false, props);
    return null;
}
