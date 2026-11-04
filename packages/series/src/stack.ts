import { accessor, isFiniteNumber, type Accessor } from "@reincharts/core";

/** Lower / upper value of one stacked item. */
export type StackedValue = readonly [y0: number, y1: number];

export interface StackOptions {
    /** "none" stacks raw values; "percent" normalises every datum so its stack totals 100. Default "none". */
    readonly offset?: "none" | "percent";
}

/**
 * Stacks several values per datum. Returns one array per key with `[y0, y1]` for each datum
 * (`undefined` where the value is missing). Positive values stack upwards from 0 and negative
 * values downwards from 0 (diverging), so mixed-sign stacks never overlap.
 *
 * @example stack(data, ["apples", "pears"])[1][i] // [apples, apples + pears] of datum i
 */
export function stack<T>(
    data: readonly T[],
    keys: readonly Accessor<T, number | undefined>[],
    { offset = "none" }: StackOptions = {},
): (StackedValue | undefined)[][] {
    const fns = keys.map((k) => accessor(k));
    const out = fns.map(() => new Array<StackedValue | undefined>(data.length));
    for (let i = 0; i < data.length; i++) {
        stackAt(data[i], i, fns, offset, (k, v) => {
            out[k][i] = v;
        });
    }
    return out;
}

/** Stacks the values of one datum, calling `emit(keyIndex, [y0, y1])` per key (used per frame by series). */
export const stackAt = <T>(
    d: T,
    i: number,
    fns: readonly ((d: T, i: number) => number | undefined)[],
    offset: StackOptions["offset"],
    emit: (k: number, v: StackedValue | undefined) => void,
) => {
    let scale = 1;
    if (offset === "percent") {
        let total = 0;
        for (const f of fns) {
            const v = d === undefined ? undefined : f(d, i);
            total += isFiniteNumber(v) ? Math.abs(v) : 0;
        }
        scale = total > 0 ? 100 / total : 0;
    }
    let pos = 0;
    let neg = 0;
    for (let k = 0; k < fns.length; k++) {
        const raw = d === undefined ? undefined : fns[k](d, i);
        if (!isFiniteNumber(raw)) {
            emit(k, undefined);
            continue;
        }
        const v = raw * scale;
        if (v >= 0) {
            emit(k, [pos, pos + v]);
            pos += v;
        } else {
            emit(k, [neg, neg + v]);
            neg += v;
        }
    }
};
