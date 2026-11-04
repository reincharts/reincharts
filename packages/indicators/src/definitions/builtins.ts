import { movingAverageTypes, priceSources, type MovingAverageType, type Source } from "../calculators/core";
import { emaK, hmaK, read, smaK, tmaK, vwmaK, wmaK, out, period as p } from "../calculators/core";
import { elderImpulse, elderRay } from "../calculators/misc";
import { aroon, cci, macd, mfi, momentum, roc, rsi, stochastic, williamsR } from "../calculators/oscillators";
import { dmi, ichimoku, sar, supertrend } from "../calculators/trend";
import { atr, bollinger, donchian, envelope, keltner, stddev } from "../calculators/volatility";
import { obv, smoothedForceIndex, volume, vwap } from "../calculators/volume";
import {
    defineIndicator,
    type IndicatorDefinition,
    type IndicatorInput,
    type IndicatorLevel,
    type IndicatorOutput,
} from "./types";

// ------------------------------------------------------------------ input / output helpers

const num = (label: string, value: number, min = 1, max = 1000, step = 1): IndicatorInput => ({
    type: "number",
    label,
    default: value,
    min,
    max,
    step,
});
const length = (value: number) => num("Length", value);
const source = (value = "close"): IndicatorInput => ({
    type: "source",
    label: "Source",
    default: value,
    options: priceSources,
});
const maType = (value: MovingAverageType = "sma", label = "MA type"): IndicatorInput => ({
    type: "select",
    label,
    default: value,
    options: movingAverageTypes,
});
const line = (label: string, color?: string, extra: Partial<IndicatorOutput> = {}): IndicatorOutput => ({
    type: "line",
    label,
    color,
    ...extra,
});
const histogram = (label: string, color?: string, extra: Partial<IndicatorOutput> = {}): IndicatorOutput => ({
    type: "histogram",
    label,
    color,
    ...extra,
});
/** Overbought / oversold levels with a middle line. */
const levels = (upper: number, lower: number, middle?: number): IndicatorLevel[] => [
    { value: upper, label: "Upper" },
    ...(middle === undefined ? [] : [{ value: middle, label: "Middle", dash: true }]),
    { value: lower, label: "Lower" },
];

const BLUE = "#2962ff";
const ORANGE = "#ff6d00";
const PURPLE = "#7e57c2";
const RED = "#f23645";
const GREEN = "#089981";
const BAND_FILL = "rgba(33, 150, 243, 0.08)";

/** Inputs of the moving average definitions. */
export interface MAInputs {
    /** Number of bars. */
    period: number;
    /** Price source or accessor. */
    source: Source;
}

const movingAverageDef = (
    id: string,
    name: string,
    shortName: string,
    value: number,
    kernel: (x: Float64Array, n: number, data: readonly any[]) => Float64Array,
    description: string,
) =>
    defineIndicator<MAInputs>({
        id,
        name,
        shortName,
        category: "trend",
        overlay: true,
        description,
        inputs: { period: length(value), source: source() },
        outputs: { ma: line(shortName) },
        calculate: (data, i) => ({ ma: out(kernel(read(data, i.source), p(i.period, value), data)) }),
    });

// ------------------------------------------------------------------ moving averages

export const smaIndicator = movingAverageDef("sma", "Moving Average", "MA", 9, smaK, "Simple moving average.");
export const emaIndicator = movingAverageDef(
    "ema",
    "Moving Average Exponential",
    "EMA",
    9,
    (x, n) => emaK(x, n),
    "Exponential moving average.",
);
export const wmaIndicator = movingAverageDef(
    "wma",
    "Moving Average Weighted",
    "WMA",
    9,
    wmaK,
    "Linearly weighted moving average.",
);
export const tmaIndicator = movingAverageDef(
    "tma",
    "Triangular Moving Average",
    "TMA",
    9,
    tmaK,
    "Double smoothed SMA.",
);
export const hmaIndicator = movingAverageDef(
    "hma",
    "Hull Moving Average",
    "HMA",
    9,
    hmaK,
    "Low lag Hull moving average.",
);
export const vwmaIndicator = movingAverageDef(
    "vwma",
    "Volume Weighted Moving Average",
    "VWMA",
    20,
    (x, n, data) => vwmaK(x, read(data, "volume"), n),
    "Moving average weighted by volume.",
);

