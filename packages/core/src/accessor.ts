/** A field name or a function reading a value from a datum, e.g. `"close"` or `(d) => d.close`. */
export type Accessor<T, R = number> = keyof T | ((d: T, index: number) => R);

/** Turns an `Accessor` into a function. */
export function accessor<T, R = number>(a: Accessor<T, R>): (d: T, index: number) => R;
export function accessor<T, R = number>(a: Accessor<T, R> | undefined): ((d: T, index: number) => R) | undefined;
export function accessor<T, R = number>(a: Accessor<T, R> | undefined) {
    if (a === undefined) {
        return undefined;
    }
    return typeof a === "function" ? a : (d: T) => (d as any)?.[a] as R;
}

/** A static value or a function of the datum, e.g. a color. */
export type Functor<T, R> = R | ((d: T, index: number) => R);

/** Turns a `Functor` (a static value or a function of the datum) into a function. */
export const functor = <T, R>(v: Functor<T, R>): ((d: T, index: number) => R) =>
    typeof v === "function" ? (v as (d: T, index: number) => R) : () => v;
