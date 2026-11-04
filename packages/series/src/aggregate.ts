import { isFiniteNumber, type DrawScope } from "@reincharts/core";
import { PathBatch } from "./geometry";
import { getLod, LOD_BLOCK, lodExtent } from "./lod";

type Value<T> = (d: T, i: number) => number;

/**
 * Draws OHLC data with several bars per pixel: one aggregated bar per pixel column (first open, max high,
 * min low, last close) as a 1px line, merging pre-aggregated blocks when a whole block shares a pixel.
 * The picture matches drawing every bar; the cost is proportional to the chart width.
 */
export const drawOhlcColumns = <T>(
    ctx: CanvasRenderingContext2D,
    { data, start, end, x, y, barSpacing }: DrawScope<T>,
    open: Value<T>,
    high: Value<T>,
    low: Value<T>,
    close: Value<T>,
    color: (up: boolean, d: T, i: number) => string,
) => {
    const lines = new PathBatch();
    const lod = barSpacing * LOD_BLOCK <= 1 ? getLod(data, low, high) : undefined;
    let column = NaN;
    let ao = 0;
    let ah = 0;
    let al = 0;
    let ac = 0;
    let lastIndex = -1;
    const emit = () => {
        if (lastIndex < 0) {
            return;
        }
        const top = Math.round(y(ah));
        lines
            .get(color(ac >= ao, data[lastIndex], lastIndex))
            .rect(column, top, 1, Math.max(1, Math.round(y(al)) - top));
    };
    for (let i = start; i <= end; i++) {
        // whole blocks only when they fit in one pixel column (straddling blocks go bar by bar)
        if (
            lod &&
            i % LOD_BLOCK === 0 &&
            i + LOD_BLOCK - 1 <= end &&
            Math.round(x(i)) === Math.round(x(i + LOD_BLOCK - 1))
        ) {
            const b = i / LOD_BLOCK;
            i += LOD_BLOCK - 1;
            const first = lod.firstAt[b];
            if (first < 0) {
                continue;
            }
            const col = Math.round(x(b * LOD_BLOCK));
            if (col !== column) {
                emit();
                column = col;
                ao = open(data[first], first);
                ah = lod.max[b];
                al = lod.min[b];
            } else {
                ah = Math.max(ah, lod.max[b]);
                al = Math.min(al, lod.min[b]);
            }
            lastIndex = lod.lastAt[b];
            ac = close(data[lastIndex], lastIndex);
            continue;
        }
        const d = data[i];
        const oo = open(d, i);
        const cc = close(d, i);
        if (!isFiniteNumber(cc) || !isFiniteNumber(oo)) {
            continue;
        }
        const hh = isFiniteNumber(high(d, i)) ? high(d, i) : Math.max(oo, cc);
        const ll = isFiniteNumber(low(d, i)) ? low(d, i) : Math.min(oo, cc);
        const col = Math.round(x(i));
        if (col !== column) {
            emit();
            column = col;
            ao = oo;
            ah = hh;
            al = ll;
        } else {
            ah = Math.max(ah, hh);
            al = Math.min(al, ll);
        }
        ac = cc;
        lastIndex = i;
    }
    emit();
    lines.fill(ctx);
};

/** Fast autoscale for OHLC data: min low / max high (block index for large data, no per-bar allocations). */
export const ohlcExtent = <T>(
    data: readonly T[],
    start: number,
    end: number,
    low: Value<T>,
    high: Value<T>,
): [number, number] | undefined => {
    const lod = getLod(data, low, high);
    if (lod) {
        return lodExtent(lod, data, start, end, low, high);
    }
    let min = Infinity;
    let max = -Infinity;
    for (let i = start; i <= end; i++) {
        const d = data[i];
        if (d === undefined) {
            continue;
        }
        const lo = low(d, i);
        const hi = high(d, i);
        if (lo < min) {
            min = lo;
        }
        if (hi > max) {
            max = hi;
        }
    }
    return min <= max ? [min, max] : undefined;
};
