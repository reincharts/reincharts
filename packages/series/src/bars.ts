import { formatNumber, isFiniteNumber, useChart, usePaneId, type DrawScope, type Theme } from "@reincharts/core";
import { addColumn, addRow, barWidth, groupLayout, PathBatch } from "./geometry";
import { stackAt } from "./stack";
import { getLod, LOD_BLOCK, lodExtent } from "./lod";
import { useSeries, type SeriesProps } from "./useSeries";

/** A static color or a function of the datum (and theme), e.g. up/down volume colors. */
export type BarColor<T> = string | ((d: T, index: number, theme: Theme) => string);

/** Props shared by every bar series. */
export interface BarStyleProps {
    /** Bar (or group) width as a fraction of the bar spacing / category band. Default 0.8. */
    readonly widthRatio?: number;
    /** Maximum bar (or group) width in pixels. */
    readonly maxWidth?: number;
    /** Corner radius of the bar end away from the base, in pixels. Default 0. */
    readonly radius?: number;
    /** Outline color (1px). Default none. */
    readonly stroke?: string;
}

export type BarLayout = "single" | "grouped" | "stacked" | "overlay";

export interface BarOptions<T> extends SeriesProps, BarStyleProps {
    readonly layout: BarLayout;
    readonly horizontal: boolean;
    readonly ys: readonly ((d: T, i: number) => number | undefined)[];
    readonly y0?: (d: T, i: number) => number | undefined;
    readonly base: number | "bottom";
    readonly color: (k: number, d: T, i: number, theme: Theme) => string;
    /** Legend labels per value (multi-value layouts). */
    readonly names?: readonly string[];
    /** Gap between grouped bars in pixels. */
    readonly gap?: number;
    readonly offset?: "none" | "percent";
}

type Emit = (k: number, v0: number, v1: number, slot: number, outer: boolean) => void;

/** Plain number formatting for values on a non-price axis (horizontal bars). */
export const formatValue = (v: number) => formatNumber(v, Number.isInteger(v) ? 0 : Math.abs(v) >= 100 ? 1 : 2);

/** Calls `emit` for every bar segment of datum i: value index, from, to, group slot and whether it is the outer end. */
const segments = <T>(o: BarOptions<T>, d: T, i: number, emit: Emit) => {
    const base = o.base === "bottom" ? NaN : o.base;
    if (o.layout === "stacked") {
        let lastPos = -1;
        let lastNeg = -1;
        const segs: [number, number, number][] = [];
        stackAt(d, i, o.ys, o.offset, (k, v) => {
            if (v) {
                segs.push([k, v[0], v[1]]);
                if (v[1] >= v[0]) {
                    lastPos = k;
                } else {
                    lastNeg = k;
                }
            }
        });
        for (const [k, a, b] of segs) {
            emit(k, a, b, 0, k === lastPos || k === lastNeg);
        }
        return;
    }
    if (o.layout === "overlay") {
        // largest first so smaller bars stay visible in front
        const order = o.ys.map((f, k) => [k, f(d, i)] as const).filter(([, v]) => isFiniteNumber(v));
        order.sort((a, b) => Math.abs(b[1]! - base) - Math.abs(a[1]! - base));
        for (const [k, v] of order) {
            emit(k, base, v!, 0, true);
        }
        return;
    }
    for (let k = 0; k < o.ys.length; k++) {
        const v = o.ys[k](d, i);
        if (isFiniteNumber(v)) {
            const from = o.y0?.(d, i);
            emit(k, isFiniteNumber(from) ? from : base, v, o.layout === "grouped" ? k : 0, true);
        }
    }
};

