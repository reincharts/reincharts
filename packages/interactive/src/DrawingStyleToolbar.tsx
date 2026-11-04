import { useChart, useChartState, withAlpha, type LineDash } from "@reincharts/core";
import * as React from "react";
import type { DrawingController } from "./controller";
import { createGeometry } from "./geometry";
import { icons } from "./icons";
import type { DrawingStyle, StyleControl } from "./types";
import { useDrawingState } from "./useDrawings";

export interface DrawingStyleToolbarProps {
    /** Controller from `useDrawings()`. */
    readonly controller: DrawingController;
    /** Color swatches offered by the color pickers. */
    readonly colors?: readonly string[];
    /** Fixed position (chart pixels) instead of floating above the selected drawing. */
    readonly position?: { readonly left: number; readonly top: number };
    /** Extra CSS class. */
    readonly className?: string;
}

/** Default color swatches. */
export const DRAWING_COLORS = [
    "#f23645",
    "#ff9800",
    "#ffeb3b",
    "#4caf50",
    "#089981",
    "#00bcd4",
    "#2962ff",
    "#673ab7",
    "#9c27b0",
    "#e91e63",
    "#787b86",
    "#131722",
    "#ffffff",
];

const widths = [1, 2, 3, 4];
const dashes: readonly LineDash[] = ["solid", "dashed", "dotted"];
const dashLabels: Record<string, string> = { solid: "Solid", dashed: "Dashed", dotted: "Dotted" };
const extendModes: NonNullable<DrawingStyle["extend"]>[] = ["none", "left", "right", "both"];
const fontSizes = [10, 11, 12, 14, 16, 20, 24, 28];

const dashSvg = (dash: LineDash | undefined, width = 2) => (
    <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
        <path
            d="M5 14h18"
            stroke="currentColor"
            strokeWidth={width}
            strokeDasharray={dash === "dashed" ? "4 3" : dash === "dotted" ? "1.5 2.5" : undefined}
            strokeLinecap={dash === "dotted" ? "round" : "butt"}
        />
    </svg>
);

const extendSvg = (mode: NonNullable<DrawingStyle["extend"]>) => (
    <svg
        viewBox="0 0 28 28"
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        aria-hidden="true"
    >
        <path
            d={`M${mode === "left" || mode === "both" ? 3 : 9} 14H${mode === "right" || mode === "both" ? 25 : 19}`}
        />
        <circle cx="9" cy="14" r="1.9" />
        <circle cx="19" cy="14" r="1.9" />
    </svg>
);

