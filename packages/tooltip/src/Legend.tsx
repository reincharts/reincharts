import {
    ChartOverlay,
    formatNumber,
    formatPrice,
    useChart,
    useChartState,
    usePaneId,
    withAlpha,
    type ChartEngine,
    type LegendItem,
    type Theme,
} from "@reincharts/core";
import * as React from "react";
import { useLegend, type LegendEntry } from "./collect";

export type LegendPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top" | "bottom";

/** Context passed to `renderItem` / `actions`. */
export interface LegendItemContext {
    /** Data index shown. */
    readonly index: number;
    /** Pointer is over this legend row. */
    readonly hovered: boolean;
    /** Change vs the previous bar (main item with `showChange`). */
    readonly change?: LegendEntry["change"];
    /** Toggles the series visibility. */
    readonly toggle: () => void;
}

export interface LegendProps {
    /** Pane whose series are listed. Defaults to the enclosing pane. */
    readonly pane?: string;
    /** Title of the first row (e.g. the symbol); replaces the first series name. */
    readonly title?: React.ReactNode;
    /** Show values at the crosshair (or last bar). Default true. */
    readonly showValues?: boolean;
    /** Show change and change % of the first item vs the previous bar. Default: true when `title` is set. */
    readonly showChange?: boolean;
    /** Corner / edge of the pane. Default "top-left". */
    readonly position?: LegendPosition;
    /** Stack items ("vertical") or lay them out in a wrapping row ("horizontal"). Default "vertical". */
    readonly orientation?: "vertical" | "horizontal";
    /** Draw a colored swatch before each name. Default: true when `showValues` is false. */
    readonly swatch?: boolean;
    /** Clicking an item hides / shows its series. Default true. */
    readonly toggleOnClick?: boolean;
    /** Called when an item is clicked (in addition to toggling). */
    readonly onItemClick?: (item: LegendItem) => void;
    /** Only show some items. */
    readonly filter?: (item: LegendItem) => boolean;
    /** Custom items instead of the series of the pane (receives the shown data index). */
    readonly items?: (index: number, engine: ChartEngine) => readonly LegendItem[];
    /** Fully custom row content. */
    readonly renderItem?: (item: LegendItem, context: LegendItemContext) => React.ReactNode;
    /** Extra controls rendered after each item (eye / settings / remove buttons). */
    readonly actions?: (item: LegendItem, context: LegendItemContext) => React.ReactNode;
    /** Font size in pixels. Defaults to theme.fontSize + 2. */
    readonly fontSize?: number;
    /** Distance from the pane edges in pixels. Default 8. */
    readonly offset?: number;
    /**
     * Compact layout for small charts: the first item shows only its name and current value; the other series
     * collapse behind an "N more" button (colored dots) that expands into clickable name chips. Default "auto":
     * compact when the pane is narrower than 480px.
     */
    readonly compact?: boolean | "auto";
    readonly className?: string;
    readonly style?: React.CSSProperties;
}

const placement = (position: LegendPosition, offset: number): React.CSSProperties => {
    const s: React.CSSProperties = { position: "absolute" };
    if (position.startsWith("top")) {
        s.top = offset - 2;
    } else {
        s.bottom = offset - 2;
    }
    if (position.endsWith("left")) {
        s.left = offset;
    } else if (position.endsWith("right")) {
        s.right = offset;
        s.alignItems = "flex-end";
    } else {
        s.left = 0;
        s.right = 0;
        s.justifyContent = "center";
        s.alignItems = "center";
    }
    return s;
};

/** Formats a change as "+1.23 (+0.52%)". */
export const formatChange = (change: { value: number; percent: number }, decimals?: number) => {
    // price precision follows the price, not the (small) change: 2 decimals unless the change itself is sub-cent
    const d = decimals ?? (Math.abs(change.value) >= 0.01 || change.value === 0 ? 2 : undefined);
    const sign = (v: number) => (v >= 0 ? "+" : "−");
    return `${sign(change.value)}${formatPrice(Math.abs(change.value), d)} (${sign(change.percent)}${formatNumber(Math.abs(change.percent), 2)}%)`;
};

