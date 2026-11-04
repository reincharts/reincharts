import type { LineDash, Theme } from "@reincharts/core";
import type { Values } from "../calculators/core";

/** One user-editable setting of an indicator (rendered by settings dialogs). */
export interface IndicatorInput {
    /** Editor kind. "source" values are price sources (`"close"`, `"hl2"`...) or, in code, any accessor. */
    type: "number" | "source" | "select" | "boolean" | "color";
    /** Label shown in settings dialogs. */
    label: string;
    /** Default value. */
    default: unknown;
    /** Minimum (number inputs). */
    min?: number;
    /** Maximum (number inputs). */
    max?: number;
    /** Step (number inputs). */
    step?: number;
    /** Choices ("select" and "source" inputs). */
    options?: readonly string[];
}

/** Extra context passed to `IndicatorOutput.colorFn`. */
export interface IndicatorColorContext {
    /** Chart data. */
    readonly data: readonly any[];
    /** Every array returned by `calculate`. */
    readonly outputs: Readonly<Record<string, Values>>;
    /** Current chart theme. */
    readonly theme: Theme;
}

/** One plotted output of an indicator. */
export interface IndicatorOutput {
    /** How the output is drawn. "step" is a step line, "dots" are circles (e.g. Parabolic SAR). */
    type: "line" | "histogram" | "area" | "dots" | "step";
    /** Name in settings dialogs and the object tree. */
    label: string;
    /** Default color. Defaults to the theme palette. */
    color?: string;
    /** Line width / dot radius. Default 1.5 for lines (1 for bands), 2 for dots. */
    width?: number;
    /** Per-bar color, e.g. MACD histogram growing / falling colors. Overrides `color` for histograms and dots. */
    colorFn?: (value: number, prev: number | undefined, index: number, context: IndicatorColorContext) => string;
    /** Line dash. Default solid. */
    dash?: LineDash;
    /** Bars to shift the output to the right (negative = left), e.g. Ichimoku spans. May depend on the inputs. */
    offset?: number | ((inputs: any) => number);
    /** Base value of histograms and areas. Histograms default to 0, areas fill down to the pane bottom. */
    base?: number;
    /** Hidden until enabled in `styles` (e.g. optional bands). */
    hidden?: boolean;
}

/** A horizontal reference line, e.g. RSI 30 / 70. */
export interface IndicatorLevel {
    value: number;
    /** Label (settings dialogs). */
    label?: string;
    /** Dashed line. Default true. */
    dash?: boolean;
    /** Line color. Defaults to the muted theme text color. */
    color?: string;
}

/** A filled area between two outputs (by key) or an output and a constant / two constants. */
export interface IndicatorFill {
    /** Output keys or constant values, e.g. `["upper", "lower"]`, `[70, 30]`. */
    between: [string, string] | [string, number] | [string | number, string | number];
    /** Fill color. Defaults to the first output's color at low opacity. */
    color?: string;
    /** Color where the first value is below the second (e.g. bearish Ichimoku cloud). Default `color`. */
    colorBelow?: string;
}

/** Everything needed to compute, draw, name and configure an indicator. */
export interface IndicatorDefinition<I = any> {
    /** Unique id (registry key, saved layouts). */
    id: string;
    /** Full name, e.g. "Relative Strength Index". */
    name: string;
    /** Legend prefix, e.g. "RSI". */
    shortName: string;
    category: "trend" | "momentum" | "volatility" | "volume" | "other";
    /** True = drawn on the price pane, false = needs its own pane. */
    overlay: boolean;
    /** User settings (keys are passed to `calculate`). Declaration order = legend name order. */
    inputs: Record<string, IndicatorInput>;
    /** Plotted outputs (keys of the arrays returned by `calculate`). Declaration order = draw and legend order. */
    outputs: Record<string, IndicatorOutput>;
    levels?: { value: number; label?: string; dash?: boolean; color?: string }[];
    fills?: IndicatorFill[];
    /** Scale hints: a domain always included in autoscale (oscillators), legend precision, compact (volume) labels. */
    scale?: { domain?: [number, number]; precision?: number; compact?: boolean };
    /** Short description for indicator pickers. */
    description?: string;
    /** Custom legend name. Default: shortName followed by number / source inputs (e.g. "RSI 14 close"). */
    formatName?: (inputs: I) => string;
    /** Computes every output array (aligned 1:1 with `data`) from fully resolved inputs. */
    calculate(data: readonly any[], inputs: I): Record<string, (number | undefined)[]>;
}

/** Identity helper that types a custom indicator definition. */
export const defineIndicator = <I>(def: IndicatorDefinition<I>): IndicatorDefinition<I> => def;

/** Default input values of a definition. */
export const defaultInputs = <I>(def: IndicatorDefinition<I>): I => {
    const out: Record<string, unknown> = {};
    for (const [key, input] of Object.entries(def.inputs)) {
        out[key] = input.default;
    }
    return out as I;
};

/** Defaults merged with partial inputs (undefined values fall back to defaults). */
export const resolveInputs = <I>(def: IndicatorDefinition<I>, inputs?: Partial<I>): I => {
    const out = defaultInputs(def) as Record<string, unknown>;
    for (const [key, value] of Object.entries(inputs ?? {})) {
        if (value !== undefined) {
            out[key] = value;
        }
    }
    return out as I;
};

/**
 * Legend name: short name followed by number and source inputs, plus select inputs that differ
 * from their default ("RSI 14 close", "BB 20 close 2", "MA 9 close ema").
 */
export const indicatorName = <I>(def: IndicatorDefinition<I>, inputs?: Partial<I>): string => {
    const resolved = resolveInputs(def, inputs);
    if (def.formatName) {
        return def.formatName(resolved);
    }
    const parts = [def.shortName];
    for (const [key, input] of Object.entries(def.inputs)) {
        const v = (resolved as Record<string, unknown>)[key];
        if (input.type === "number" && typeof v === "number") {
            parts.push(String(v));
        } else if (input.type === "source" && typeof v === "string") {
            parts.push(v);
        } else if (input.type === "select" && v !== input.default && v !== undefined) {
            parts.push(String(v));
        }
    }
    return parts.join(" ");
};