/** Floating style editor shown above the selected drawing(s): color, width, dash, fill, lock, clone, delete. */
export function DrawingStyleToolbar({
    controller,
    colors = DRAWING_COLORS,
    position,
    className,
}: DrawingStyleToolbarProps) {
    const engine = useChart();
    const state = useDrawingState(controller);
    const theme = useChartState((s) => s.theme);
    useChartState((s) => s.version);
    const [open, setOpen] = React.useState<StyleControl | null>(null);
    const selected = state.selectedIds.map((id) => state.drawings.find((d) => d.id === id)).filter((d) => !!d);
    const first = selected[0];
    React.useEffect(() => setOpen(null), [first?.id]);
    if (!first || state.hidden || state.editingId) {
        return null;
    }
    const tool = controller.getTool(first.type);
    const pane = engine.layout.panes.find((p) => p.id === first.pane);
    if (!tool || !pane) {
        return null;
    }
    const g = createGeometry(first, {
        engine,
        scale: engine.getScale(first.pane, first.scale ?? "right"),
        theme,
        width: pane.width,
        height: pane.height,
    });
    const pts = tool.handles?.(g) ?? g.points;
    let left = position?.left;
    let top = position?.top;
    if (left === undefined || top === undefined) {
        const xs = pts.length ? pts.map((p) => p.x) : [pane.width / 2];
        const ys = pts.length ? pts.map((p) => p.y) : [pane.height / 2];
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const minY = Math.min(...ys);
        left = pane.left + Math.min(Math.max(cx, 150), Math.max(150, pane.width - 150));
        top = pane.top + (minY - 52 > 4 ? minY - 52 : Math.min(pane.height - 44, Math.max(...ys) + 16));
    }
    const controls = tool.styleControls ?? ["color", "width", "dash"];
    const ids = selected.map((d) => d.id);
    const locked = selected.every((d) => d.locked);
    const setStyle = (style: DrawingStyle) => controller.update(ids, { style });
    const style = first.style;
    const color = style.color ?? theme.drawing.color;
    const toggle = (c: StyleControl) => setOpen(open === c ? null : c);
    /** Popup list of options (icon + label); picking one applies it and closes the popup. */
    const optionList = <V,>(
        values: readonly V[],
        current: V,
        pick: (v: V) => void,
        render: (v: V) => React.ReactNode,
    ) => (
        <div className="rc-dst-popup rc-dst-list">
            {values.map((v) => (
                <button
                    key={String(v)}
                    type="button"
                    className={`rc-dst-option${current === v ? " rc-active" : ""}`}
                    onClick={() => {
                        pick(v);
                        setOpen(null);
                    }}
                >
                    {render(v)}
                </button>
            ))}
        </div>
    );
    const swatches = (pick: (c: string) => void, current: string | undefined, alpha?: number) => (
        <div className="rc-dst-popup rc-dst-colors">
            {colors.map((c) => {
                const value = alpha === undefined ? c : withAlpha(c, alpha);
                return (
                    <button
                        key={c}
                        type="button"
                        className={`rc-dst-swatch${current === value ? " rc-active" : ""}`}
                        style={{ background: c }}
                        aria-label={c}
                        onClick={() => {
                            pick(value);
                            setOpen(null);
                        }}
                    />
                );
            })}
        </div>
    );

    return (
        <div
            className={`rc-dst${className ? ` ${className}` : ""}`}
            data-theme={theme.name === "dark" ? "dark" : "light"}
            style={{ left, top }}
            onPointerDown={(e) => e.stopPropagation()}
            role="toolbar"
        >
            {controls.includes("color") && (
                <div className="rc-dst-item">
                    <button type="button" className="rc-dst-btn" title="Color" onClick={() => toggle("color")}>
                        <span className="rc-dst-color" style={{ background: color }} />
                    </button>
                    {open === "color" && swatches((c) => setStyle({ color: c }), style.color)}
                </div>
            )}
            {controls.includes("fill") && (
                <div className="rc-dst-item">
                    <button type="button" className="rc-dst-btn" title="Background" onClick={() => toggle("fill")}>
                        <span
                            className="rc-dst-color rc-dst-fill"
                            style={{ background: style.fill ?? withAlpha(color, 0.2) }}
                        />
                    </button>
                    {open === "fill" && swatches((c) => setStyle({ fill: c }), style.fill, 0.2)}
                </div>
            )}
            {controls.includes("width") && (
                <div className="rc-dst-item">
                    <button
                        type="button"
                        className="rc-dst-btn rc-dst-wide"
                        title="Line width"
                        onClick={() => toggle("width")}
                    >
                        {dashSvg("solid", style.width ?? 1)}
                        <span>{style.width ?? 1}px</span>
                    </button>
                    {open === "width" &&
                        optionList(
                            widths,
                            style.width ?? 1,
                            (width) => setStyle({ width }),
                            (w) => (
                                <>
                                    {dashSvg("solid", w)}
                                    <span>{w}px</span>
                                </>
                            ),
                        )}
                </div>
            )}
            {controls.includes("dash") && (
                <div className="rc-dst-item">
                    <button type="button" className="rc-dst-btn" title="Line style" onClick={() => toggle("dash")}>
                        {dashSvg(style.dash)}
                    </button>
                    {open === "dash" &&
                        optionList(
                            dashes,
                            style.dash ?? "solid",
                            (dash) => setStyle({ dash }),
                            (d) => (
                                <>
                                    {dashSvg(d)}
                                    <span>{dashLabels[String(d)]}</span>
                                </>
                            ),
                        )}
                </div>
            )}
            {controls.includes("extend") && (
                <div className="rc-dst-item">
                    <button type="button" className="rc-dst-btn" title="Extend" onClick={() => toggle("extend")}>
                        {extendSvg(style.extend ?? "none")}
                    </button>
                    {open === "extend" &&
                        optionList(
                            extendModes,
                            style.extend ?? "none",
                            (extend) => setStyle({ extend }),
                            (m) => (
                                <>
                                    {extendSvg(m)}
                                    <span>{m === "none" ? "Don't extend" : `Extend ${m}`}</span>
                                </>
                            ),
                        )}
                </div>
            )}
            {controls.includes("fontSize") && (
                <div className="rc-dst-item">
                    <select
                        className="rc-dst-select"
                        title="Font size"
                        value={style.fontSize ?? 14}
                        onChange={(e) => setStyle({ fontSize: Number(e.target.value) })}
                    >
                        {fontSizes.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            {controls.includes("text") && (
                <div className="rc-dst-item">
                    <button
                        type="button"
                        className="rc-dst-btn"
                        title="Text"
                        onClick={() => (tool.editableText ? controller.edit(first.id) : toggle("text"))}
                    >
                        {icons.text}
                    </button>
                    {open === "text" && (
                        <div className="rc-dst-popup">
                            <input
                                className="rc-dst-input"
                                autoFocus
                                defaultValue={style.text ?? ""}
                                placeholder="Text"
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === "Enter") {
                                        setStyle({ text: e.currentTarget.value });
                                        setOpen(null);
                                    } else if (e.key === "Escape") {
                                        setOpen(null);
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
            <div className="rc-dst-sep" />
            <button
                type="button"
                className={`rc-dst-btn${locked ? " rc-active" : ""}`}
                title={locked ? "Unlock" : "Lock"}
                onClick={() => controller.update(ids, { locked: !locked })}
            >
                {locked ? icons.lock : icons.unlock}
            </button>
            <button type="button" className="rc-dst-btn" title="Clone" onClick={() => controller.duplicate(ids)}>
                {icons.clone}
            </button>
            <button type="button" className="rc-dst-btn" title="Remove" onClick={() => controller.remove(ids)}>
                {icons.trash}
            </button>
        </div>
    );
}