// ------------------------------------------------------------------ bands / channels

export const bollingerIndicator = defineIndicator<{
    period: number;
    source: Source;
    multiplier: number;
    maType: MovingAverageType;
}>({
    id: "bollinger",
    name: "Bollinger Bands",
    shortName: "BB",
    category: "volatility",
    overlay: true,
    description: "Moving average ± standard deviations.",
    inputs: { period: length(20), source: source(), multiplier: num("StdDev", 2, 0.1, 50, 0.1), maType: maType("sma") },
    outputs: {
        middle: line("Basis", ORANGE, { width: 1 }),
        upper: line("Upper", BLUE, { width: 1 }),
        lower: line("Lower", BLUE, { width: 1 }),
    },
    fills: [{ between: ["upper", "lower"], color: BAND_FILL }],
    calculate: (data, i) => ({ ...bollinger(data, i) }),
});

export const keltnerIndicator = defineIndicator<{
    period: number;
    multiplier: number;
    source: Source;
    maType: MovingAverageType;
    bandsStyle: "atr" | "tr" | "range";
    atrPeriod: number;
}>({
    id: "keltner",
    name: "Keltner Channels",
    shortName: "KC",
    category: "volatility",
    overlay: true,
    description: "Moving average ± ATR multiples.",
    inputs: {
        period: length(20),
        multiplier: num("Multiplier", 2, 0.1, 50, 0.1),
        source: source(),
        maType: maType("ema"),
        bandsStyle: { type: "select", label: "Bands style", default: "atr", options: ["atr", "tr", "range"] },
        atrPeriod: num("ATR length", 10),
    },
    outputs: {
        upper: line("Upper", BLUE, { width: 1 }),
        middle: line("Basis", BLUE, { width: 1 }),
        lower: line("Lower", BLUE, { width: 1 }),
    },
    fills: [{ between: ["upper", "lower"], color: BAND_FILL }],
    calculate: (data, i) => ({ ...keltner(data, i) }),
});

export const donchianIndicator = defineIndicator<{ period: number }>({
    id: "donchian",
    name: "Donchian Channels",
    shortName: "DC",
    category: "volatility",
    overlay: true,
    description: "Highest high and lowest low over a period.",
    inputs: { period: length(20) },
    outputs: {
        upper: line("Upper", BLUE, { width: 1 }),
        middle: line("Basis", ORANGE, { width: 1 }),
        lower: line("Lower", BLUE, { width: 1 }),
    },
    fills: [{ between: ["upper", "lower"], color: BAND_FILL }],
    calculate: (data, i) => ({ ...donchian(data, i) }),
});

export const envelopeIndicator = defineIndicator<{
    period: number;
    percent: number;
    source: Source;
    maType: MovingAverageType;
}>({
    id: "envelope",
    name: "Envelope",
    shortName: "Env",
    category: "volatility",
    overlay: true,
    description: "Moving average ± a percentage.",
    inputs: {
        period: length(20),
        percent: num("Percent", 10, 0.01, 100, 0.1),
        source: source(),
        maType: maType("sma"),
    },
    outputs: {
        upper: line("Upper", BLUE, { width: 1 }),
        middle: line("Basis", ORANGE, { width: 1 }),
        lower: line("Lower", BLUE, { width: 1 }),
    },
    fills: [{ between: ["upper", "lower"], color: BAND_FILL }],
    calculate: (data, i) => ({ ...envelope(data, i) }),
});

// ------------------------------------------------------------------ trend

