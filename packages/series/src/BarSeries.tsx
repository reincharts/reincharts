import { accessor, useChart, type Accessor, type Theme } from "@reincharts/core";
import { useBars, type BarColor, type BarStyleProps } from "./bars";
import type { SeriesProps } from "./useSeries";

export interface BarSeriesProps<T = any> extends SeriesProps, BarStyleProps {
    /** Value accessor (bar end). */
    readonly y: Accessor<T, number | undefined>;
    /** Per-bar start value (floating / range bars). Overrides `base`. */
    readonly y0?: Accessor<T, number | undefined>;
    /** Value bars grow from, or "bottom" for the bottom edge of the pane. Default 0. */
    readonly base?: number | "bottom";
    /** Bar color, static or per bar (receives the theme). Defaults to theme.line. */
    readonly fill?: BarColor<T>;
}

/** Resolves a `BarColor` (static or per bar) for a datum, falling back to `theme.line`. */
export const resolveColor = <T,>(
    fill: BarColor<T> | undefined,
    d: T,
    i: number,
    theme: Theme,
    fallback = theme.line,
) => (fill === undefined ? fallback : typeof fill === "function" ? fill(d, i, theme) : fill);

/** Vertical bars from a base value (histograms, column charts, MACD histograms...). */
export function BarSeries<T = any>({ y, y0, base = 0, fill, ...rest }: BarSeriesProps<T>) {
    useBars<T>({
        ...rest,
        layout: "single",
        horizontal: false,
        ys: [accessor(y)],
        y0: accessor(y0),
        base,
        color: (_k, d, i, theme) => resolveColor(fill, d, i, theme),
    });
    return null;
}

export interface VolumeSeriesProps<T = any> extends SeriesProps, BarStyleProps {
    /** Volume accessor. Default "volume". */
    readonly y?: Accessor<T, number | undefined>;
    /** Open accessor used for the up / down color. Default "open". */
    readonly open?: Accessor<T>;
    /** Close accessor used for the up / down color. Default "close". */
    readonly close?: Accessor<T>;
    /** Color of rising bars. Defaults to theme.volume.up. */
    readonly upColor?: string;
    /** Color of falling bars. Defaults to theme.volume.down. */
    readonly downColor?: string;
}

/**
 * Volume histogram colored by candle direction. To overlay it in the price pane, give it its own scale
 * and push it to the bottom: `<Pane scales={{ volume: { margins: { top: 0.8, bottom: 0 } } }}>` +
 * `<VolumeSeries scale="volume" />`.
 */
export function VolumeSeries<T = any>({
    y = "volume" as Accessor<T, number | undefined>,
    open = "open" as Accessor<T>,
    close = "close" as Accessor<T>,
    upColor,
    downColor,
    name = "Volume",
    widthRatio = 0.8,
    ...rest
}: VolumeSeriesProps<T>) {
    const o = accessor(open);
    const c = accessor(close);
    return (
        <BarSeries<T>
            {...rest}
            name={name}
            y={y}
            widthRatio={widthRatio}
            fill={(d, i, theme) =>
                c(d, i) >= o(d, i) ? (upColor ?? theme.volume.up) : (downColor ?? theme.volume.down)
            }
        />
    );
}

export interface ColumnsSeriesProps<T = any> extends SeriesProps, BarStyleProps {
    /** Value accessor. Default "close". */
    readonly y?: Accessor<T, number | undefined>;
    /** Color when the value rose from the previous bar. Defaults to theme.up. */
    readonly upColor?: string;
    /** Color when the value fell from the previous bar. Defaults to theme.down. */
    readonly downColor?: string;
    /** Value columns grow from, or "bottom" (default) for the bottom of the pane. */
    readonly base?: number | "bottom";
}

/** "Columns" chart type: a column per bar up to the close, colored by the change from the previous close. */
export function ColumnsSeries<T = any>({
    y = "close" as Accessor<T, number | undefined>,
    upColor,
    downColor,
    base = "bottom",
    ...rest
}: ColumnsSeriesProps<T>) {
    const engine = useChart<T>();
    const value = accessor(y);
    return (
        <BarSeries<T>
            {...rest}
            y={y}
            base={base}
            fill={(d, i, theme) => {
                const prev = i > 0 ? value(engine.data[i - 1], i - 1) : undefined;
                return prev === undefined || (value(d, i) ?? 0) >= prev
                    ? (upColor ?? theme.up)
                    : (downColor ?? theme.down);
            }}
        />
    );
}
