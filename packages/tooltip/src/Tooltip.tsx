import {
    ChartOverlay,
    isFiniteNumber,
    useChart,
    useChartEvent,
    useChartState,
    usePaneId,
    type ChartEngine,
    type CrosshairState,
    type LegendItem,
    type Renderable,
    type Theme,
} from "@reincharts/core";
import * as React from "react";
import { collectLegend, sameEntries, type LegendEntry } from "./collect";

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** What a tooltip shows at the hovered point. */
export interface TooltipContent {
    /** Hovered data index. */
    readonly index: number;
    /** Header text (formatted x of the hovered point). */
    readonly header: string;
    readonly items: readonly LegendItem[];
    /** The hovered datum. */
    readonly datum: unknown;
}

export interface TooltipProps {
    /** Pane whose series are shown. Defaults to the enclosing pane. */
    readonly pane?: string;
    /**
     * "shared": every series at the hovered index (default). "nearest": only the series under the pointer
     * (the one whose `indexAt` picked the point, e.g. scatter, else the series closest to the pointer).
     */
    readonly mode?: "shared" | "nearest";
    /** Only show some items. */
    readonly filter?: (item: LegendItem) => boolean;
    /** Custom header. Defaults to the formatted x value of the hovered point. */
    readonly formatHeader?: (index: number, engine: ChartEngine) => string;
    /** Replaces the default card content. The returned node is positioned next to the pointer. */
    readonly render?: (content: TooltipContent) => React.ReactNode;
    /** Distance from the pointer in pixels. Default 14. */
    readonly offset?: number;
    /** Font size in pixels. Defaults to theme.fontSize + 1. */
    readonly fontSize?: number;
    readonly className?: string;
    /** Extra styles for the card. */
    readonly style?: React.CSSProperties;
}

const nearestRenderable = (engine: ChartEngine, paneId: string, c: CrosshairState, entries: readonly LegendEntry[]) => {
    let withIndexAt = false;
    for (const e of entries) {
        const r = e.renderable;
        if (r?.indexAt) {
            withIndexAt = true;
            if (r.indexAt(c.x, c.y) === c.index) {
                return r;
            }
        }
    }
    if (withIndexAt) {
        return undefined;
    }
    let best: Renderable | undefined;
    let dist = Infinity;
    for (const e of entries) {
        const r = e.renderable;
        const s = r ? engine.getScale(paneId, r.scale) : undefined;
        for (const v of r?.snapValues?.(c.index) ?? []) {
            const d = Math.abs(s!.toY(v, r!.baseValue?.(engine.range.start)) - c.y);
            if (isFiniteNumber(d) && d < dist) {
                dist = d;
                best = r;
            }
        }
    }
    return best;
};

/** Formatted x of a data point; numbers get a precision that suits their magnitude. */
export const defaultHeader = (engine: ChartEngine, index: number) => {
    const v = engine.times[index];
    if (engine.xType !== "number" || !isFiniteNumber(v)) {
        return engine.formatX(index);
    }
    const abs = Math.abs(v);
    return v.toLocaleString("en-US", { maximumFractionDigits: abs >= 1000 ? 0 : abs >= 10 ? 2 : abs >= 1 ? 3 : 6 });
};

/**
 * Floating tooltip that follows the pointer: a card with the hovered x
 * and the values of the pane's series. Flips to the other side of the pointer near the edges.
 */
