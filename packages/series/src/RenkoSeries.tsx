import { accessor, withAlpha, type Accessor, type Theme } from "@reincharts/core";
import { barLeft, barWidth, PathBatch, pixelSpan } from "./geometry";
import { ohlcLegend } from "./ohlc";
import { useSeries, type SeriesProps } from "./useSeries";

/**
 * A brick / box produced by the renko or line break transforms (one datum per brick):
 * `{ date, open, close, fullyFormed? }`. A brick is "up" when close >= open. `fullyFormed: false`
 * marks the last, still forming renko brick. Extra fields (high, low, volume, from, to...) are ignored.
 */
export interface BrickDatum {
    readonly date?: Date | number;
    readonly open: number;
    readonly close: number;
    readonly fullyFormed?: boolean;
}

export interface RenkoSeriesProps<T = BrickDatum> extends SeriesProps {
    /** Brick open accessor. Default "open". */
    readonly open?: Accessor<T>;
    /** Brick close accessor. Default "close". */
    readonly close?: Accessor<T>;
    /** Accessor of the "still forming" flag. Default "fullyFormed" (missing = formed). */
    readonly formed?: Accessor<T, boolean | undefined>;
    /** Up brick color. Defaults to theme.up. */
    readonly upColor?: string;
    /** Down brick color. Defaults to theme.down. */
    readonly downColor?: string;
    /** Color of a brick that is still forming (drawn hollow). Defaults to theme.neutral. */
    readonly partialColor?: string;
    /** Brick width as a fraction of the bar spacing. Default 0.9. */
    readonly widthRatio?: number;
    /** Fill opacity of bricks (their border stays opaque). Default 1. */
    readonly fillOpacity?: number;
}

/** Renko bricks: fixed-size boxes stacked diagonally, one per datum of the renko transform. */
export function RenkoSeries<T = BrickDatum>({
    open = "open" as Accessor<T>,
    close = "close" as Accessor<T>,
    formed = "fullyFormed" as Accessor<T, boolean | undefined>,
    upColor,
    downColor,
    partialColor,
    widthRatio = 0.9,
    fillOpacity = 1,
    ...rest
}: RenkoSeriesProps<T>) {
    const o = accessor(open);
    const c = accessor(close);
    const isFormed = accessor(formed);
    const colorOf = (d: T, i: number, theme: Theme) =>
        isFormed(d, i) === false
            ? (partialColor ?? theme.neutral)
            : c(d, i) >= o(d, i)
              ? (upColor ?? theme.up)
              : (downColor ?? theme.down);
    useSeries<T>({
        ...rest,
        values: (d, i) => [o(d, i), c(d, i)],
        base: (d, i) => c(d, i),
        color: colorOf,
        legendValues: (d, i, { format, color }) => ohlcLegend([o(d, i), c(d, i)], format, color, ["O", "C"]),
        draw(ctx, { data, start, end, x, y, barSpacing, theme }) {
            const w = barWidth(barSpacing, widthRatio);
            const fills = new PathBatch();
            const borders = new PathBatch();
            for (let i = start; i <= end; i++) {
                const d = data[i];
                const oo = o(d, i);
                const cc = c(d, i);
                if (!Number.isFinite(oo) || !Number.isFinite(cc)) {
                    continue;
                }
                const color = colorOf(d, i, theme);
                const left = barLeft(x(i), w);
                const [top, height] = pixelSpan(y(oo), y(cc));
                if (isFormed(d, i) !== false) {
                    fills.get(fillOpacity < 1 ? withAlpha(color, fillOpacity) : color).rect(left, top, w, height);
                }
                if (w > 3) {
                    borders.get(color).rect(left + 0.5, top + 0.5, w - 1, Math.max(0, height - 1));
                }
            }
            fills.fill(ctx);
            borders.stroke(ctx, 1);
        },
    });
    return null;
}

export type LineBreakSeriesProps<T = BrickDatum> = RenkoSeriesProps<T>;

/** Line break (three line break) boxes: one box per datum of the line break transform. */
export function LineBreakSeries<T = BrickDatum>({ widthRatio = 0.8, ...rest }: LineBreakSeriesProps<T>) {
    return <RenkoSeries<T> {...rest} widthRatio={widthRatio} />;
}
