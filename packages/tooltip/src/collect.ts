import {
    isFiniteNumber,
    useChart,
    useChartState,
    type ChartEngine,
    type LegendItem,
    type Renderable,
} from "@reincharts/core";

export interface LegendEntry {
    readonly item: LegendItem;
    /** Renderable that produced the item (undefined for custom items). */
    readonly renderable?: Renderable;
    /** Change of the main value vs the previous bar (first entry only, when requested). */
    readonly change?: { readonly value: number; readonly percent: number };
}

export interface CollectOptions {
    /** Only keep some items. */
    readonly filter?: (item: LegendItem) => boolean;
    /** Custom items instead of the series in the pane. */
    readonly items?: (index: number, engine: ChartEngine) => readonly LegendItem[];
    /** Compute `change` for the first entry. */
    readonly change?: boolean;
}

const mainValue = (r: Renderable | undefined, index: number) => r?.snapValues?.(index)?.at(-1);

/** Legend entries of a pane at a data index (like `engine.legendItems`, but keeping the renderables). */
export const collectLegend = (
    engine: ChartEngine,
    paneId: string,
    index: number,
    o: CollectOptions = {},
): LegendEntry[] => {
    if (index < 0 || index >= engine.data.length) {
        return [];
    }
    let out: LegendEntry[] = [];
    if (o.items) {
        out = o.items(index, engine).map((item) => ({ item }));
    } else {
        for (const r of engine.ordered()) {
            if (r.pane !== paneId || !r.legend) {
                continue;
            }
            const item = r.legend(index);
            if (item) {
                out.push({ item: engine.isHidden(item.id) ? { ...item, hidden: true } : item, renderable: r });
            }
        }
    }
    if (o.filter) {
        out = out.filter((e) => o.filter!(e.item));
    }
    if (o.change && out.length && index > 0) {
        const cur = mainValue(out[0].renderable, index);
        const prev = mainValue(out[0].renderable, index - 1);
        if (isFiniteNumber(cur) && isFiniteNumber(prev)) {
            out[0] = {
                ...out[0],
                change: { value: cur - prev, percent: prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : 0 },
            };
        }
    }
    return out;
};

const sameItem = (a: LegendItem, b: LegendItem) =>
    a.id === b.id &&
    a.name === b.name &&
    a.color === b.color &&
    !!a.hidden === !!b.hidden &&
    a.values.length === b.values.length &&
    a.values.every(
        (v, i) => v.value === b.values[i].value && v.label === b.values[i].label && v.color === b.values[i].color,
    );

/** Deep equality of legend entry lists (used to skip re-renders). */
export const sameEntries = (a: readonly LegendEntry[], b: readonly LegendEntry[]) =>
    a.length === b.length &&
    a.every(
        (e, i) =>
            sameItem(e.item, b[i].item) &&
            e.renderable === b[i].renderable &&
            e.change?.value === b[i].change?.value &&
            e.change?.percent === b[i].change?.percent,
    );

export interface LegendState {
    /** Data index shown (crosshair index, or the last bar without crosshair). -1 without data. */
    readonly index: number;
    /** True when the index comes from the crosshair. */
    readonly hovered: boolean;
    readonly entries: readonly LegendEntry[];
}

/**
 * Legend entries of a pane at the crosshair (or the last bar when there is no crosshair).
 * Re-renders only when the index or the displayed data changes.
 */
export function useLegend(paneId: string, o: CollectOptions = {}): LegendState {
    const engine = useChart();
    return useChartState(
        (s) => {
            const c = s.crosshair;
            const hovered = !!c && c.index >= 0;
            const index = hovered ? c!.index : s.dataLength - 1;
            return { index, hovered, entries: collectLegend(engine, paneId, index, o) };
        },
        (a, b) => a.index === b.index && a.hovered === b.hovered && sameEntries(a.entries, b.entries),
    );
}