/**
 * Pane legend in the top-left corner of a pane: name and values of every series at the
 * crosshair (or the last bar). Items toggle their series on click; `actions` adds per-item buttons.
 */
export function Legend({
    pane,
    title,
    showValues = true,
    showChange,
    position = "top-left",
    orientation = "vertical",
    swatch,
    toggleOnClick = true,
    onItemClick,
    filter,
    items,
    renderItem,
    actions,
    fontSize,
    offset = 8,
    compact = "auto",
    className,
    style,
}: LegendProps) {
    const contextPane = usePaneId();
    const paneId = pane ?? contextPane;
    const theme = useChartState((s) => s.theme);
    const change = showChange ?? title !== undefined;
    const { index, entries } = useLegend(paneId, { filter, items, change });
    const paneWidth = useChartState((s) => s.layout.panes.find((p) => p.id === paneId)?.width ?? 0);
    const isCompact = compact === true || (compact === "auto" && paneWidth > 0 && paneWidth < 480);
    const [expanded, setExpanded] = React.useState(false);
    const size = fontSize ?? theme.fontSize + (isCompact ? 1 : 2);
    const horizontal = orientation === "horizontal";
    const row = (e: LegendEntry, k: number, mode: RowMode) => (
        <LegendRow
            key={e.item.id || k}
            entry={e}
            index={index}
            theme={theme}
            mode={mode}
            title={k === 0 ? title : undefined}
            showValues={showValues}
            swatch={mode === "chip" || (swatch ?? !showValues)}
            toggleOnClick={toggleOnClick}
            onItemClick={onItemClick}
            renderItem={renderItem}
            actions={mode === "chip" ? undefined : actions}
        />
    );
    return (
        <ChartOverlay pane={paneId}>
            <div
                className={className ? `rc-legend ${className}` : "rc-legend"}
                style={{
                    ...placement(position, offset),
                    display: "flex",
                    flexDirection: horizontal ? "row" : "column",
                    flexWrap: horizontal ? "wrap" : "nowrap",
                    gap: horizontal ? "2px 12px" : 0,
                    fontFamily: theme.fontFamily,
                    fontSize: size,
                    lineHeight: `${Math.round(size * 1.6)}px`,
                    color: theme.text,
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                    // halo in the background color keeps text readable over series
                    textShadow: `0 0 2px ${theme.background}, 0 0 2px ${theme.background}, 0 0 1px ${theme.background}`,
                    ...style,
                }}
            >
                {isCompact && entries.length > 0 ? (
                    <>
                        {row(entries[0], 0, "main")}
                        {entries.length > 1 &&
                            (expanded ? (
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "0 10px",
                                        maxWidth: paneWidth - 2 * offset,
                                    }}
                                >
                                    {entries.slice(1).map((e, k) => row(e, k + 1, "chip"))}
                                    <CollapseButton theme={theme} label="less" onClick={() => setExpanded(false)} />
                                </div>
                            ) : (
                                <CollapseButton
                                    theme={theme}
                                    label={`${entries.length - 1} more`}
                                    colors={entries.slice(1).map((e) => e.item.color ?? theme.text)}
                                    onClick={() => setExpanded(true)}
                                />
                            ))}
                    </>
                ) : (
                    entries.map((e, k) => row(e, k, "full"))
                )}
            </div>
        </ChartOverlay>
    );
}

/** Compact legend toggle: colored dots of the collapsed series and a "N more" / "less" label. */
function CollapseButton({
    theme,
    label,
    colors,
    onClick,
}: {
    theme: Theme;
    label: string;
    colors?: readonly string[];
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className="rc-legend-toggle"
            onClick={onClick}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                width: "fit-content",
                padding: "0 4px",
                margin: "0 -4px",
                border: 0,
                borderRadius: 4,
                background: "none",
                font: "inherit",
                color: theme.textMuted,
                cursor: "pointer",
                pointerEvents: "auto",
            }}
        >
            {colors?.map((c, i) => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: 4, background: c }} />
            ))}
            <span style={{ marginLeft: colors ? 3 : 0 }}>{label}</span>
        </button>
    );
}

