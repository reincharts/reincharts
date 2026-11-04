import {
    decimalsFor,
    formatCompact,
    formatNumber,
    formatPercent,
    formatPrice,
    isFiniteNumber,
    niceStep,
    niceTicks,
} from "./math";

export type PriceScaleMode = "linear" | "log" | "percent" | "indexed";

export interface PriceScaleOptions {
    /** linear (default), log, percent (change from first visible bar) or indexed to 100. */
    readonly mode?: PriceScaleMode;
    /** Flip the scale so higher values are lower on screen. */
    readonly invert?: boolean;
    /** Empty space above/below the data as a fraction of pane height. Default `{ top: 0.1, bottom: 0.1 }`. */
    readonly margins?: { readonly top: number; readonly bottom: number };
    /** Fit the visible data automatically (default true). Turned off by manual scaling/panning. */
    readonly autoScale?: boolean;
    /** Fixed domain [min, max]. Disables autoscale. */
    readonly domain?: readonly [number, number];
    /** Per-bar values used for autoscale instead of the series on this scale. */
    readonly extents?: (d: any, index: number) => number | readonly number[] | undefined;
    /** Fully custom autoscale. Receives the visible bar range and returns [min, max]. */
    readonly extentsCalculator?: (args: {
        data: readonly any[];
        start: number;
        end: number;
    }) => readonly [number, number];
    /** Fixed number of decimals for labels. */
    readonly precision?: number;
    /** Custom label formatter (receives the raw price). */
    readonly format?: (value: number) => string;
    /**
     * Category labels: turns this into a band scale where value i is the i-th category
     * (used for horizontal bar charts). Domain defaults to [-0.5, n - 0.5], first category on top.
     */
    readonly categories?: readonly string[];
}

export interface PriceTick {
    /** Value in display units (raw price for linear/log, % for percent, index for indexed). */
    readonly value: number;
    readonly y: number;
    readonly label: string;
}

/** Maps prices to pixels for one scale inside a pane. Domain is kept in "mode space". */
export class PriceScale {
    public options: PriceScaleOptions = {};
    public height = 0;
    public min = 0;
    public max = 1;
    /** Base value for percent / indexed modes (first visible value of the first series). */
    public base = 1;
    /** False once the user scales or pans this scale manually. */
    public auto = true;
    private step = 1;

    public constructor(public readonly id: string) {}

    public get mode(): PriceScaleMode {
        return this.options.mode ?? "linear";
    }

    /** Category scales put the first category on top unless `invert: false`. */
    public get inverted() {
        return this.options.invert ?? !!this.options.categories;
    }

    public get isAuto() {
        return this.auto && this.options.autoScale !== false && !this.options.domain;
    }

    /** Raw price -> mode space. */
    public transform(value: number, base = this.base): number {
        switch (this.mode) {
            case "log":
                return value > 0 ? Math.log10(value) : NaN;
            case "percent":
                return (value / base - 1) * 100;
            case "indexed":
                return (value / base) * 100;
            default:
                return value;
        }
    }

    /** Mode space -> raw price. */
    public untransform(value: number, base = this.base): number {
        switch (this.mode) {
            case "log":
                return Math.pow(10, value);
            case "percent":
                return (value / 100 + 1) * base;
            case "indexed":
                return (value / 100) * base;
            default:
                return value;
        }
    }

    /** Mode-space value -> pixel. */
    public yOf(t: number) {
        const span = this.max - this.min || 1;
        const r = (t - this.min) / span;
        return this.inverted ? r * this.height : (1 - r) * this.height;
    }

    /** Pixel -> mode-space value. */
    public tOf(y: number) {
        const r = this.inverted ? y / this.height : 1 - y / this.height;
        return this.min + r * (this.max - this.min);
    }

    /** Raw price -> pixel. */
    public toY(value: number, base?: number) {
        return this.yOf(this.transform(value, base));
    }

    /** Pixel -> raw price. */
    public fromY(y: number, base?: number) {
        return this.untransform(this.tOf(y), base);
    }

    /** Sets the domain from mode-space extents, applying margins. */
    public fit(min: number, max: number) {
        if (!isFiniteNumber(min) || !isFiniteNumber(max)) {
            return;
        }
        if (min === max) {
            const d = Math.abs(min) * 0.01 || 1;
            min -= d;
            max += d;
        }
        const { top, bottom } = this.options.margins ?? { top: 0.1, bottom: 0.1 };
        const span = (max - min) / Math.max(0.05, 1 - top - bottom);
        this.max = max + span * top;
        this.min = min - span * bottom;
        // non-negative data (bars, volume) never pads below zero, so bars sit on the pane bottom
        if (this.mode === "linear" && min >= 0 && this.min < 0) {
            this.min = 0;
        }
    }