export const sarIndicator = defineIndicator<{ start: number; increment: number; max: number }>({
    id: "sar",
    name: "Parabolic SAR",
    shortName: "SAR",
    category: "trend",
    overlay: true,
    description: "Stop and reverse trailing points.",
    inputs: {
        start: num("Start", 0.02, 0.001, 1, 0.001),
        increment: num("Increment", 0.02, 0.001, 1, 0.001),
        max: num("Max value", 0.2, 0.01, 1, 0.01),
    },
    outputs: { sar: { type: "dots", label: "SAR", color: BLUE, width: 1.5 } },
    calculate: (data, i) => ({ sar: sar(data, i) }),
});

export const supertrendIndicator = defineIndicator<{ period: number; factor: number }>({
    id: "supertrend",
    name: "Supertrend",
    shortName: "Supertrend",
    category: "trend",
    overlay: true,
    description: "ATR trailing stop that flips with the trend.",
    inputs: { period: num("ATR length", 10), factor: num("Factor", 3, 0.01, 100, 0.01) },
    outputs: { up: line("Up trend", GREEN, { width: 2 }), down: line("Down trend", RED, { width: 2 }) },
    calculate: (data, i) => ({ ...supertrend(data, i) }),
});

export const ichimokuIndicator = defineIndicator<{
    conversion: number;
    base: number;
    spanB: number;
    displacement: number;
}>({
    id: "ichimoku",
    name: "Ichimoku Cloud",
    shortName: "Ichimoku",
    category: "trend",
    overlay: true,
    description: "Conversion / base lines, leading spans cloud and lagging span.",
    inputs: {
        conversion: num("Conversion line length", 9),
        base: num("Base line length", 26),
        spanB: num("Leading span B length", 52),
        displacement: num("Lagging span", 26),
    },
    outputs: {
        conversion: line("Conversion line", BLUE, { width: 1 }),
        base: line("Base line", "#b71c1c", { width: 1 }),
        lagging: line("Lagging span", "#43a047", { width: 1, offset: (i) => -(p(i.displacement, 26) - 1) }),
        spanA: line("Leading span A", "#a5d6a7", { width: 1, offset: (i) => p(i.displacement, 26) - 1 }),
        spanB: line("Leading span B", "#ef9a9a", { width: 1, offset: (i) => p(i.displacement, 26) - 1 }),
    },
    fills: [{ between: ["spanA", "spanB"], color: "rgba(67, 160, 71, 0.12)", colorBelow: "rgba(244, 67, 54, 0.12)" }],
    calculate: (data, i) => {
        const r = ichimoku(data, i);
        return { conversion: r.conversion, base: r.base, spanA: r.spanA, spanB: r.spanB, lagging: r.lagging };
    },
});

const dmiInputs = { period: num("DI length", 14), adxSmoothing: num("ADX smoothing", 14) };

export const dmiIndicator = defineIndicator<{ period: number; adxSmoothing: number }>({
    id: "dmi",
    name: "Directional Movement Index",
    shortName: "DMI",
    category: "trend",
    overlay: false,
    description: "+DI, −DI and ADX trend strength.",
    inputs: dmiInputs,
    outputs: { adx: line("ADX", "#f50057"), plusDI: line("+DI", BLUE), minusDI: line("−DI", ORANGE) },
    scale: { precision: 2 },
    calculate: (data, i) => ({ ...dmi(data, i) }),
});

export const adxIndicator = defineIndicator<{ period: number; adxSmoothing: number }>({
    id: "adx",
    name: "Average Directional Index",
    shortName: "ADX",
    category: "trend",
    overlay: false,
    description: "Trend strength regardless of direction.",
    inputs: dmiInputs,
    outputs: { adx: line("ADX", "#f50057") },
    scale: { precision: 2 },
    calculate: (data, i) => ({ adx: dmi(data, i).adx }),
});

export const aroonIndicator = defineIndicator<{ period: number }>({
    id: "aroon",
    name: "Aroon",
    shortName: "Aroon",
    category: "trend",
    overlay: false,
    description: "Bars since the highest high / lowest low.",
    inputs: { period: length(14) },
    outputs: { up: line("Aroon Up", ORANGE), down: line("Aroon Down", BLUE) },
    scale: { domain: [0, 100], precision: 2 },
    calculate: (data, i) => {
        const r = aroon(data, i);
        return { up: r.up, down: r.down };
    },
});

