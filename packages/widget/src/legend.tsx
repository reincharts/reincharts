import {
    ChartOverlay,
    shallowEqual,
    useChart,
    useChartState,
    type ChartEngine,
    type LegendItem,
} from "@reincharts/core";
import { formatChange, Legend, type LegendItemContext } from "@reincharts/tooltip";
import * as React from "react";
import { useWidget } from "./context";
import { Icon, type IconName } from "./icons";
import { PRICE_PANE } from "./state";

/** Legend name of the volume series. */
export const VOLUME_NAME = "Volume";

interface IconButtonProps {
    readonly icon: IconName;
    readonly label: string;
    readonly onClick: () => void;
}

function ActionButton({ icon, label, onClick }: IconButtonProps) {
    return (
        <button
            type="button"
            className="rc-w-lg-btn"
            title={label}
            aria-label={label}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            onDoubleClick={(e) => e.stopPropagation()}
        >
            <Icon name={icon} size={16} />
        </button>
    );
}

type Kind = "main" | "volume" | "compare" | "indicator";

export interface PaneLegendProps {
    readonly paneId: string;
    /** Main series name (the symbol) and its title text (price pane). */
    readonly symbol?: string;
    readonly title?: string;
    readonly compare?: readonly string[];
}

/** Row order of the price pane legend: symbol, volume, compare symbols, then indicators. */
const ROW_ORDER: Record<Kind, number> = { main: 0, volume: 1, compare: 2, indicator: 3 };

/** Legend of a pane: values at the crosshair and eye / settings / remove buttons on hover. */
export function PaneLegend({ paneId, symbol, title, compare = [] }: PaneLegendProps) {
    const w = useWidget();
    const engine = useChart();
    const indicators = w.state.indicators;
    const byId = React.useMemo(() => new Map(indicators.map((i) => [i.id, i])), [indicators]);
    const main = paneId === PRICE_PANE;

    const kindOf = (item: LegendItem): Kind =>
        byId.has(item.id)
            ? "indicator"
            : main && item.name === symbol
              ? "main"
              : main && item.name === VOLUME_NAME
                ? "volume"
                : "compare";

    const items = main
        ? (index: number, e: ChartEngine) => {
              const all = e.legendItems(paneId, index);
              const rank = (item: LegendItem) => ROW_ORDER[kindOf(item)];
              return all
                  .map((item, i) => ({ item, i }))
                  .sort((a, b) => rank(a.item) - rank(b.item) || a.i - b.i)
                  .map((x) => x.item);
          }
        : undefined;

    const renderItem = (item: LegendItem, ctx: LegendItemContext) => {
        const kind = kindOf(item);
        const indicator = byId.get(item.id);
        const muted = item.hidden || indicator?.hidden;
        // volume values use the solid up / down color (the bars are translucent)
        const bar = engine.data[ctx.index];
        const solid =
            kind === "volume" && bar ? (bar.close >= bar.open ? w.chartTheme.up : w.chartTheme.down) : undefined;
        const values = muted
            ? null
            : item.values.map((v, i) => (
                  <span key={i} className="rc-w-lg-value">
                      {v.label && <span className="rc-w-lg-label">{v.label}</span>}
                      <span style={{ color: solid ?? v.color ?? item.color }}>{v.value}</span>
                  </span>
              ));
        if (kind === "main") {
            const change = muted ? undefined : changeAt(engine, ctx.index);
            return (
                <>
                    <span className="rc-w-lg-title">{title ?? item.name}</span>
                    {values}
                    {change && (
                        <span
                            className="rc-w-lg-value"
                            style={{ color: change.value >= 0 ? w.chartTheme.up : w.chartTheme.down }}
                        >
                            {formatChange(change)}
                        </span>
                    )}
                </>
            );
        }
        return (
            <>
                <span
                    className="rc-w-lg-name"
                    data-hidden={indicator?.hidden ? "" : undefined}
                    onDoubleClick={
                        indicator ? () => w.openDialog({ kind: "indicatorSettings", id: indicator.id }) : undefined
                    }
                >
                    {kind === "volume" ? "Vol" : item.name}
                </span>
                {values}
            </>
        );
    };

    const actions = (item: LegendItem, ctx: LegendItemContext) => {
        if (!ctx.hovered) {
            return null;
        }
        const kind = kindOf(item);
        const indicator = byId.get(item.id);
        const hidden = indicator ? indicator.hidden : item.hidden;
        const eye = (
            <ActionButton
                icon={hidden ? "eyeOff" : "eye"}
                label={hidden ? "Show" : "Hide"}
                onClick={
                    indicator
                        ? () =>
                              w.dispatch({
                                  type: "updateIndicator",
                                  id: indicator.id,
                                  patch: { hidden: !indicator.hidden },
                              })
                        : ctx.toggle
                }
            />
        );
        return (
            <span className="rc-w-lg-actions">
                {eye}
                {(kind === "main" || indicator) && (
                    <ActionButton
                        icon="settings"
                        label="Settings"
                        onClick={() =>
                            w.openDialog(
                                indicator ? { kind: "indicatorSettings", id: indicator.id } : { kind: "settings" },
                            )
                        }
                    />
                )}
                {kind !== "main" && (
                    <ActionButton
                        icon="close"
                        label="Remove"
                        onClick={() => {
                            if (indicator) {
                                w.dispatch({ type: "removeIndicator", id: indicator.id });
                            } else if (kind === "volume") {
                                w.dispatch({ type: "settings", settings: { volume: false } });
                            } else if (compare.includes(item.name)) {
                                w.dispatch({ type: "removeCompare", symbol: item.name });
                            }
                        }}
                    />
                )}
            </span>
        );
    };

    return (
        <Legend
            pane={paneId}
            className="rc-w-legend"
            toggleOnClick={false}
            items={items}
            renderItem={renderItem}
            actions={actions}
            fontSize={13}
        />
    );
}

