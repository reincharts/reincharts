/** Limits a value to [min, max]. */
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** True for numbers that are not NaN or ±Infinity (type guard). */
export const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** First index whose value is >= target (values must be ascending). */
export const lowerBound = (values: ArrayLike<number>, target: number, lo = 0, hi = values.length) => {
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (values[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    return lo;
};

/** First index whose value is > target (values must be ascending). */
export const upperBound = (values: ArrayLike<number>, target: number, lo = 0, hi = values.length) => {
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (values[mid] <= target) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    return lo;
};

/** Index of the value closest to target (values must be ascending, non-empty). */
export const nearestIndex = (values: ArrayLike<number>, target: number) => {
    const i = lowerBound(values, target);
    if (i <= 0) {
        return 0;
    }
    if (i >= values.length) {
        return values.length - 1;
    }
    return target - values[i - 1] <= values[i] - target ? i - 1 : i;
};

/** The "nice" step (1, 2, 2.5, 5 × 10^n) nearest to `span / count`. */
export const niceStep = (span: number, count: number) => {
    const raw = span / Math.max(1, count);
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const fraction = raw / power;
    const nice = fraction < 1.5 ? 1 : fraction < 2.25 ? 2 : fraction < 3.5 ? 2.5 : fraction < 7.5 ? 5 : 10;
    return nice * power;
};

/** Evenly spaced nice ticks covering [min, max]. */
export const niceTicks = (min: number, max: number, count: number): number[] => {
    if (!isFiniteNumber(min) || !isFiniteNumber(max) || min === max) {
        return isFiniteNumber(min) ? [min] : [];
    }
    if (min > max) {
        [min, max] = [max, min];
    }
    const step = niceStep(max - min, count);
    const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
    const ticks: number[] = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) {
        ticks.push(Number(v.toFixed(decimals)));
    }
    return ticks;
};

/** Number of decimals needed to display a step without losing precision. */
export const decimalsFor = (step: number) => {
    if (!isFiniteNumber(step) || step <= 0) {
        return 2;
    }
    for (let d = 0; d <= 10; d++) {
        const v = step * Math.pow(10, d);
        if (Math.abs(v - Math.round(v)) < 1e-6 * Math.max(1, v)) {
            return d;
        }
    }
    return 10;
};

const formatters = new Map<number, Intl.NumberFormat>();

/** Formats a number with a fixed number of decimals and thousands separators. */
export const formatNumber = (value: number, decimals = 2) => {
    if (!isFiniteNumber(value)) {
        return "";
    }
    let f = formatters.get(decimals);
    if (!f) {
        f = new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        formatters.set(decimals, f);
    }
    return f.format(value);
};

/** Price formatting with automatic precision: more decimals for small prices. */
export const formatPrice = (value: number, decimals?: number) => {
    const abs = Math.abs(value);
    return formatNumber(value, decimals ?? (abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8));
};

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });

/** Compact number formatting, e.g. 1.25M, used for volume. */
export const formatCompact = (value: number) => (isFiniteNumber(value) ? compact.format(value) : "");

/** Signed percentage, e.g. "+1.25%". */
export const formatPercent = (value: number, decimals = 2) =>
    isFiniteNumber(value) ? `${value > 0 ? "+" : ""}${value.toFixed(decimals)}%` : "";
