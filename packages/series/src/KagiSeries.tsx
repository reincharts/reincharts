import { isFiniteNumber } from "@reincharts/core";
import { ohlcLegend } from "./ohlc";
import { useSeries, type SeriesProps } from "./useSeries";

export type KagiType = "yang" | "yin";

/**
 * One vertical kagi line, as produced by the kagi transform. The line runs from
 * `open` to `close`; it starts as `startAs` and, when it breaks the previous peak / trough, switches
 * to `changeTo` at price `changePoint`. Consecutive lines are joined by a horizontal shoulder / waist at
 * the next line's `open` (= this line's `close`). Extra fields (high, low, volume, current, reverseAt...) are ignored.
 */
export interface KagiDatum {
    readonly date?: Date | number;
    readonly open: number;
    readonly close: number;
    /** Type of the line at its start. */
    readonly startAs: KagiType;
    /** Type the line switches to at `changePoint`, if it breaks the previous peak / trough. */
    readonly changeTo?: KagiType;
    /** Price where the type changes. */
    readonly changePoint?: number;
}

export interface KagiSeriesProps extends SeriesProps {
    /** Yang (thick, rising) line color. Defaults to theme.up. */
    readonly yangColor?: string;
    /** Yin (thin, falling) line color. Defaults to theme.down. */
    readonly yinColor?: string;
    /** Yang line width. Default 3. */
    readonly yangWidth?: number;
    /** Yin line width. Default 1.5. */
    readonly yinWidth?: number;
}

/** Kagi chart: thick yang and thin yin lines that switch when a line breaks the previous peak / trough. */
export function KagiSeries({ yangColor, yinColor, yangWidth = 3, yinWidth = 1.5, ...rest }: KagiSeriesProps) {
    const typeAt = (d: KagiDatum) => d.changeTo ?? d.startAs;
    useSeries<KagiDatum>({
        ...rest,
        values: (d) => [d.open, d.close],
        base: (d) => d.close,
        color: (d, _i, theme) => (typeAt(d) === "yang" ? (yangColor ?? theme.up) : (yinColor ?? theme.down)),
        legendValues: (d, _i, { format, color }) => ohlcLegend([d.open, d.close], format, color, ["O", "C"]),
        draw(ctx, { data, start, end, x, y, theme }) {
            const paths = { yang: new Path2D(), yin: new Path2D() };
            const last: Record<KagiType, string> = { yang: "", yin: "" };
            const segment = (type: KagiType, x1: number, y1: number, x2: number, y2: number) => {
                const p = paths[type];
                const key = `${x1},${y1}`;
                if (last[type] !== key) {
                    p.moveTo(x1, y1);
                }
                p.lineTo(x2, y2);
                last[type] = `${x2},${y2}`;
            };
            for (let i = Math.max(0, start); i <= end; i++) {
                const d = data[i];
                if (!d || !isFiniteNumber(d.open) || !isFiniteNumber(d.close)) {
                    continue;
                }
                const cx = Math.round(x(i)) + 0.5;
                const yo = Math.round(y(d.open)) + 0.5;
                const type = d.startAs ?? "yang";
                const prev = data[i - 1];
                if (prev && isFiniteNumber(prev.close)) {
                    segment(type, Math.round(x(i - 1)) + 0.5, yo, cx, yo);
                }
                const yc = Math.round(y(d.close)) + 0.5;
                if (d.changeTo && isFiniteNumber(d.changePoint)) {
                    const ym = Math.round(y(d.changePoint)) + 0.5;
                    segment(type, cx, yo, cx, ym);
                    segment(d.changeTo, cx, ym, cx, yc);
                } else {
                    segment(type, cx, yo, cx, yc);
                }
            }
            ctx.setLineDash([]);
            ctx.lineJoin = "miter";
            ctx.lineCap = "square";
            for (const type of ["yin", "yang"] as const) {
                ctx.strokeStyle = type === "yang" ? (yangColor ?? theme.up) : (yinColor ?? theme.down);
                ctx.lineWidth = type === "yang" ? yangWidth : yinWidth;
                ctx.stroke(paths[type]);
            }
        },
    });
    return null;
}
