import type { MovingAverageType, Source } from "./calculators/core";
import {
    atrIndicator,
    bollingerIndicator,
    elderRayIndicator,
    emaIndicator,
    forceIndexIndicator,
    hmaIndicator,
    macdIndicator,
    rsiIndicator,
    sarIndicator,
    smaIndicator,
    stochasticIndicator,
    tmaIndicator,
    vwmaIndicator,
    wmaIndicator,
} from "./definitions/builtins";
import type { IndicatorDefinition } from "./definitions/types";
import { Indicator, type IndicatorProps } from "./Indicator";

/** Props shared by the convenience indicator components (everything of `<Indicator>` except definition / inputs). */
export type IndicatorComponentProps = Omit<IndicatorProps, "definition" | "inputs">;

/** Picks the definition's input keys out of the props. */
const render = (definition: IndicatorDefinition, props: Record<string, unknown>, styles?: IndicatorProps["styles"]) => {
    const inputs: Record<string, unknown> = {};
    const rest: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
        if (key in definition.inputs) {
            inputs[key] = value;
        } else {
            rest[key] = value;
        }
    }
    return (
        <Indicator
            {...(rest as IndicatorComponentProps)}
            styles={styles ?? (rest.styles as IndicatorProps["styles"])}
            definition={definition}
            inputs={inputs}
        />
    );
};

const singleStyle = (key: string, color?: string, width?: number, styles?: IndicatorProps["styles"]) =>
    color === undefined && width === undefined ? styles : { ...styles, [key]: { ...styles?.[key], color, width } };

const movingAverages = {
    sma: smaIndicator,
    ema: emaIndicator,
    wma: wmaIndicator,
    tma: tmaIndicator,
    hma: hmaIndicator,
    vwma: vwmaIndicator,
} as const;

export interface MovingAverageProps extends IndicatorComponentProps {
    /** Moving average kind. Default "sma". */
    readonly type?: keyof typeof movingAverages;
    /** Number of bars. Default 9 (20 for vwma). */
    readonly period?: number;
    /** Price source or accessor. Default "close". */
    readonly source?: Source;
    /** Line color. Defaults to the next theme palette color. */
    readonly color?: string;
    /** Line width. Default 1.5. */
    readonly width?: number;
}

/** A moving average line (SMA, EMA, WMA, TMA, HMA or VWMA) on the price pane. */
export function MovingAverage({ type = "sma", color, width, styles, ...props }: MovingAverageProps) {
    return render(movingAverages[type], props, singleStyle("ma", color, width, styles));
}

export interface BollingerBandsProps extends IndicatorComponentProps {
    /** Number of bars. Default 20. */
    readonly period?: number;
    /** Standard deviations. Default 2. */
    readonly multiplier?: number;
    /** Price source or accessor. Default "close". */
    readonly source?: Source;
    /** Basis moving average. Default "sma". */
    readonly maType?: MovingAverageType;
}

/** Bollinger Bands with a filled band. */
export const BollingerBands = (props: BollingerBandsProps) => render(bollingerIndicator, { ...props });

export interface MACDProps extends IndicatorComponentProps {
    /** Fast length. Default 12. */
    readonly fast?: number;
    /** Slow length. Default 26. */
    readonly slow?: number;
    /** Signal length. Default 9. */
    readonly signal?: number;
    /** Price source or accessor. Default "close". */
    readonly source?: Source;
    /** Fast / slow MA type. Default "ema". */
    readonly maType?: MovingAverageType;
    /** Signal MA type. Default "ema". */
    readonly signalMaType?: MovingAverageType;
}

/** MACD line, signal line and 4-color histogram. Place it in its own `<Pane>`. */
export const MACD = (props: MACDProps) => render(macdIndicator, { ...props });

export interface RSIProps extends IndicatorComponentProps {
    /** Number of bars. Default 14. */
    readonly period?: number;
    /** Price source or accessor. Default "close". */
    readonly source?: Source;
}

/** Relative Strength Index with 30 / 50 / 70 levels and a filled 30–70 band. Place it in its own `<Pane>`. */
export const RSI = (props: RSIProps) => render(rsiIndicator, { ...props });

export interface StochasticProps extends IndicatorComponentProps {
    /** "fast" (%K smoothing 1), "slow" (%K smoothing 3) or "full" (use `kSmoothing`). Default "full". */
    readonly variant?: "fast" | "slow" | "full";
    /** %K lookback. Default 14. */
    readonly period?: number;
    /** %K smoothing (full variant). Default 1. */
    readonly kSmoothing?: number;
    /** %D length. Default 3. */
    readonly dSmoothing?: number;
}

/** Stochastic oscillator (%K, %D) with 20 / 80 levels. Place it in its own `<Pane>`. */
export function Stochastic({ variant = "full", kSmoothing, ...props }: StochasticProps) {
    const k = variant === "fast" ? 1 : variant === "slow" ? 3 : kSmoothing;
    return render(stochasticIndicator, { ...props, kSmoothing: k });
}

export interface ATRProps extends IndicatorComponentProps {
    /** Number of bars. Default 14. */
    readonly period?: number;
    /** Smoothing. Default "rma" (Wilder). */
    readonly maType?: MovingAverageType;
}

/** Average True Range. Place it in its own `<Pane>`. */
export const ATR = (props: ATRProps) => render(atrIndicator, { ...props });

export interface ElderRayProps extends IndicatorComponentProps {
    /** MA length. Default 13. */
    readonly period?: number;
    /** Price source or accessor. Default "close". */
    readonly source?: Source;
    /** MA type. Default "ema". */
    readonly maType?: MovingAverageType;
}

/** Elder ray bull / bear power histograms. Place it in its own `<Pane>`. */
export const ElderRay = (props: ElderRayProps) => render(elderRayIndicator, { ...props });

export interface ForceIndexProps extends IndicatorComponentProps {
    /** Smoothing length (1 = raw force index). Default 13. */
    readonly period?: number;
    /** Price source or accessor. Default "close". */
    readonly source?: Source;
    /** Smoothing type. Default "ema". */
    readonly maType?: MovingAverageType;
}

/** Elder force index. Place it in its own `<Pane>`. */
export const ForceIndex = (props: ForceIndexProps) => render(forceIndexIndicator, { ...props });

export interface SARProps extends IndicatorComponentProps {
    /** Initial acceleration factor. Default 0.02. */
    readonly start?: number;
    /** Acceleration increment. Default 0.02. */
    readonly increment?: number;
    /** Maximum acceleration. Default 0.2. */
    readonly max?: number;
    /** Dot color. Default blue. */
    readonly color?: string;
}

/** Parabolic SAR dots on the price pane. */
export function SAR({ color, styles, ...props }: SARProps) {
    return render(sarIndicator, props, singleStyle("sar", color, undefined, styles));
}
