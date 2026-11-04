import {
    formatPrice,
    isFiniteNumber,
    useChart,
    usePaneId,
    useRenderable,
    type DrawScope,
    type LegendValue,
    type RenderableSpec,
    type Theme,
} from "@reincharts/core";
import * as React from "react";
import { getLod, lodExtent } from "./lod";

/** Props shared by every series. */
export interface SeriesProps {
    /** Name shown in legends and the object tree. */
    readonly name?: string;
    /** Price scale id in the pane. Default "right". Use another id (e.g. "volume") to overlay the series on its own scale. */
    readonly scale?: string;
    /** Set to false to hide the series (it then no longer takes part in autoscale either). Default true. */
    readonly visible?: boolean;
    /** Drawing order inside the pane: higher values are drawn on top. Default 0. */
    readonly zIndex?: number;
    /** Include in legends. Default true. */
    readonly legend?: boolean;
    /** Formats values shown in legends. Defaults to the price scale formatter. */
    readonly format?: (value: number) => string;
}

export type SeriesValues = number | readonly (number | undefined)[] | undefined;

export interface UseSeriesOptions<T> extends SeriesProps {
    /** Values of a datum used for autoscale and magnet snapping. */
    readonly values: (d: T, index: number) => SeriesValues;
    /** Constant values always included in the autoscale extent (e.g. the base of bars). */
    readonly extentIncludes?: readonly number[];
    /** Value used as base in percent / indexed modes and as the last value. Defaults to the last of `values`. */
    readonly base?: (d: T, index: number) => number | undefined;
    /** Main color (legend swatch, last value label). Functions receive the current theme. */
    readonly color: string | ((d: T, index: number, theme: Theme) => string);
    /** Values shown by legends at a bar. Defaults to the formatted `values`. */
    readonly legendValues?: (d: T, index: number, helpers: LegendHelpers) => LegendValue[] | undefined;
    readonly draw: (ctx: CanvasRenderingContext2D, scope: DrawScope<T>) => void;
    /** Include in autoscale (default true). */
    readonly autoscale?: boolean;
    /** Report a last value for price axis labels and a percent-mode base (default true). */
    readonly lastValue?: boolean;
    /** Custom (fast) autoscale over bars start..end, replacing the scan over `values`. */
    readonly extentOf?: (start: number, end: number, data: readonly T[]) => readonly [number, number] | undefined;
    /** Override the visible index range used for autoscale (e.g. all data for category charts). */
    readonly extentRange?: (start: number, end: number) => readonly [number, number];
    readonly layer?: RenderableSpec["layer"];
    readonly clip?: boolean;
    readonly xExtent?: () => readonly [number, number] | undefined;
    readonly indexAt?: (x: number, y: number) => number | undefined;
}

/** Passed to `legendValues`. */
export interface LegendHelpers {
    /** The series value formatter (`format` prop or the price scale's). */
    readonly format: (value: number) => string;
    /** The series color at this bar. */
    readonly color: string;
    readonly theme: Theme;
}

/** Normalizes `SeriesValues` (one value, several or none) to an array. */
export const toArray = (v: SeriesValues): readonly (number | undefined)[] =>
    v === undefined ? [] : typeof v === "number" ? [v] : v;

