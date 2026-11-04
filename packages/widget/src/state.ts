import type { CrosshairMode } from "@reincharts/coordinates";
import type { IndicatorDefinition, IndicatorOutputStyle } from "@reincharts/indicators";

/** Every chart type id, in chart type menu order (unknown ids in a saved state fall back to "candles"). */
export const CHART_TYPE_IDS = [
    "candles",
    "hollowCandles",
    "bars",
    "heikinAshi",
    "line",
    "stepLine",
    "area",
    "baseline",
    "columns",
    "hlcArea",
    "renko",
    "kagi",
    "pointAndFigure",
    "lineBreak",
] as const;
/** Every price scale mode: linear, logarithmic, percent change from the first visible bar, indexed to 100. */
export const SCALE_MODES = ["linear", "log", "percent", "indexed"] as const;
/** Every multi-chart layout id, in layout menu order. */
export const LAYOUTS = ["single", "2h", "2v", "3", "4"] as const;

/** Main series styles offered by the chart type menu. */
export type ChartType = (typeof CHART_TYPE_IDS)[number];

/** Price scale mode of the main pane. */
export type ScaleMode = (typeof SCALE_MODES)[number];

/** Multi-chart grid: one chart, two side by side ("2h"), two stacked ("2v"), one big + two ("3") or 2×2 ("4"). */
export type LayoutKind = (typeof LAYOUTS)[number];

/** Id of the main (price) pane. Overlay indicators use it as their `paneId`. */
export const PRICE_PANE = "price";

/** One indicator on the chart (serializable). */
export interface IndicatorState {
    /** Unique id on this chart (legend / visibility id). */
    id: string;
    /** Registry key of the definition (`indicators[definitionId]` or an `extraIndicators` id). */
    definitionId: string;
    /** Inputs that differ from (or override) the definition defaults. */
    inputs: Record<string, unknown>;
    /** Per output style overrides (color, width, visible). */
    styles: Record<string, IndicatorOutputStyle>;
    /** Pane the indicator is drawn in: `"price"` for overlays, otherwise its own pane id. */
    paneId: string;
    /** Hidden with the legend eye button. */
    hidden?: boolean;
}

/** User preferences edited in the settings dialog (missing fields fall back to the TradingChart props). */
export interface TradingChartSettings {
    /** Crosshair mode. */
    crosshair?: CrosshairMode;
    /** Volume histogram at the bottom of the price pane. */
    volume?: boolean;
    /** Symbol watermark behind the series. */
    watermark?: boolean;
    /** Pane legends. */
    legend?: boolean;
    /** Grid lines. */
    grid?: boolean;
    /** Dotted line at the last price. */
    lastPriceLine?: boolean;
    /** IANA time zone of the time axis ("UTC", "America/New_York"...). */
    timeZone?: string;
}

/** Whole-layout state of a TradingChart. Plain JSON: store it anywhere and pass it back to `load` / `defaultState`. */
export interface TradingChartState {
    /** Symbol of the (first) chart. */
    symbol: string;
    /** Bar interval in resolution notation ("1", "60", "1D"...). */
    resolution: string;
    /** Main series style. */
    chartType: ChartType;
    /** Main price scale mode. */
    scaleMode: ScaleMode;
    /** Indicators in display order. */
    indicators: IndicatorState[];
    /** Drawings, as serialized by `@reincharts/interactive`. */
    drawings: unknown[];
    /** Compare symbols overlaid on the price pane (datafeed mode). */
    compare?: string[];
    /** Relative pane heights by pane id (the price pane defaults to 3, indicator panes to 1). */
    paneSizes?: Record<string, number>;
    /** Visible time range (ms epoch) to restore. */
    visibleRange?: { from: number; to: number };
    /** Color theme chosen with the theme toggle. */
    theme?: "light" | "dark";
    /** Multi-chart grid. */
    layout?: LayoutKind;
    /** Symbols of the other charts of the grid (chart 2, 3, 4). */
    cells?: string[];
    /** Favorite resolutions shown in the toolbar. */
    favorites?: string[];
    /** Settings dialog preferences. */
    settings?: TradingChartSettings;
}

