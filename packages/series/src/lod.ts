import { isFiniteNumber } from "@reincharts/core";

/**
 * Level-of-detail index for large series: min / max (and their indices) plus the first / last valid index of
 * every block of BLOCK bars. Lets drawing and autoscale work per block instead of per bar when many bars share a
 * pixel, so the cost of a frame depends on the chart width rather than on the size of the data.
 */
export interface Lod {
    readonly min: Float64Array;
    readonly max: Float64Array;
    readonly minAt: Int32Array;
    readonly maxAt: Int32Array;
    readonly firstAt: Int32Array;
    readonly lastAt: Int32Array;
}

/** Number of bars per block of the level-of-detail index. */
export const LOD_BLOCK = 32;
/** Series shorter than this are always scanned bar by bar. */
export const LOD_MIN_LENGTH = 10_000;

type Accessor<T> = (d: T, i: number) => number | undefined;

const cache = new WeakMap<readonly unknown[], WeakMap<Accessor<any>, Lod>>();

const build = <T>(data: readonly T[], low: Accessor<T>, high: Accessor<T>): Lod => {
    const blocks = Math.ceil(data.length / LOD_BLOCK);
    const lod: Lod = {
        min: new Float64Array(blocks).fill(Infinity),
        max: new Float64Array(blocks).fill(-Infinity),
        minAt: new Int32Array(blocks).fill(-1),
        maxAt: new Int32Array(blocks).fill(-1),
        firstAt: new Int32Array(blocks).fill(-1),
        lastAt: new Int32Array(blocks).fill(-1),
    };
    for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const lo = d === undefined ? undefined : low(d, i);
        const hi = d === undefined ? undefined : high === low ? lo : high(d, i);
        if (!isFiniteNumber(lo) || !isFiniteNumber(hi)) {
            continue;
        }
        const b = (i / LOD_BLOCK) | 0;
        if (lod.firstAt[b] < 0) {
            lod.firstAt[b] = i;
        }
        lod.lastAt[b] = i;
        if (lo < lod.min[b]) {
            lod.min[b] = lo;
            lod.minAt[b] = i;
        }
        if (hi > lod.max[b]) {
            lod.max[b] = hi;
            lod.maxAt[b] = i;
        }
    }
    return lod;
};

/**
 * The cached LOD index of `data` for a low / high accessor pair (the same function twice for a single value).
 * Returns undefined for short series. Keyed by the data array and the accessor, so it is rebuilt only when they change.
 */
export const getLod = <T>(data: readonly T[], low: Accessor<T>, high: Accessor<T> = low): Lod | undefined => {
    if (data.length < LOD_MIN_LENGTH) {
        return undefined;
    }
    let byAccessor = cache.get(data);
    if (!byAccessor) {
        byAccessor = new WeakMap();
        cache.set(data, byAccessor);
    }
    let lod = byAccessor.get(low);
    if (!lod) {
        lod = build(data, low, high);
        byAccessor.set(low, lod);
    }
    return lod;
};

/** Exact [min, max] over bars start..end: whole blocks from the index, partial blocks bar by bar. */
export const lodExtent = <T>(
    lod: Lod,
    data: readonly T[],
    start: number,
    end: number,
    low: Accessor<T>,
    high: Accessor<T> = low,
): [number, number] | undefined => {
    let min = Infinity;
    let max = -Infinity;
    const scan = (from: number, to: number) => {
        for (let i = from; i <= to; i++) {
            const d = data[i];
            if (d === undefined) {
                continue;
            }
            const lo = low(d, i);
            const hi = high === low ? lo : high(d, i);
            if (isFiniteNumber(lo) && lo < min) {
                min = lo;
            }
            if (isFiniteNumber(hi) && hi > max) {
                max = hi;
            }
        }
    };
    const firstBlock = Math.ceil(start / LOD_BLOCK);
    const lastBlock = Math.floor((end + 1) / LOD_BLOCK) - 1;
    if (lastBlock < firstBlock) {
        scan(start, end);
    } else {
        scan(start, firstBlock * LOD_BLOCK - 1);
        for (let b = firstBlock; b <= lastBlock; b++) {
            if (lod.min[b] < min) {
                min = lod.min[b];
            }
            if (lod.max[b] > max) {
                max = lod.max[b];
            }
        }
        scan((lastBlock + 1) * LOD_BLOCK, end);
    }
    return min <= max ? [min, max] : undefined;
};
