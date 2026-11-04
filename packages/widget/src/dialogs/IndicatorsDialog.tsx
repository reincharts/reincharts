import { indicatorName, resolveInputs, type IndicatorDefinition } from "@reincharts/indicators";
import * as React from "react";
import { useWidget } from "../context";
import { Icon } from "../icons";
import { applyIndicatorColors } from "../utils";
import { Dialog, SearchInput } from "./Dialog";

const CATEGORIES: { id: string; label: string }[] = [
    { id: "custom", label: "Custom" },
    { id: "trend", label: "Trend" },
    { id: "momentum", label: "Momentum" },
    { id: "volatility", label: "Volatility" },
    { id: "volume", label: "Volume" },
    { id: "other", label: "Other" },
];

/** Groups definitions by category, filtered by a search query (name, short name, id, description). */
function groupIndicators(
    definitions: Readonly<Record<string, IndicatorDefinition>>,
    customIds: ReadonlySet<string>,
    query: string,
) {
    const q = query.trim().toLowerCase();
    const list = Object.values(definitions).filter(
        (d) => !q || `${d.name} ${d.shortName} ${d.id} ${d.description ?? ""}`.toLowerCase().includes(q),
    );
    return CATEGORIES.map((c) => ({
        ...c,
        items: list
            .filter((d) => (customIds.has(d.id) ? c.id === "custom" : d.category === c.id))
            .sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((g) => g.items.length > 0);
}

/**
 * Searchable indicator list grouped by category; clicking a row adds the indicator (the dialog stays open).
 * Indicators already on the chart are listed first with hide / settings / remove buttons.
 */
export function IndicatorsDialog({ onClose }: { readonly onClose: () => void }) {
    const { definitions, customIds, state, dispatch, themeName, openDialog } = useWidget();
    const [query, setQuery] = React.useState("");
    const groups = React.useMemo(() => groupIndicators(definitions, customIds, query), [definitions, customIds, query]);
    const counts = new Map<string, number>();
    for (const i of state.indicators) {
        counts.set(i.definitionId, (counts.get(i.definitionId) ?? 0) + 1);
    }
    const add = (definition: IndicatorDefinition) =>
        dispatch(applyIndicatorColors({ type: "addIndicator", definition }, state, themeName));
    const first = groups[0]?.items[0];
    return (
        <Dialog title="Indicators" onClose={onClose} width={560} className="rc-w-indicators-dialog">
            <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && first) {
                        add(first);
                    }
                }}
            />
            <div className="rc-w-list" aria-label="Indicators">
                {!query.trim() && state.indicators.length > 0 && (
                    <div role="group" aria-label="On chart">
                        <div className="rc-w-list-heading">On chart</div>
                        {state.indicators.map((i) => {
                            const def = definitions[i.definitionId];
                            const name = def ? indicatorName(def, resolveInputs(def, i.inputs)) : i.definitionId;
                            return (
                                <div
                                    key={i.id}
                                    className="rc-w-list-item rc-w-active-indicator"
                                    data-hidden={i.hidden ? "" : undefined}
                                >
                                    <span className="rc-w-list-name">{name}</span>
                                    <span className="rc-w-list-actions">
                                        <button
                                            type="button"
                                            className="rc-w-btn rc-w-icon-btn"
                                            title={i.hidden ? `Show ${name}` : `Hide ${name}`}
                                            aria-label={i.hidden ? `Show ${name}` : `Hide ${name}`}
                                            onClick={() =>
                                                dispatch({
                                                    type: "updateIndicator",
                                                    id: i.id,
                                                    patch: { hidden: !i.hidden },
                                                })
                                            }
                                        >
                                            <Icon name={i.hidden ? "eyeOff" : "eye"} size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className="rc-w-btn rc-w-icon-btn"
                                            title={`${name} settings`}
                                            aria-label={`${name} settings`}
                                            onClick={() => openDialog({ kind: "indicatorSettings", id: i.id })}
                                        >
                                            <Icon name="settings" size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className="rc-w-btn rc-w-icon-btn"
                                            title={`Remove ${name}`}
                                            aria-label={`Remove ${name}`}
                                            onClick={(e) => {
                                                // keep keyboard focus in the dialog once this row disappears
                                                e.currentTarget
                                                    .closest<HTMLElement>("[role=dialog]")
                                                    ?.querySelector<HTMLElement>("[data-autofocus]")
                                                    ?.focus();
                                                dispatch({ type: "removeIndicator", id: i.id });
                                            }}
                                        >
                                            <Icon name="close" size={16} />
                                        </button>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
                {groups.map((g) => (
                    <div key={g.id} role="group" aria-label={g.label}>
                        <div className="rc-w-list-heading">{g.label}</div>
                        {g.items.map((d) => {
                            const count = counts.get(d.id);
                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    className="rc-w-list-item"
                                    title={d.description}
                                    onClick={() => add(d)}
                                >
                                    <span className="rc-w-list-name">{d.name}</span>
                                    {count ? <span className="rc-w-badge">{count}</span> : null}
                                    <span className="rc-w-list-meta">{d.shortName}</span>
                                </button>
                            );
                        })}
                    </div>
                ))}
                {groups.length === 0 && <div className="rc-w-empty">No indicators match your criteria</div>}
            </div>
        </Dialog>
    );
}