const CHART_COUNT: Record<LayoutKind, number> = { single: 1, "2h": 2, "2v": 2, "3": 3, "4": 4 };

/** Number of charts in a layout. */
export const layoutCount = (layout: LayoutKind | undefined) => CHART_COUNT[layout ?? "single"] ?? 1;

/** Resolutions shown as toolbar buttons until the user edits the favorites. */
export const DEFAULT_FAVORITES = ["1", "5", "15", "60", "240", "1D", "1W"];

/** A state with every required field. */
export const defaultState = (overrides: Partial<TradingChartState> = {}): TradingChartState => ({
    symbol: "",
    resolution: "1D",
    chartType: "candles",
    scaleMode: "linear",
    indicators: [],
    drawings: [],
    ...overrides,
});

/** An action of `reduceState`: one user change (pick a symbol, add an indicator, load a state...). */
export type StateAction =
    | { type: "symbol"; symbol: string; cell?: number }
    | { type: "resolution"; resolution: string }
    | { type: "chartType"; chartType: ChartType }
    | { type: "scaleMode"; mode: ScaleMode }
    | {
          type: "addIndicator";
          definition: IndicatorDefinition;
          id?: string;
          inputs?: Record<string, unknown>;
          styles?: Record<string, IndicatorOutputStyle>;
          paneId?: string;
      }
    | { type: "updateIndicator"; id: string; patch: Partial<Pick<IndicatorState, "inputs" | "styles" | "hidden">> }
    | { type: "removeIndicator"; id: string }
    | { type: "removeAllIndicators" }
    | { type: "drawings"; drawings: unknown[] }
    | { type: "addCompare"; symbol: string }
    | { type: "removeCompare"; symbol: string }
    | { type: "paneSizes"; sizes: Record<string, number> | undefined }
    | { type: "visibleRange"; range: { from: number; to: number } | undefined }
    | { type: "theme"; theme: "light" | "dark" }
    | { type: "layout"; layout: LayoutKind }
    | { type: "toggleFavorite"; resolution: string }
    | { type: "settings"; settings: TradingChartSettings }
    | { type: "load"; state: TradingChartState };

/** Smallest free id "<definitionId>-<n>" (deterministic, readable in saved layouts). */
export const nextIndicatorId = (indicators: readonly IndicatorState[], definitionId: string) => {
    const used = new Set(indicators.map((i) => i.id));
    let n = 1;
    while (used.has(`${definitionId}-${n}`)) {
        n++;
    }
    return `${definitionId}-${n}`;
};

/** Pane id given to a new non-overlay indicator. */
export const paneIdFor = (indicatorId: string) => `pane-${indicatorId}`;

const without = <T extends object>(record: T | undefined, key: string): T | undefined => {
    if (!record || !(key in record)) {
        return record;
    }
    const out = { ...record } as Record<string, unknown>;
    delete out[key];
    return Object.keys(out).length ? (out as T) : undefined;
};

/** Ids of the panes after the price pane, in display order. */
export const indicatorPanes = (state: TradingChartState) => {
    const out: string[] = [];
    for (const i of state.indicators) {
        if (i.paneId !== PRICE_PANE && !out.includes(i.paneId)) {
            out.push(i.paneId);
        }
    }
    return out;
};

const dropPane = (state: TradingChartState, paneId: string): TradingChartState =>
    state.indicators.some((i) => i.paneId === paneId)
        ? state
        : { ...state, paneSizes: without(state.paneSizes, paneId) };