// ------------------------------------------------------------------ momentum

export const macdIndicator = defineIndicator<{
    fast: number;
    slow: number;
    source: Source;
    signal: number;
    maType: MovingAverageType;
    signalMaType: MovingAverageType;
}>({
    id: "macd",
    name: "MACD",
    shortName: "MACD",
    category: "momentum",
    overlay: false,
    description: "Moving average convergence / divergence with signal and histogram.",
    inputs: {
        fast: num("Fast length", 12),
        slow: num("Slow length", 26),
        source: source(),
        signal: num("Signal smoothing", 9, 1, 50),
        maType: maType("ema", "Oscillator MA type"),
        signalMaType: maType("ema", "Signal MA type"),
    },
    outputs: {
        histogram: histogram("Histogram", "#26a69a", {
            colorFn: (v, prev) =>
                v >= 0
                    ? prev !== undefined && prev > v
                        ? "#b2dfdb"
                        : "#26a69a"
                    : prev !== undefined && prev < v
                      ? "#ffcdd2"
                      : "#ff5252",
        }),
        macd: line("MACD", BLUE),
        signal: line("Signal", ORANGE),
    },
    levels: [{ value: 0, label: "Zero", dash: false }],
    calculate: (data, i) => ({ ...macd(data, i) }),
});

export const rsiIndicator = defineIndicator<{ period: number; source: Source }>({
    id: "rsi",
    name: "Relative Strength Index",
    shortName: "RSI",
    category: "momentum",
    overlay: false,
    description: "Momentum oscillator between 0 and 100.",
    inputs: { period: length(14), source: source() },
    outputs: { rsi: line("RSI", PURPLE) },
    levels: levels(70, 30, 50),
    fills: [{ between: [70, 30], color: "rgba(126, 87, 194, 0.1)" }],
    scale: { domain: [0, 100], precision: 2 },
    calculate: (data, i) => ({ rsi: rsi(data, i) }),
});

export const stochasticIndicator = defineIndicator<{ period: number; kSmoothing: number; dSmoothing: number }>({
    id: "stochastic",
    name: "Stochastic",
    shortName: "Stoch",
    category: "momentum",
    overlay: false,
    description: "%K / %D stochastic oscillator (fast with %K smoothing 1, slow with 3).",
    inputs: { period: num("%K length", 14), kSmoothing: num("%K smoothing", 1), dSmoothing: num("%D smoothing", 3) },
    outputs: { k: line("%K", BLUE), d: line("%D", ORANGE) },
    levels: levels(80, 20, 50),
    fills: [{ between: [80, 20], color: BAND_FILL }],
    scale: { domain: [0, 100], precision: 2 },
    calculate: (data, i) => ({ ...stochastic(data, i) }),
});

export const cciIndicator = defineIndicator<{ period: number; source: Source }>({
    id: "cci",
    name: "Commodity Channel Index",
    shortName: "CCI",
    category: "momentum",
    overlay: false,
    description: "Deviation of the price from its average.",
    inputs: { period: length(20), source: source("hlc3") },
    outputs: { cci: line("CCI", BLUE) },
    levels: levels(100, -100, 0),
    fills: [{ between: [100, -100], color: BAND_FILL }],
    scale: { precision: 2 },
    calculate: (data, i) => ({ cci: cci(data, i) }),
});

export const williamsRIndicator = defineIndicator<{ period: number }>({
    id: "williamsR",
    name: "Williams %R",
    shortName: "%R",
    category: "momentum",
    overlay: false,
    description: "Close relative to the high / low range, from −100 to 0.",
    inputs: { period: length(14) },
    outputs: { r: line("%R", PURPLE) },
    levels: levels(-20, -80, -50),
    fills: [{ between: [-20, -80], color: "rgba(126, 87, 194, 0.1)" }],
    scale: { domain: [-100, 0], precision: 2 },
    calculate: (data, i) => ({ r: williamsR(data, i) }),
});