/** Change of the close vs the previous bar. */
const changeAt = (engine: ChartEngine, index: number) => {
    const d = engine.data[index];
    const p = engine.data[index - 1];
    const cur = d?.close;
    const prev = p?.close;
    if (typeof cur !== "number" || typeof prev !== "number" || !Number.isFinite(cur) || !Number.isFinite(prev)) {
        return undefined;
    }
    return { value: cur - prev, percent: prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : 0 };
};

/** Maximize / collapse (/ remove for indicator panes) buttons at the top right of a pane, on hover. */
export function PaneControls({ paneId }: { readonly paneId: string }) {
    const w = useWidget();
    const engine = useChart();
    const s = useChartState((st) => {
        const p = st.layout.panes.find((each) => each.id === paneId);
        return {
            hovered: st.crosshair?.paneId === paneId,
            maximized: !!p?.maximized,
            collapsed: !!p?.collapsed,
        };
    }, shallowEqual);
    const [over, setOver] = React.useState(false);
    if (!s.hovered && !over && !s.maximized && !s.collapsed) {
        return null;
    }
    const ids = w.state.indicators.filter((i) => i.paneId === paneId).map((i) => i.id);
    return (
        <ChartOverlay pane={paneId}>
            <div
                className="rc-w-pane-controls"
                onPointerEnter={() => setOver(true)}
                onPointerLeave={() => setOver(false)}
            >
                <ActionButton
                    icon={s.maximized ? "minimize" : "maximize"}
                    label={s.maximized ? "Restore pane" : "Maximize pane"}
                    onClick={() => engine.toggleMaximizePane(paneId)}
                />
                <ActionButton
                    icon={s.collapsed ? "expand" : "collapse"}
                    label={s.collapsed ? "Expand pane" : "Collapse pane"}
                    onClick={() => engine.toggleCollapsePane(paneId)}
                />
                {paneId !== PRICE_PANE && (
                    <ActionButton
                        icon="close"
                        label="Remove pane"
                        onClick={() => {
                            for (const id of ids) {
                                w.dispatch({ type: "removeIndicator", id });
                            }
                            setOver(false);
                        }}
                    />
                )}
            </div>
        </ChartOverlay>
    );
}
