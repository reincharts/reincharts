import { nearestIndex, type ChartEngine } from "@reincharts/core";

/** A data x value: a Date / timestamp, a number (linear x or numeric data) or a category name. */
export type DataX = Date | number | string;

/** Logical x of a data x value (works in index and linear modes, extrapolates beyond the data). */
export const logicalOf = (engine: ChartEngine, x: DataX): number => {
    if (typeof x === "string") {
        const i = engine.categories.indexOf(x);
        return i >= 0 ? engine.xs[i] : NaN;
    }
    const t = x instanceof Date ? x.getTime() : x;
    return engine.xType === "category" ? t : engine.logicalOfTime(t);
};

/** Plot-relative pixel x of a data x value. */
export const pixelX = (engine: ChartEngine, x: DataX) => engine.xOfLogical(logicalOf(engine, x));

/** Index of the datum nearest to a data x value, or -1. */
export const indexOf = (engine: ChartEngine, x: DataX) => {
    const l = logicalOf(engine, x);
    if (!Number.isFinite(l) || engine.data.length === 0 || !engine.sorted) {
        return -1;
    }
    return nearestIndex(engine.xs, l);
};

/** Resolves a pixel coordinate: negative values count from the far edge. */
export const fromEdge = (v: number, size: number) => (v < 0 ? size + v : v);