/** Shared implementation of every vertical / horizontal, single / grouped / stacked / overlay bar series. */
export function useBars<T>(o: BarOptions<T>) {
    const engine = useChart<T>();
    const paneId = usePaneId();
    const { widthRatio = 0.8, maxWidth, radius = 0, stroke, horizontal } = o;
    const groups = o.layout === "grouped" ? o.ys.length : 1;
    const values = (d: T, i: number) => {
        if (horizontal) {
            return i;
        }
        const out: number[] = [];
        segments(o, d, i, (_k, v0, v1) => {
            out.push(v1);
            if (o.layout === "stacked" || o.y0) {
                out.push(v0);
            }
        });
        return out;
    };
    const scaleOf = () => engine.getScale(paneId, o.scale);
    // plain vertical bars of one value (histogram, volume, columns): eligible for per-pixel aggregation
    const simple = !horizontal && o.layout === "single" && o.ys.length === 1 && !o.y0 && !stroke;

    const draw = (
        ctx: CanvasRenderingContext2D,
        { data, start, end, x, y, barSpacing, theme, pane, scale }: DrawScope<T>,
    ) => {
        const fills = new PathBatch();
        const outline = stroke ? new Path2D() : undefined;
        const band = horizontal ? (scale?.bandHeight ?? barSpacing) : barSpacing;
        const slot = barWidth(band, widthRatio, maxWidth);
        const { width, offsets } = groups > 1 ? groupLayout(slot, groups, 2) : { width: slot, offsets: [0] };
        const bottom = pane?.height ?? 0;
        if (simple && barSpacing < 1) {
            // several bars per pixel: one bar per pixel column up to the column's max (and down to its min),
            // colored like that extreme bar. Same picture, cost proportional to the width.
            const value = o.ys[0];
            const baseY = typeof o.base === "number" ? y(o.base) : bottom;
            const base = typeof o.base === "number" ? o.base : -Infinity;
            const lod = barSpacing * LOD_BLOCK <= 1 ? getLod(data, value) : undefined;
            let column = NaN;
            let hi = -Infinity;
            let lo = Infinity;
            let hiAt = -1;
            let loAt = -1;
            const emit = () => {
                if (hiAt >= 0 && hi > base) {
                    addColumn(fills.get(o.color(0, data[hiAt], hiAt, theme)), column + 0.5, 1, y(hi), baseY, 0);
                }
                if (loAt >= 0 && lo < base && isFiniteNumber(o.base)) {
                    addColumn(fills.get(o.color(0, data[loAt], loAt, theme)), column + 0.5, 1, y(lo), baseY, 0);
                }
                hi = -Infinity;
                lo = Infinity;
                hiAt = loAt = -1;
            };
            const take = (col: number, vHi: number, iHi: number, vLo: number, iLo: number) => {
                if (col !== column) {
                    emit();
                    column = col;
                }
                if (vHi > hi) {
                    hi = vHi;
                    hiAt = iHi;
                }
                if (vLo < lo) {
                    lo = vLo;
                    loAt = iLo;
                }
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
                    if (lod.firstAt[b] >= 0) {
                        take(Math.round(x(b * LOD_BLOCK)), lod.max[b], lod.maxAt[b], lod.min[b], lod.minAt[b]);
                    }
                    continue;
                }
                const d = data[i];
                const v = d === undefined ? undefined : value(d, i);
                if (isFiniteNumber(v)) {
                    take(Math.round(x(i)), v, i, v, i);
                }
            }
            emit();
            fills.fill(ctx);
            return;
        }
        const [from, to] = horizontal ? [0, data.length - 1] : [start, end];
        for (let i = from; i <= to; i++) {
            const d = data[i];
            if (d === undefined) {
                continue;
            }
            const center = horizontal ? y(i) : x(i);
            if (horizontal && (center < -band || center > bottom + band)) {
                continue;
            }
            segments(o, d, i, (k, v0, v1, g, outer) => {
                const c = center + offsets[g];
                const r = outer ? radius : 0;
                const path = fills.get(o.color(k, d, i, theme));
                if (horizontal) {
                    const x0 = isFiniteNumber(v0) ? engine.xOfLogical(v0) : 0;
                    addRow(path, x0, engine.xOfLogical(v1), c, width, r);
                    if (outline) {
                        addRow(outline, x0, engine.xOfLogical(v1), c, width, r);
                    }
                } else {
                    const y0 = isFiniteNumber(v0) ? y(v0) : bottom;
                    addColumn(path, c, width, y(v1), y0, r);
                    if (outline) {
                        addColumn(outline, c, width, y(v1), y0, r);
                    }
                }
            });
        }
        fills.fill(ctx);
        if (outline && stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.stroke(outline);
        }
    };

    const multi = o.ys.length > 1;
    useSeries<T>({
        ...o,
        values,
        extentIncludes: !horizontal && typeof o.base === "number" ? [o.base] : undefined,
        extentRange: horizontal ? () => [0, engine.data.length - 1] : undefined,
        extentOf: simple
            ? (start, end, data) => {
                  const value = o.ys[0];
                  const lod = getLod(data, value);
                  if (lod) {
                      return lodExtent(lod, data, start, end, value);
                  }
                  let min = Infinity;
                  let max = -Infinity;
                  for (let i = start; i <= end; i++) {
                      const v = data[i] === undefined ? undefined : value(data[i], i);
                      if (isFiniteNumber(v)) {
                          min = Math.min(min, v);
                          max = Math.max(max, v);
                      }
                  }
                  return min <= max ? [min, max] : undefined;
              }
            : undefined,
        lastValue: !horizontal && !multi,
        base: horizontal || multi ? undefined : (d, i) => o.ys[0](d, i),
        format: o.format ?? (horizontal ? formatValue : undefined),
        color: (d, i, theme) => o.color(0, d, i, theme),
        legendValues: (d, i, { format, theme }) =>
            o.ys.map((f, k) => {
                const v = f(d, i);
                return {
                    label: multi ? o.names?.[k] : undefined,
                    value: isFiniteNumber(v) ? format(v) : "∅",
                    color: o.color(k, d, i, theme),
                };
            }),
        draw,
        xExtent: horizontal
            ? () => {
                  let min = typeof o.base === "number" ? o.base : 0;
                  let max = min;
                  engine.data.forEach((d, i) =>
                      segments(o, d, i, (_k, v0, v1) => {
                          for (const v of [v0, v1]) {
                              if (isFiniteNumber(v)) {
                                  min = Math.min(min, v);
                                  max = Math.max(max, v);
                              }
                          }
                      }),
                  );
                  return [min, max];
              }
            : undefined,
        indexAt: horizontal
            ? (_x, py) => {
                  const t = scaleOf().tOf(py);
                  const i = Math.round(t);
                  return i >= 0 && i < engine.data.length && Math.abs(t - i) <= 0.5 ? i : undefined;
              }
            : undefined,
    });
}
