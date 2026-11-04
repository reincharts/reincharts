import { accessor, useChart, useChartState, withAlpha, type Accessor } from "@reincharts/core";
import { CandlestickSeries, type CandlestickSeriesProps } from "./CandlestickSeries";

export interface VolumeCandlesSeriesProps<T = any> extends Omit<CandlestickSeriesProps<T>, "fill" | "widthFactor"> {
    /** Volume accessor. Default "volume". */
    readonly volume?: Accessor<T>;
    /**
     * "color" (default): opacity grows with volume relative to the visible maximum.
     * "width" (equivolume): body width grows with volume. "both" does both.
     */
    readonly mode?: "color" | "width" | "both";
    /** Lowest opacity / width fraction used for the smallest volume. Default 0.25. */
    readonly min?: number;
}

/** Candles whose color intensity and / or body width reflect the bar's volume relative to the visible bars. */
export function VolumeCandlesSeries<T = any>({
    volume = "volume" as Accessor<T>,
    mode = "color",
    min = 0.25,
    ...rest
}: VolumeCandlesSeriesProps<T>) {
    const engine = useChart<T>();
    const theme = useChartState((s) => s.theme);
    const vol = accessor(volume);
    const o = accessor(rest.open ?? ("open" as Accessor<T>));
    const c = accessor(rest.close ?? ("close" as Accessor<T>));
    let cache = { data: null as readonly T[] | null, start: -1, end: -1, max: 1 };
    const fraction = (d: T, i: number) => {
        const { start, end } = engine.range;
        if (cache.data !== engine.data || cache.start !== start || cache.end !== end) {
            let max = 0;
            for (let k = Math.max(0, start); k <= end; k++) {
                max = Math.max(max, vol(engine.data[k], k) || 0);
            }
            cache = { data: engine.data, start, end, max: max || 1 };
        }
        return min + (1 - min) * Math.min(1, Math.max(0, (vol(d, i) || 0) / cache.max));
    };
    const byColor = mode !== "width";
    const byWidth = mode !== "color";
    return (
        <CandlestickSeries<T>
            {...rest}
            fill={
                byColor
                    ? (d, i) =>
                          withAlpha(
                              c(d, i) >= o(d, i) ? (rest.upColor ?? theme.up) : (rest.downColor ?? theme.down),
                              fraction(d, i),
                          )
                    : undefined
            }
            widthFactor={byWidth ? fraction : undefined}
        />
    );
}