    /** Pixel height of one category band (category scales). */
    public get bandHeight() {
        return Math.abs(this.yOf(1) - this.yOf(0));
    }

    public setFixedDomain([a, b]: readonly [number, number]) {
        this.min = this.transform(a);
        this.max = this.transform(b);
    }

    /** Zooms the scale around its center; factor > 1 zooms out. */
    public scaleBy(factor: number) {
        const mid = (this.min + this.max) / 2;
        const half = ((this.max - this.min) / 2) * factor;
        this.min = mid - half;
        this.max = mid + half;
        this.auto = false;
    }

    /** Moves the scale by a pixel delta (positive = content moves down). */
    public panBy(dy: number) {
        const d = ((this.max - this.min) * dy) / (this.height || 1);
        const sign = this.inverted ? -1 : 1;
        this.min += d * sign;
        this.max += d * sign;
        this.auto = false;
    }

    public resetAuto() {
        this.auto = true;
    }

    public ticks(spacing = 40): PriceTick[] {
        const categories = this.options.categories;
        if (categories) {
            const every = Math.max(1, Math.ceil(spacing / 2 / Math.max(1e-9, this.bandHeight)));
            const out: PriceTick[] = [];
            for (let i = Math.max(0, Math.ceil(this.min)); i <= Math.min(categories.length - 1, this.max); i += every) {
                out.push({ value: i, y: this.yOf(i), label: categories[i] });
            }
            return out;
        }
        const count = Math.max(2, Math.round(this.height / spacing));
        let values: number[];
        if (this.mode === "log") {
            values = logTicks(this.min, this.max, count).map((v) => Math.log10(v));
            // even raw steps bunch up toward the top in log space: drop labels that would overlap
            const minGap = spacing * 0.5;
            let lastY = Infinity;
            values = values.filter((t) => {
                const y = this.yOf(t);
                if (Math.abs(y - lastY) < minGap) {
                    return false;
                }
                lastY = y;
                return true;
            });
        } else {
            values = niceTicks(this.min, this.max, count);
        }
        this.step =
            values.length > 1 ? Math.abs(values[1] - values[0]) : niceStep(Math.abs(this.max - this.min), count);
        return values.map((t) => ({
            value: this.mode === "log" ? Math.pow(10, t) : t,
            y: this.yOf(t),
            label: this.formatTick(t),
        }));
    }

    private formatTick(t: number) {
        switch (this.mode) {
            case "percent":
                return formatPercent(t, Math.min(2, decimalsFor(this.step)));
            case "indexed":
                return formatNumber(t, Math.min(2, decimalsFor(this.step)));
            case "log": {
                const v = Math.pow(10, t);
                return (
                    this.options.format?.(v) ?? formatNumber(v, this.options.precision ?? decimalsFor(v < 1 ? v : 1))
                );
            }
            default:
                if (this.options.format) {
                    return this.options.format(t);
                }
                return this.step >= 1e5 && this.options.precision === undefined
                    ? formatCompact(t)
                    : formatNumber(t, this.options.precision ?? decimalsFor(this.step));
        }
    }

    /** Formats a raw price for labels (crosshair, last value) in this scale's mode. */
    public format(value: number, base?: number) {
        if (this.options.categories) {
            return this.options.categories[Math.round(value)] ?? "";
        }
        switch (this.mode) {
            case "percent":
                return formatPercent(this.transform(value, base));
            case "indexed":
                return formatNumber(this.transform(value, base), 2);
            case "log":
                // the tick step is in log units, so it says nothing about price decimals: format like a price
                return this.options.format?.(value) ?? formatPrice(value, this.options.precision);
            default:
                if (this.options.format) {
                    return this.options.format(value);
                }
                if (this.step >= 1e5 && this.options.precision === undefined) {
                    return formatCompact(value);
                }
                return formatNumber(
                    value,
                    this.options.precision ?? Math.max(2, Math.min(8, decimalsFor(this.step) + 1)),
                );
        }
    }
}

/** Ticks for log scales: 1/2/5 multiples per decade, or nice linear ticks when the range is narrow. */
const logTicks = (tMin: number, tMax: number, count: number): number[] => {
    const lo = Math.pow(10, tMin);
    const hi = Math.pow(10, tMax);
    if (!isFiniteNumber(lo) || !isFiniteNumber(hi)) {
        return [];
    }
    if (tMax - tMin < 1) {
        return niceTicks(lo, hi, count).filter((v) => v > 0);
    }
    const out: number[] = [];
    const multiples = tMax - tMin > count / 2 ? [1] : tMax - tMin > count / 4 ? [1, 5] : [1, 2, 5];
    for (let e = Math.floor(tMin); e <= Math.ceil(tMax); e++) {
        for (const m of multiples) {
            const v = m * Math.pow(10, e);
            if (v >= lo && v <= hi) {
                out.push(v);
            }
        }
    }
    return out;
};