export const mfiIndicator = defineIndicator<{ period: number; source: Source }>({
    id: "mfi",
    name: "Money Flow Index",
    shortName: "MFI",
    category: "volume",
    overlay: false,
    description: "Volume weighted RSI.",
    inputs: { period: length(14), source: source("hlc3") },
    outputs: { mfi: line("MF", PURPLE) },
    levels: levels(80, 20, 50),
    fills: [{ between: [80, 20], color: "rgba(126, 87, 194, 0.1)" }],
    scale: { domain: [0, 100], precision: 2 },
    calculate: (data, i) => ({ mfi: mfi(data, i) }),
});

export const rocIndicator = defineIndicator<{ period: number; source: Source }>({
    id: "roc",
    name: "Rate Of Change",
    shortName: "ROC",
    category: "momentum",
    overlay: false,
    description: "Percent change over a number of bars.",
    inputs: { period: length(9), source: source() },
    outputs: { roc: line("ROC", BLUE) },
    levels: [{ value: 0, label: "Zero" }],
    scale: { precision: 2 },
    calculate: (data, i) => ({ roc: roc(data, i) }),
});

export const momentumIndicator = defineIndicator<{ period: number; source: Source }>({
    id: "momentum",
    name: "Momentum",
    shortName: "Mom",
    category: "momentum",
    overlay: false,
    description: "Price change over a number of bars.",
    inputs: { period: length(10), source: source() },
    outputs: { momentum: line("Momentum", BLUE) },
    levels: [{ value: 0, label: "Zero" }],
    calculate: (data, i) => ({ momentum: momentum(data, i) }),
});

export const elderRayIndicator = defineIndicator<{ period: number; source: Source; maType: MovingAverageType }>({
    id: "elderRay",
    name: "Elder Ray (Bull / Bear Power)",
    shortName: "ER",
    category: "momentum",
    overlay: false,
    description: "High and low distance from an EMA.",
    inputs: { period: length(13), source: source(), maType: maType("ema") },
    outputs: { bullPower: histogram("Bull power", "#26a69a"), bearPower: histogram("Bear power", "#ef5350") },
    levels: [{ value: 0, label: "Zero", dash: false }],
    calculate: (data, i) => ({ ...elderRay(data, i) }),
});

export const elderImpulseIndicator = defineIndicator<{
    period: number;
    fast: number;
    slow: number;
    signal: number;
    source: Source;
}>({
    id: "elderImpulse",
    name: "Elder Impulse System",
    shortName: "Impulse",
    category: "momentum",
    overlay: false,
    description: "EMA slope + MACD histogram slope: 1 bullish, −1 bearish, 0 neutral.",
    inputs: {
        period: num("EMA length", 13),
        fast: num("MACD fast", 12),
        slow: num("MACD slow", 26),
        signal: num("MACD signal", 9),
        source: source(),
    },
    outputs: {
        impulse: histogram("Impulse", BLUE, {
            colorFn: (v, _p, _i, { theme }) => (v > 0 ? theme.up : v < 0 ? theme.down : BLUE),
        }),
    },
    scale: { domain: [-1, 1], precision: 0 },
    calculate: (data, i) => ({ impulse: elderImpulse(data, i) }),
});

// ------------------------------------------------------------------ volatility

export const atrIndicator = defineIndicator<{ period: number; maType: MovingAverageType }>({
    id: "atr",
    name: "Average True Range",
    shortName: "ATR",
    category: "volatility",
    overlay: false,
    description: "Average of the true range (Wilder).",
    inputs: { period: length(14), maType: maType("rma", "Smoothing") },
    outputs: { atr: line("ATR", "#b71c1c") },
    calculate: (data, i) => ({ atr: atr(data, i) }),
});

export const stddevIndicator = defineIndicator<{ period: number; source: Source }>({
    id: "stddev",
    name: "Standard Deviation",
    shortName: "StdDev",
    category: "volatility",
    overlay: false,
    description: "Population standard deviation of the price.",
    inputs: { period: length(20), source: source() },
    outputs: { stddev: line("StdDev", BLUE) },
    calculate: (data, i) => ({ stddev: stddev(data, i) }),
});

