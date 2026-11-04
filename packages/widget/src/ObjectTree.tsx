import { indicatorName, resolveInputs } from "@reincharts/indicators";
import * as React from "react";
import { useEngineState, useWidget } from "./context";
import { Icon, type IconName } from "./icons";
import { VOLUME_NAME } from "./legend";
import { indicatorPanes, PRICE_PANE } from "./state";

interface SeriesRow {
    readonly id: string;
    readonly name: string;
    readonly hidden: boolean;
}

const sameRows = (a: readonly SeriesRow[], b: readonly SeriesRow[]) =>
    a.length === b.length && a.every((x, i) => x.id === b[i].id && x.name === b[i].name && x.hidden === b[i].hidden);

function RowButton({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            className="rc-w-btn rc-w-tree-btn"
            title={label}
            aria-label={label}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        >
            <Icon name={icon} size={16} />
        </button>
    );
}

function Row({
    name,
    title,
    hidden,
    selected,
    onSelect,
    children,
}: {
    name: React.ReactNode;
    title?: string;
    hidden?: boolean;
    selected?: boolean;
    onSelect?: () => void;
    children?: React.ReactNode;
}) {
    return (
        <div
            className="rc-w-tree-row"
            role="treeitem"
            aria-selected={selected}
            data-hidden={hidden ? "" : undefined}
            data-active={selected ? "" : undefined}
            onClick={onSelect}
        >
            <span className="rc-w-tree-name" title={title}>
                {name}
            </span>
            <span className="rc-w-tree-actions">{children}</span>
        </div>
    );
}

/** Side panel listing panes → series, indicators and drawings, with visibility and remove buttons. */
export function ObjectTree() {
    const w = useWidget();
    const { state, dispatch, definitions, drawings } = w;
    const panes = [PRICE_PANE, ...indicatorPanes(state)];
    const symbol = w.symbolInfo(0).symbol;
    const paneDrawings = (paneId: string) => drawings.list.filter((d) => d.pane === paneId);
    // main series, volume and compare lines of the first chart, with their (legend) visibility
    const engine = w.engines.current?.[0] ?? null;
    const series = useEngineState(
        engine,
        (e) =>
            e
                .legendItems(PRICE_PANE, e.data.length - 1)
                .filter((i) => !state.indicators.some((ind) => ind.id === i.id))
                .map((i): SeriesRow => ({ id: i.id, name: i.name, hidden: !!i.hidden })),
        [],
        sameRows,
    );
    const seriesRow = (name: string) => series.find((r) => r.name === name);
    const eye = (row: SeriesRow | undefined, name: string) =>
        row && (
            <RowButton
                icon={row.hidden ? "eyeOff" : "eye"}
                label={`${row.hidden ? "Show" : "Hide"} ${name}`}
                onClick={() => engine?.setHidden(row.id)}
            />
        );
    const mainRow = seriesRow(symbol);
    const mainName = symbol || "Main series";
    const volumeRow = seriesRow(VOLUME_NAME);
    return (
        <aside className="rc-w-tree" aria-label="Object tree">
            <div className="rc-w-tree-header">
                <span>Object tree</span>
                <button
                    type="button"
                    className="rc-w-btn"
                    title="Close"
                    aria-label="Close object tree"
                    onClick={() => w.setObjectTreeOpen(false)}
                >
                    <Icon name="close" />
                </button>
            </div>
            <div className="rc-w-tree-body" role="tree">
                {panes.map((paneId, k) => (
                    <div key={paneId} role="group" aria-label={k === 0 ? "Main pane" : `Pane ${k + 1}`}>
                        <div className="rc-w-tree-pane" aria-hidden="true">
                            {k === 0 ? "Main pane" : `Pane ${k + 1}`}
                        </div>
                        {k === 0 && (
                            <Row name={mainName} hidden={mainRow?.hidden}>
                                {eye(mainRow, mainName)}
                                <RowButton
                                    icon="settings"
                                    label={`${mainName} settings`}
                                    onClick={() => w.openDialog({ kind: "settings" })}
                                />
                            </Row>
                        )}
                        {k === 0 && volumeRow && (
                            <Row name="Volume" hidden={volumeRow.hidden}>
                                {eye(volumeRow, "Volume")}
                                <RowButton
                                    icon="close"
                                    label="Remove volume"
                                    onClick={() => dispatch({ type: "settings", settings: { volume: false } })}
                                />
                            </Row>
                        )}
                        {k === 0 &&
                            (state.compare ?? []).map((s) => (
                                <Row key={s} name={s} hidden={seriesRow(s)?.hidden}>
                                    {eye(seriesRow(s), s)}
                                    <RowButton
                                        icon="close"
                                        label={`Remove ${s}`}
                                        onClick={() => dispatch({ type: "removeCompare", symbol: s })}
                                    />
                                </Row>
                            ))}
                        {state.indicators
                            .filter((i) => i.paneId === paneId)
                            .map((i) => {
                                const def = definitions[i.definitionId];
                                // same name as the legend ("EMA 9 close"), so several instances stay distinguishable
                                const name = def ? indicatorName(def, resolveInputs(def, i.inputs)) : i.definitionId;
                                return (
                                    <Row key={i.id} name={name} title={def?.name} hidden={i.hidden}>
                                        <RowButton
                                            icon={i.hidden ? "eyeOff" : "eye"}
                                            label={`${i.hidden ? "Show" : "Hide"} ${name}`}
                                            onClick={() =>
                                                dispatch({
                                                    type: "updateIndicator",
                                                    id: i.id,
                                                    patch: { hidden: !i.hidden },
                                                })
                                            }
                                        />
                                        <RowButton
                                            icon="settings"
                                            label={`${name} settings`}
                                            onClick={() => w.openDialog({ kind: "indicatorSettings", id: i.id })}
                                        />
                                        <RowButton
                                            icon="close"
                                            label={`Remove ${name}`}
                                            onClick={() => dispatch({ type: "removeIndicator", id: i.id })}
                                        />
                                    </Row>
                                );
                            })}
                        {drawings.available &&
                            paneDrawings(paneId).map((d) => (
                                <Row
                                    key={d.id}
                                    name={d.name}
                                    hidden={d.hidden}
                                    selected={drawings.selectedIds.includes(d.id)}
                                    onSelect={() => drawings.select(d.id)}
                                >
                                    <RowButton
                                        icon={d.hidden ? "eyeOff" : "eye"}
                                        label={`${d.hidden ? "Show" : "Hide"} ${d.name}`}
                                        onClick={() => drawings.toggle(d.id)}
                                    />
                                    <RowButton
                                        icon={d.locked ? "lock" : "unlock"}
                                        label={`${d.locked ? "Unlock" : "Lock"} ${d.name}`}
                                        onClick={() => drawings.toggleLock(d.id)}
                                    />
                                    <RowButton
                                        icon="close"
                                        label={`Remove ${d.name}`}
                                        onClick={() => drawings.remove(d.id)}
                                    />
                                </Row>
                            ))}
                    </div>
                ))}
            </div>
        </aside>
    );
}