/** Pure state reducer behind every TradingChart interaction. Returns the same object when nothing changes. */
export function reduceState(state: TradingChartState, action: StateAction): TradingChartState {
    switch (action.type) {
        case "symbol": {
            const cell = action.cell ?? 0;
            if (cell === 0) {
                return state.symbol === action.symbol
                    ? state
                    : {
                          ...state,
                          symbol: action.symbol,
                          compare: state.compare?.filter((s) => s !== action.symbol),
                          visibleRange: undefined,
                      };
            }
            const cells = [...(state.cells ?? [])];
            while (cells.length < cell) {
                cells.push(state.symbol);
            }
            if (cells[cell - 1] === action.symbol) {
                return state;
            }
            cells[cell - 1] = action.symbol;
            return { ...state, cells };
        }
        case "resolution":
            return state.resolution === action.resolution
                ? state
                : { ...state, resolution: action.resolution, visibleRange: undefined };
        case "chartType":
            return state.chartType === action.chartType ? state : { ...state, chartType: action.chartType };
        case "scaleMode":
            return state.scaleMode === action.mode ? state : { ...state, scaleMode: action.mode };
        case "addIndicator": {
            const def = action.definition;
            const id =
                action.id && !state.indicators.some((i) => i.id === action.id)
                    ? action.id
                    : nextIndicatorId(state.indicators, def.id);
            const indicator: IndicatorState = {
                id,
                definitionId: def.id,
                inputs: { ...action.inputs },
                styles: { ...action.styles },
                paneId: action.paneId ?? (def.overlay ? PRICE_PANE : paneIdFor(id)),
            };
            return { ...state, indicators: [...state.indicators, indicator] };
        }
        case "updateIndicator": {
            let changed = false;
            const indicators = state.indicators.map((i) => {
                if (i.id !== action.id) {
                    return i;
                }
                changed = true;
                return { ...i, ...action.patch };
            });
            return changed ? { ...state, indicators } : state;
        }
        case "removeIndicator": {
            const target = state.indicators.find((i) => i.id === action.id);
            if (!target) {
                return state;
            }
            return dropPane(
                { ...state, indicators: state.indicators.filter((i) => i.id !== action.id) },
                target.paneId,
            );
        }
        case "removeAllIndicators":
            return state.indicators.length ? { ...state, indicators: [], paneSizes: undefined } : state;
        case "drawings":
            return state.drawings === action.drawings ? state : { ...state, drawings: action.drawings };
        case "addCompare": {
            const symbol = action.symbol.trim();
            if (!symbol || symbol === state.symbol || state.compare?.includes(symbol)) {
                return state;
            }
            // comparing switches the price scale to percent
            return {
                ...state,
                compare: [...(state.compare ?? []), symbol],
                scaleMode: state.scaleMode === "linear" || state.scaleMode === "log" ? "percent" : state.scaleMode,
            };
        }
        case "removeCompare": {
            if (!state.compare?.includes(action.symbol)) {
                return state;
            }
            const compare = state.compare.filter((s) => s !== action.symbol);
            return { ...state, compare: compare.length ? compare : undefined };
        }
        case "paneSizes":
            return { ...state, paneSizes: action.sizes };
        case "visibleRange":
            return { ...state, visibleRange: action.range };
        case "theme":
            return state.theme === action.theme ? state : { ...state, theme: action.theme };
        case "layout":
            return state.layout === action.layout ? state : { ...state, layout: action.layout };
        case "toggleFavorite": {
            const favorites = state.favorites ?? DEFAULT_FAVORITES;
            return {
                ...state,
                favorites: favorites.includes(action.resolution)
                    ? favorites.filter((r) => r !== action.resolution)
                    : [...favorites, action.resolution],
            };
        }
        case "settings":
            return { ...state, settings: { ...state.settings, ...action.settings } };
        case "load":
            return action.state;
    }
}

// ------------------------------------------------------------------ serialization

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, fallback: string) => (typeof v === "string" && v !== "" ? v : fallback);
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T =>
    list.includes(v as T) ? (v as T) : fallback;
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : undefined);