export function Tooltip({
    pane,
    mode = "shared",
    filter,
    formatHeader,
    render,
    offset = 14,
    fontSize,
    className,
    style,
}: TooltipProps) {
    const engine = useChart();
    const contextPane = usePaneId();
    const paneId = pane ?? contextPane;
    const theme = useChartState((s) => s.theme);
    const content = useChartState<{ index: number; header: string; entries: readonly LegendEntry[] } | null>(
        (s) => {
            const c = s.crosshair;
            if (!c || c.synced || c.paneId !== paneId || c.index < 0) {
                return null;
            }
            let entries = collectLegend(engine, paneId, c.index, { filter }).filter((e) => !e.item.hidden);
            if (mode === "nearest") {
                const r = nearestRenderable(engine, paneId, c, entries);
                entries = entries.filter((e) => e.renderable === r);
            }
            if (!entries.length) {
                return null;
            }
            return {
                index: c.index,
                header: formatHeader ? formatHeader(c.index, engine) : defaultHeader(engine, c.index),
                entries,
            };
        },
        (a, b) =>
            a === b ||
            (!!a && !!b && a.index === b.index && a.header === b.header && sameEntries(a.entries, b.entries)),
    );
    const ref = React.useRef<HTMLDivElement>(null);
    const place = React.useCallback(() => {
        const el = ref.current;
        const c = engine.crosshair;
        const p = c && engine.layout.panes.find((each) => each.id === paneId);
        if (!el || !c || !p) {
            return;
        }
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const ax = p.left + c.x;
        const ay = p.top + c.y;
        let left = ax + offset;
        if (left + w > p.left + p.width) {
            left = ax - offset - w;
        }
        left = Math.max(Math.min(left, engine.layout.width - w), 0);
        let top = ay + offset;
        if (top + h > engine.layout.height) {
            top = ay - offset - h;
        }
        top = Math.max(top, 0);
        el.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
        el.style.visibility = "visible";
    }, [engine, paneId, offset]);
    useChartEvent("crosshair", place);
    useIsoLayoutEffect(place);
    if (!content) {
        return null;
    }
    const tooltip: TooltipContent = {
        index: content.index,
        header: content.header,
        items: content.entries.map((e) => e.item),
        datum: engine.data[content.index],
    };
    return (
        <ChartOverlay pane={paneId} area="chart">
            <div
                ref={ref}
                className={className ? `rc-tooltip ${className}` : "rc-tooltip"}
                style={{ position: "absolute", left: 0, top: 0, visibility: "hidden", pointerEvents: "none" }}
            >
                {render ? (
                    render(tooltip)
                ) : (
                    <TooltipCard content={tooltip} theme={theme} fontSize={fontSize} style={style} />
                )}
            </div>
        </ChartOverlay>
    );
}

export interface TooltipCardProps {
    readonly content: TooltipContent;
    readonly theme: Theme;
    readonly fontSize?: number;
    readonly style?: React.CSSProperties;
}

/** The default tooltip card (exported to build custom tooltips with the same look). */
export function TooltipCard({ content, theme, fontSize, style }: TooltipCardProps) {
    const size = fontSize ?? theme.fontSize + 1;
    const dark = theme.name === "dark";
    const dot = (color: string | undefined) => (
        <span style={{ width: 8, height: 8, borderRadius: 4, background: color ?? theme.text, flex: "none" }} />
    );
    const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" };
    return (
        <div
            style={{
                background: theme.background,
                color: theme.text,
                border: `1px solid ${theme.axis.line}`,
                borderRadius: 6,
                boxShadow: dark ? "0 4px 16px rgba(0, 0, 0, 0.45)" : "0 4px 16px rgba(19, 23, 34, 0.12)",
                padding: "7px 10px",
                fontFamily: theme.fontFamily,
                fontSize: size,
                lineHeight: `${Math.round(size * 1.55)}px`,
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
                minWidth: 110,
                ...style,
            }}
        >
            {content.header && <div style={{ fontWeight: 600, marginBottom: 3 }}>{content.header}</div>}
            {content.items.map((item) => {
                const single = item.values.length === 1 && !item.values[0].label;
                if (single) {
                    return (
                        <div key={item.id} style={row}>
                            <span
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, color: theme.textMuted }}
                            >
                                {dot(item.color)}
                                {item.name || "Value"}
                            </span>
                            <span style={{ fontWeight: 600 }}>{item.values[0].value}</span>
                        </div>
                    );
                }
                return (
                    <div key={item.id}>
                        {item.name && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.textMuted }}>
                                {dot(item.color)}
                                {item.name}
                            </div>
                        )}
                        {item.values.map((v, i) => (
                            <div key={i} style={{ ...row, paddingLeft: item.name ? 14 : 0 }}>
                                <span style={{ color: theme.textMuted }}>{v.label}</span>
                                <span style={{ fontWeight: 600, color: v.color }}>{v.value}</span>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
