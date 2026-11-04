import type { ChartEngine, Theme } from "@reincharts/core";
import type { CrosshairMode } from "@reincharts/coordinates";
import type { Datafeed } from "@reincharts/datafeed";
import type { IndicatorDefinition } from "@reincharts/indicators";
import * as React from "react";
import type { DrawingIntegration } from "./Drawings";
import type { StateAction, TradingChartState } from "./state";

/** Which dialog is open. */
export type DialogState =
    | { kind: "symbol"; cell: number }
    | { kind: "compare" }
    | { kind: "indicators" }
    | { kind: "indicatorSettings"; id: string }
    | { kind: "settings" }
    | null;

/** Open context menu (root-relative pixels). */
export interface ContextMenuState {
    readonly x: number;
    readonly y: number;
    readonly cell: number;
    readonly paneId: string | null;
    /** Price under the pointer (main scale of the pane). */
    readonly price?: number;
    /** Formatted price. */
    readonly priceText?: string;
}

/** Effective user settings (state.settings over the props). */
export interface EffectiveSettings {
    readonly crosshair: CrosshairMode;
    readonly volume: boolean;
    readonly watermark: boolean;
    readonly legend: boolean;
    readonly grid: boolean;
    readonly lastPriceLine: boolean;
    readonly timeZone: string | undefined;
}

/** UI parts enabled by props. */
export interface Features {
    readonly toolbar: boolean;
    readonly drawingToolbar: boolean;
    readonly bottomBar: boolean;
    readonly contextMenu: boolean;
    readonly objectTree: boolean;
    readonly replay: boolean;
    readonly compare: boolean;
    /** The browser can show the widget fullscreen (not iPhone Safari). */
    readonly fullscreen: boolean;
}

/** Symbol shown by a chart cell, with its description and exchange once the datafeed resolved them. */
export interface CellSymbol {
    readonly symbol: string;
    readonly description?: string;
    readonly exchange?: string;
}

export interface WidgetContextValue {
    readonly state: TradingChartState;
    readonly dispatch: (action: StateAction) => void;
    /** Built-in + extra indicator definitions by id. */
    readonly definitions: Readonly<Record<string, IndicatorDefinition>>;
    /** Ids of `extraIndicators` (listed under "Custom"). */
    readonly customIds: ReadonlySet<string>;
    readonly datafeed: Datafeed | undefined;
    readonly data: readonly any[] | undefined;
    readonly resolutions: readonly string[];
    readonly features: Features;
    readonly settings: EffectiveSettings;
    readonly themeName: "light" | "dark";
    readonly chartTheme: Theme;
    readonly activeCell: number;
    readonly setActiveCell: (cell: number) => void;
    /** Engine of the active chart (null before mount). */
    readonly engine: ChartEngine | null;
    readonly registerEngine: (cell: number, engine: ChartEngine | null) => void;
    readonly engines: React.RefObject<(ChartEngine | null)[]>;
    readonly dialog: DialogState;
    readonly openDialog: (dialog: DialogState) => void;
    readonly contextMenu: ContextMenuState | null;
    readonly openContextMenu: (menu: ContextMenuState | null) => void;
    readonly replay: boolean;
    readonly setReplay: (on: boolean) => void;
    readonly objectTreeOpen: boolean;
    readonly setObjectTreeOpen: (open: boolean) => void;
    readonly fullscreen: boolean;
    readonly toggleFullscreen: () => void;
    readonly screenshot: () => string;
    readonly downloadScreenshot: () => void;
    /** Visible range to restore on the first chart when its data arrives. */
    readonly pendingRange: React.RefObject<{ from: number; to: number } | undefined>;
    readonly syncId: string | undefined;
    readonly syncRange: boolean;
    readonly drawings: DrawingIntegration;
    readonly rootRef: React.RefObject<HTMLDivElement | null>;
    /** Symbol displayed by each cell (with its description when known). */
    readonly symbolInfo: (cell: number) => CellSymbol;
    readonly setSymbolInfo: (cell: number, info: CellSymbol) => void;
}

export const WidgetContext = React.createContext<WidgetContextValue | null>(null);

/** The TradingChart widget context (throws outside a TradingChart). */
export function useWidget(): WidgetContextValue {
    const value = React.useContext(WidgetContext);
    if (!value) {
        throw new Error("TradingChart parts must be rendered inside <TradingChart>.");
    }
    return value;
}

/** Subscribes to an engine outside its `<ChartCanvas>` (toolbar, bottom bar). */
export function useEngineState<S>(
    engine: ChartEngine | null,
    selector: (engine: ChartEngine) => S,
    fallback: S,
    isEqual: (a: S, b: S) => boolean = Object.is,
): S {
    const selectorRef = React.useRef(selector);
    selectorRef.current = selector;
    const cache = React.useRef<{ engine: ChartEngine | null; version: unknown; value: S } | null>(null);
    const subscribe = React.useCallback((fn: () => void) => (engine ? engine.subscribe(fn) : () => {}), [engine]);
    const get = () => {
        if (!engine) {
            return fallback;
        }
        const version = engine.getState();
        const c = cache.current;
        if (c && c.engine === engine && c.version === version) {
            return c.value;
        }
        const value = selectorRef.current(engine);
        cache.current = {
            engine,
            version,
            value: c && c.engine === engine && isEqual(c.value, value) ? c.value : value,
        };
        return cache.current.value;
    };
    return React.useSyncExternalStore(subscribe, get, get);
}