// ------------------------------------------------------------------ volume

export const volumeIndicator = defineIndicator<{ period: number; maType: MovingAverageType }>({
    id: "volume",
    name: "Volume",
    shortName: "Vol",
    category: "volume",
    overlay: false,
    description: "Volume bars colored by candle direction with a moving average.",
    inputs: { period: num("MA length", 20), maType: maType("sma") },
    outputs: {
        volume: histogram("Volume", undefined, {
            colorFn: (_v, _p, i, { outputs, theme }) =>
                (outputs.direction?.[i] ?? 1) >= 0 ? theme.volume.up : theme.volume.down,
        }),
        ma: line("Volume MA", BLUE, { width: 1 }),
    },
    scale: { compact: true },
    calculate: (data, i) => ({ ...volume(data, i) }),
});

export const vwapIndicator = defineIndicator<{
    anchor: "session" | "week" | "month" | "year";
    source: Source;
    bandMultiplier: number;
}>({
    id: "vwap",
    name: "VWAP",
    shortName: "VWAP",
    category: "volume",
    overlay: true,
    description: "Anchored volume weighted average price with deviation bands.",
    inputs: {
        anchor: {
            type: "select",
            label: "Anchor period",
            default: "session",
            options: ["session", "week", "month", "year"],
        },
        source: source("hlc3"),
        bandMultiplier: num("Bands multiplier", 1, 0.1, 10, 0.1),
    },
    outputs: {
        vwap: line("VWAP", BLUE, { width: 1.5 }),
        upper: line("Upper band", GREEN, { width: 1 }),
        lower: line("Lower band", GREEN, { width: 1 }),
    },
    fills: [{ between: ["upper", "lower"], color: "rgba(8, 153, 129, 0.08)" }],
    calculate: (data, i) => ({ ...vwap(data, i) }),
});

export const obvIndicator = defineIndicator<{ source: Source }>({
    id: "obv",
    name: "On Balance Volume",
    shortName: "OBV",
    category: "volume",
    overlay: false,
    description: "Cumulative volume signed by price direction.",
    inputs: { source: source() },
    outputs: { obv: line("OBV", BLUE) },
    scale: { compact: true },
    calculate: (data, i) => ({ obv: obv(data, i) }),
});

export const forceIndexIndicator = defineIndicator<{ period: number; source: Source; maType: MovingAverageType }>({
    id: "forceIndex",
    name: "Elder Force Index",
    shortName: "EFI",
    category: "volume",
    overlay: false,
    description: "Price change × volume, smoothed (length 1 = raw force index).",
    inputs: { period: length(13), source: source(), maType: maType("ema") },
    outputs: { force: line("Elder Force Index", RED) },
    levels: [{ value: 0, label: "Zero" }],
    scale: { compact: true },
    calculate: (data, i) => {
        const r = smoothedForceIndex(data, i);
        return { force: i.period <= 1 ? r.force : r.smoothed, raw: r.force };
    },
});

/** Every built-in indicator definition keyed by id. */
export const indicators: Record<string, IndicatorDefinition> = Object.fromEntries(
    [
        smaIndicator,
        emaIndicator,
        wmaIndicator,
        tmaIndicator,
        hmaIndicator,
        vwmaIndicator,
        bollingerIndicator,
        keltnerIndicator,
        donchianIndicator,
        envelopeIndicator,
        vwapIndicator,
        ichimokuIndicator,
        supertrendIndicator,
        sarIndicator,
        dmiIndicator,
        adxIndicator,
        aroonIndicator,
        macdIndicator,
        rsiIndicator,
        stochasticIndicator,
        cciIndicator,
        williamsRIndicator,
        mfiIndicator,
        rocIndicator,
        momentumIndicator,
        elderRayIndicator,
        elderImpulseIndicator,
        atrIndicator,
        stddevIndicator,
        volumeIndicator,
        obvIndicator,
        forceIndexIndicator,
    ].map((d) => [d.id, d as IndicatorDefinition]),
);