/** full: name + every value; main: name + current value (compact first row); chip: swatch + name (compact others). */
type RowMode = "full" | "main" | "chip";

interface LegendRowProps {
    readonly entry: LegendEntry;
    readonly mode: RowMode;
    readonly index: number;
    readonly theme: Theme;
    readonly title?: React.ReactNode;
    readonly showValues: boolean;
    readonly swatch: boolean;
    readonly toggleOnClick: boolean;
    readonly onItemClick?: (item: LegendItem) => void;
    readonly renderItem?: LegendProps["renderItem"];
    readonly actions?: LegendProps["actions"];
}

function LegendRow({
    entry,
    mode,
    index,
    theme,
    title,
    showValues,
    swatch,
    toggleOnClick,
    onItemClick,
    renderItem,
    actions,
}: LegendRowProps) {
    const engine = useChart();
    const [hovered, setHovered] = React.useState(false);
    const { item, change } = entry;
    const toggle = () => engine.setHidden(item.id);
    const context: LegendItemContext = { index, hovered, change, toggle };
    const interactive = toggleOnClick || !!onItemClick || !!actions;
    const muted = item.hidden;
    const color = item.color ?? theme.text;
    const extra = actions?.(item, context);
    const values = mode === "main" ? item.values.slice(-1) : item.values;
    // a hidden row keeps its labels (or at least a swatch) so it can be clicked to show the series again
    const mutedLabels = muted && showValues && mode !== "chip" && values.some((v) => v.label);
    const showSwatch = swatch || (muted && title === undefined && !item.name && !mutedLabels);
    return (
        <div
            className="rc-legend-item"
            data-hidden={muted ? "" : undefined}
            onClick={
                interactive
                    ? () => {
                          if (toggleOnClick) {
                              toggle();
                          }
                          onItemClick?.(item);
                      }
                    : undefined
            }
            onPointerEnter={interactive ? () => setHovered(true) : undefined}
            // also on move: when the row under a resting pointer changes (another row was removed), React
            // doesn't fire pointerenter for the row that slid in
            onPointerMove={interactive && !hovered ? () => setHovered(true) : undefined}
            onPointerLeave={interactive ? () => setHovered(false) : undefined}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: "fit-content",
                padding: "0 4px",
                margin: "0 -4px",
                borderRadius: 4,
                pointerEvents: interactive ? "auto" : "none",
                cursor: toggleOnClick ? "pointer" : undefined,
                background: hovered ? withAlpha(theme.textMuted, 0.12) : undefined,
                opacity: muted ? 0.45 : 1,
            }}
        >
            {renderItem ? (
                renderItem(item, context)
            ) : (
                <>
                    {showSwatch && (
                        <span
                            style={{
                                width: mode === "chip" ? 8 : 10,
                                height: mode === "chip" ? 8 : 10,
                                borderRadius: mode === "chip" ? 4 : 2,
                                background: color,
                                flex: "none",
                            }}
                        />
                    )}
                    {title !== undefined ? (
                        <span style={{ fontWeight: 600, fontSize: "1.08em" }}>{title}</span>
                    ) : item.name ? (
                        <span style={{ color: theme.text }}>{item.name}</span>
                    ) : null}
                    {showValues &&
                        mode !== "chip" &&
                        (!muted || mutedLabels) &&
                        values.map((v, i) =>
                            muted ? (
                                v.label && (
                                    <span key={i} style={{ color: theme.textMuted }}>
                                        {v.label}
                                    </span>
                                )
                            ) : (
                                <span key={i} style={{ display: "inline-flex", gap: 3 }}>
                                    {v.label && <span style={{ color: theme.textMuted }}>{v.label}</span>}
                                    <span style={{ color: v.color ?? color }}>{v.value}</span>
                                </span>
                            ),
                        )}
                    {showValues && !muted && change && mode === "full" && (
                        <span style={{ color: change.value >= 0 ? theme.up : theme.down }}>{formatChange(change)}</span>
                    )}
                </>
            )}
            {extra}
        </div>
    );
}