/** Wires a series into the chart: drawing, autoscale, legend, snapping, last value and percent base. */
export function useSeries<T>(o: UseSeriesOptions<T>) {
    const engine = useChart<T>();
    const paneId = usePaneId();
    const id = React.useId();
    const colorAt = (i: number) => (typeof o.color === "function" ? o.color(engine.data[i], i, engine.theme) : o.color);
    const valuesAt = (i: number) => (engine.data[i] === undefined ? [] : toArray(o.values(engine.data[i], i)));
    const baseAt = (i: number) =>
        o.base ? (engine.data[i] === undefined ? undefined : o.base(engine.data[i], i)) : valuesAt(i).at(-1);
    const format = (v: number) => {
        if (o.format) {
            return o.format(v);
        }
        const scale = engine.getScale(paneId, o.scale);
        return scale.mode === "percent" || scale.mode === "indexed" ? formatPrice(v) : scale.format(v);
    };
    return useRenderable<T>({
        scale: o.scale,
        get visible() {
            return o.visible !== false && !engine.isHidden(id);
        },
        zIndex: o.zIndex,
        layer: o.layer,
        clip: o.clip,
        draw: o.draw,
        xExtent: o.xExtent,
        indexAt: o.indexAt,
        extent:
            o.autoscale === false
                ? undefined
                : (start, end) => {
                      [start, end] = o.extentRange ? o.extentRange(start, end) : [start, end];
                      let min = Infinity;
                      let max = -Infinity;
                      if (o.extentOf) {
                          const e = o.extentOf(start, end, engine.data);
                          if (e) {
                              [min, max] = e;
                          }
                          for (const v of o.extentIncludes ?? []) {
                              min = Math.min(min, v);
                              max = Math.max(max, v);
                          }
                          return min <= max ? [min, max] : undefined;
                      }
                      for (const v of o.extentIncludes ?? []) {
                          min = Math.min(min, v);
                          max = Math.max(max, v);
                      }
                      const data = engine.data;
                      // large single-value series: exact extent from the level-of-detail index (per block, not per bar)
                      if (data.length && typeof o.values(data[start], start) === "number") {
                          const single = o.values as (d: T, i: number) => number | undefined;
                          const lod = getLod(data, single);
                          if (lod) {
                              const e = lodExtent(lod, data, start, end, single);
                              if (e) {
                                  [min, max] = [Math.min(min, e[0]), Math.max(max, e[1])];
                              }
                              return min <= max ? [min, max] : undefined;
                          }
                      }
                      // hot loop (runs over every visible bar each frame): no per-bar allocations
                      for (let i = start; i <= end; i++) {
                          const d = data[i];
                          if (d === undefined) {
                              continue;
                          }
                          const values = o.values(d, i);
                          if (typeof values === "number") {
                              if (values < min) {
                                  min = values;
                              }
                              if (values > max) {
                                  max = values;
                              }
                          } else if (values) {
                              for (let k = 0; k < values.length; k++) {
                                  const v = values[k];
                                  if (isFiniteNumber(v)) {
                                      if (v < min) {
                                          min = v;
                                      }
                                      if (v > max) {
                                          max = v;
                                      }
                                  }
                              }
                          }
                      }
                      return min <= max ? [min, max] : undefined;
                  },
        // series without a last value (reference lines, category bars) don't provide the percent-mode base
        baseValue:
            o.lastValue === false && !o.base
                ? undefined
                : (start) => {
                      for (let i = Math.max(0, start); i < engine.data.length; i++) {
                          const v = baseAt(i);
                          if (isFiniteNumber(v)) {
                              return v;
                          }
                      }
                      return undefined;
                  },
        snapValues: (i) => valuesAt(i).filter(isFiniteNumber),
        legend:
            o.legend === false
                ? undefined
                : (i) => {
                      const d = engine.data[i];
                      if (d === undefined) {
                          return undefined;
                      }
                      const color = colorAt(i);
                      const values = o.legendValues
                          ? o.legendValues(d, i, { format, color, theme: engine.theme })
                          : valuesAt(i).map((v) => ({ value: isFiniteNumber(v) ? format(v) : "∅" }));
                      return values ? { id, name: o.name ?? "", color, values } : undefined;
                  },
        lastValue:
            o.lastValue === false
                ? undefined
                : () => {
                      for (let i = engine.data.length - 1; i >= 0; i--) {
                          const v = baseAt(i);
                          if (isFiniteNumber(v)) {
                              return { value: v, color: colorAt(i) };
                          }
                      }
                      return undefined;
                  },
    });
}
