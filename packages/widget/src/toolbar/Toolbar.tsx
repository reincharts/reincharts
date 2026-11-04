import { useLayoutEffect, useRef } from "react";
import { useWidget } from "../context";
import { Icon, type IconName } from "../icons";
import { ChartTypeMenu } from "./ChartTypeMenu";
import { IntervalPicker } from "./IntervalPicker";
import { LayoutMenu } from "./LayoutMenu";

interface ToolButtonProps {
    readonly icon: IconName;
    /** Accessible name and tooltip. */
    readonly label: string;
    readonly onClick: () => void;
    /** Visible text after the icon. */
    readonly text?: string;
    readonly active?: boolean;
    readonly disabled?: boolean;
}

/** A 28px toolbar icon button (optionally with text). */
function ToolButton({ icon, label, onClick, text, active, disabled }: ToolButtonProps) {
    return (
        <button
            type="button"
            className={text ? "rc-w-btn rc-w-text-btn" : "rc-w-btn"}
            title={label}
            aria-label={label}
            aria-pressed={active === undefined ? undefined : active}
            data-active={active ? "" : undefined}
            disabled={disabled}
            onClick={onClick}
        >
            <Icon name={icon} />
            {text && <span>{text}</span>}
        </button>
    );
}

const Sep = () => <span className="rc-w-sep" />;

/** Collapse steps, applied until the toolbar fits: hide button text, other intervals, secondary buttons. */
const COMPACT_LEVELS = 3;

const fit = (bar: HTMLElement) => {
    if (bar.clientWidth === 0) {
        return;
    }
    let level = 0;
    bar.removeAttribute("data-compact");
    while (bar.scrollWidth > bar.clientWidth + 1 && level < COMPACT_LEVELS) {
        bar.dataset.compact = String(++level);
    }
};

/** Top toolbar: symbol, intervals, chart type, indicators, compare, layout, replay, undo / redo and view buttons. */
export function Toolbar() {
    const w = useWidget();
    const { datafeed, features, drawings } = w;
    const cell = w.activeCell;
    const symbol = w.symbolInfo(cell).symbol;
    const ref = useRef<HTMLDivElement>(null);
    // contents change with symbol, favorites, replay...: refit after every render
    useLayoutEffect(() => fit(ref.current!));
    useLayoutEffect(() => {
        const bar = ref.current!;
        const observer = new ResizeObserver(() => fit(bar));
        observer.observe(bar);
        return () => observer.disconnect();
    }, []);
    return (
        <div ref={ref} className="rc-w-toolbar" role="toolbar" aria-label="Chart toolbar">
            {datafeed ? (
                <button
                    type="button"
                    className="rc-w-btn rc-w-text-btn rc-w-symbol"
                    title="Symbol search"
                    aria-label={`Symbol search (${symbol || "none"})`}
                    onClick={() => w.openDialog({ kind: "symbol", cell })}
                >
                    <Icon name="search" />
                    <span>{symbol || "Symbol"}</span>
                </button>
            ) : (
                symbol && <span className="rc-w-symbol rc-w-symbol-static">{symbol}</span>
            )}
            {(datafeed || symbol) && <Sep />}
            {datafeed && (
                <>
                    <IntervalPicker />
                    <Sep />
                </>
            )}
            <ChartTypeMenu />
            <Sep />
            <ToolButton
                icon="indicators"
                label="Indicators"
                text="Indicators"
                onClick={() => w.openDialog({ kind: "indicators" })}
            />
            {/* secondary controls are hidden when the toolbar does not fit otherwise */}
            <span className="rc-w-secondary">
                {features.compare && (
                    <ToolButton
                        icon="compare"
                        label="Compare symbol"
                        onClick={() => w.openDialog({ kind: "compare" })}
                    />
                )}
                <Sep />
                <LayoutMenu />
            </span>
            {features.replay && (
                <ToolButton
                    icon="replay"
                    label="Bar replay"
                    text="Replay"
                    active={w.replay}
                    onClick={() => w.setReplay(!w.replay)}
                />
            )}
            {drawings.available && (
                <span className="rc-w-secondary">
                    <Sep />
                    <ToolButton icon="undo" label="Undo" onClick={drawings.undo} disabled={!drawings.canUndo} />
                    <ToolButton icon="redo" label="Redo" onClick={drawings.redo} disabled={!drawings.canRedo} />
                </span>
            )}
            <span className="rc-w-spacer" />
            {features.objectTree && (
                <span className="rc-w-secondary">
                    <ToolButton
                        icon="objectTree"
                        label="Object tree"
                        active={w.objectTreeOpen}
                        onClick={() => w.setObjectTreeOpen(!w.objectTreeOpen)}
                    />
                </span>
            )}
            <ToolButton icon="settings" label="Settings" onClick={() => w.openDialog({ kind: "settings" })} />
            <span className="rc-w-secondary">
                <ToolButton
                    icon={w.themeName === "dark" ? "sun" : "moon"}
                    label={w.themeName === "dark" ? "Light theme" : "Dark theme"}
                    onClick={() => w.dispatch({ type: "theme", theme: w.themeName === "dark" ? "light" : "dark" })}
                />
                {/* not offered where elements can't go fullscreen (iPhone Safari) */}
                {features.fullscreen && (
                    <ToolButton
                        icon={w.fullscreen ? "exitFullscreen" : "fullscreen"}
                        label={w.fullscreen ? "Exit fullscreen" : "Fullscreen"}
                        onClick={w.toggleFullscreen}
                    />
                )}
            </span>
            <ToolButton icon="camera" label="Take a snapshot" onClick={w.downloadScreenshot} />
        </div>
    );
}
