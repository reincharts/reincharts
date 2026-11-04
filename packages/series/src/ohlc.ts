import { isFiniteNumber, type LegendValue } from "@reincharts/core";

/** Legend values "O H L C" colored like the bar. */
export const ohlcLegend = (
    values: readonly number[],
    format: (v: number) => string,
    color: string,
    labels = ["O", "H", "L", "C"],
): LegendValue[] => values.map((v, k) => ({ label: labels[k], value: isFiniteNumber(v) ? format(v) : "∅", color }));