const parseIndicator = (v: unknown): IndicatorState | undefined => {
    if (!isRecord(v) || typeof v.id !== "string" || typeof v.definitionId !== "string") {
        return undefined;
    }
    const out: IndicatorState = {
        id: v.id,
        definitionId: v.definitionId,
        inputs: isRecord(v.inputs) ? { ...v.inputs } : {},
        styles: isRecord(v.styles) ? ({ ...v.styles } as IndicatorState["styles"]) : {},
        paneId: str(v.paneId, PRICE_PANE),
    };
    if (v.hidden === true) {
        out.hidden = true;
    }
    return out;
};

const numberRecord = (v: unknown) => {
    if (!isRecord(v)) {
        return undefined;
    }
    const out: Record<string, number> = {};
    for (const [k, n] of Object.entries(v)) {
        if (typeof n === "number" && Number.isFinite(n) && n > 0) {
            out[k] = n;
        }
    }
    return Object.keys(out).length ? out : undefined;
};

/**
 * Validates anything (parsed JSON, a partial object) into a complete state: unknown fields are dropped, invalid
 * values fall back to `defaults`, duplicate indicator ids are removed.
 */
export function normalizeState(value: unknown, defaults: Partial<TradingChartState> = {}): TradingChartState {
    const base = defaultState(defaults);
    if (!isRecord(value)) {
        return base;
    }
    const seen = new Set<string>();
    const indicators = Array.isArray(value.indicators)
        ? value.indicators.map(parseIndicator).filter((i): i is IndicatorState => {
              if (!i || seen.has(i.id)) {
                  return false;
              }
              seen.add(i.id);
              return true;
          })
        : base.indicators;
    const out: TradingChartState = {
        symbol: typeof value.symbol === "string" ? value.symbol : base.symbol,
        resolution: str(value.resolution, base.resolution),
        chartType: oneOf(value.chartType, CHART_TYPE_IDS, base.chartType),
        scaleMode: oneOf(value.scaleMode, SCALE_MODES, base.scaleMode),
        indicators,
        drawings: Array.isArray(value.drawings) ? [...value.drawings] : base.drawings,
    };
    const compare = strings(value.compare) ?? base.compare;
    if (compare?.length) {
        out.compare = compare;
    }
    const paneSizes = numberRecord(value.paneSizes) ?? base.paneSizes;
    if (paneSizes) {
        out.paneSizes = paneSizes;
    }
    const range = value.visibleRange;
    if (
        isRecord(range) &&
        typeof range.from === "number" &&
        typeof range.to === "number" &&
        Number.isFinite(range.from) &&
        Number.isFinite(range.to) &&
        range.to > range.from
    ) {
        out.visibleRange = { from: range.from as number, to: range.to as number };
    } else if (base.visibleRange) {
        out.visibleRange = base.visibleRange;
    }
    const theme = value.theme === "light" || value.theme === "dark" ? value.theme : base.theme;
    if (theme) {
        out.theme = theme;
    }
    const layout = LAYOUTS.includes(value.layout as LayoutKind) ? (value.layout as LayoutKind) : base.layout;
    if (layout) {
        out.layout = layout;
    }
    const cells = strings(value.cells) ?? base.cells;
    if (cells?.length) {
        out.cells = cells;
    }
    const favorites = strings(value.favorites) ?? base.favorites;
    if (favorites) {
        out.favorites = favorites;
    }
    const settings = isRecord(value.settings) ? (value.settings as TradingChartSettings) : base.settings;
    if (settings) {
        out.settings = { ...settings };
    }
    return out;
}

/** JSON string of a state (stable field order, no undefined values). */
export const serializeState = (state: TradingChartState) => JSON.stringify(normalizeState(state));

/** Parses a JSON string (or object) produced by `serializeState` / `save()`. Invalid input yields defaults. */
export function parseState(input: string | unknown, defaults?: Partial<TradingChartState>): TradingChartState {
    if (typeof input === "string") {
        try {
            return normalizeState(JSON.parse(input), defaults);
        } catch {
            return normalizeState(undefined, defaults);
        }
    }
    return normalizeState(input, defaults);
}
