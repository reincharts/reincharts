import { isFiniteNumber } from "@reincharts/core";
import { barWidth } from "./geometry";
import { ohlcLegend } from "./ohlc";
import { useSeries, type SeriesProps } from "./useSeries";

/**
 * One point & figure column, as produced by the point & figure transform.
 * `direction` 1 is a column of X (rising), -1 a column of O (falling); `boxes` lists its boxes from the
 * first to the last, each spanning `open` → `close` (one box size). `open` / `close` are the first box's
 * open and the last box's close; `high` / `low` default to their max / min. Extra fields are ignored.
 */
export interface PointAndFigureDatum {
    readonly date?: Date | number;
    readonly direction: 1 | -1;
    readonly boxes: readonly { readonly open: number; readonly close: number }[];
    readonly open: number;
    readonly close: number;
    readonly high?: number;
    readonly low?: number;
}

export interface PointAndFigureSeriesProps extends SeriesProps {
    /** Color of X (rising) columns. Defaults to theme.up. */
    readonly upColor?: string;
    /** Color of O (falling) columns. Defaults to theme.down. */
    readonly downColor?: string;
    /** Stroke width of the X and O marks. Default 1.5. */
    readonly lineWidth?: number;
    /** Column width as a fraction of the bar spacing. Default 0.8. */
    readonly widthRatio?: number;
}

const range = (d: PointAndFigureDatum) => [d.low ?? Math.min(d.open, d.close), d.high ?? Math.max(d.open, d.close)];

/** Point & figure chart: columns of X (rising) and O (falling) boxes. */
export function PointAndFigureSeries({
    upColor,
    downColor,
    lineWidth = 1.5,
    widthRatio = 0.8,
    ...rest
}: PointAndFigureSeriesProps) {
    useSeries<PointAndFigureDatum>({
        ...rest,
        values: (d) => range(d),
        base: (d) => d.close,
        color: (d, _i, theme) => (d.direction > 0 ? (upColor ?? theme.up) : (downColor ?? theme.down)),
        legendValues: (d, _i, { format, color }) => ohlcLegend([d.open, d.close], format, color, ["O", "C"]),
        draw(ctx, { data, start, end, x, y, barSpacing, theme }) {
            const w = barWidth(barSpacing, widthRatio);
            const inset = Math.min(2, w / 6) + lineWidth / 2;
            const xs = new Path2D();
            const os = new Path2D();
            for (let i = start; i <= end; i++) {
                const d = data[i];
                if (!d?.boxes) {
                    continue;
                }
                const cx = x(i);
                const left = cx - w / 2 + inset;
                const right = cx + w / 2 - inset;
                for (const box of d.boxes) {
                    if (!isFiniteNumber(box.open) || !isFiniteNumber(box.close)) {
                        continue;
                    }
                    const top = Math.min(y(box.open), y(box.close)) + inset;
                    const bottom = Math.max(y(box.open), y(box.close)) - inset;
                    if (bottom <= top) {
                        continue;
                    }
                    if (d.direction > 0) {
                        xs.moveTo(left, top);
                        xs.lineTo(right, bottom);
                        xs.moveTo(left, bottom);
                        xs.lineTo(right, top);
                    } else {
                        const cy = (top + bottom) / 2;
                        os.moveTo(right, cy);
                        os.ellipse(cx, cy, Math.max(0.5, (right - left) / 2), (bottom - top) / 2, 0, 0, Math.PI * 2);
                    }
                }
            }
            ctx.setLineDash([]);
            ctx.lineWidth = lineWidth;
            ctx.lineCap = "round";
            ctx.strokeStyle = upColor ?? theme.up;
            ctx.stroke(xs);
            ctx.strokeStyle = downColor ?? theme.down;
            ctx.stroke(os);
        },
    });
    return null;
}
