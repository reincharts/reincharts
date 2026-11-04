import { indicatorName, resolveInputs, type IndicatorInput, type IndicatorOutputStyle } from "@reincharts/indicators";
import * as React from "react";
import { useWidget } from "../context";
import { Dialog } from "./Dialog";

/** Converts #rgb / #rrggbb / rgb() / rgba() to #rrggbb for `<input type="color">`. */
const toHex = (color: string | undefined, fallback = "#2962ff"): string => {
    if (!color) {
        return fallback;
    }
    const c = color.trim();
    if (/^#[0-9a-f]{6}$/i.test(c)) {
        return c.toLowerCase();
    }
    if (/^#[0-9a-f]{3}$/i.test(c)) {
        return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`.toLowerCase();
    }
    const m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(c);
    if (m) {
        return `#${[m[1], m[2], m[3]].map((v) => Math.min(255, Number(v)).toString(16).padStart(2, "0")).join("")}`;
    }
    return fallback;
};

/** Line widths of the style tab (plus the current one). */
const widthOptions = (current: number) => Array.from(new Set([1, 1.5, 2, 3, 4, current])).sort((a, b) => a - b);

/** Only the inputs that differ from the definition defaults. */
const changedInputs = (inputs: Record<string, unknown>, defs: Record<string, IndicatorInput>) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(inputs)) {
        if (defs[k] && v !== defs[k].default) {
            out[k] = v;
        }
    }
    return out;
};

interface FieldProps {
    readonly id: string;
    readonly spec: IndicatorInput;
    readonly value: unknown;
    readonly onChange: (v: unknown) => void;
}

function InputField({ id, spec, value, onChange }: FieldProps) {
    switch (spec.type) {
        case "boolean":
            return <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
        case "color":
            return (
                <input
                    id={id}
                    className="rc-w-color"
                    type="color"
                    value={toHex(typeof value === "string" ? value : undefined)}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
        case "select":
        case "source": {
            const options = spec.options ?? [];
            const current = typeof value === "string" ? value : "";
            return (
                <select
                    id={id}
                    className="rc-w-select rc-w-field"
                    value={current}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {!options.includes(current) && <option value={current}>{current || "custom"}</option>}
                    {options.map((o) => (
                        <option key={o} value={o}>
                            {o}
                        </option>
                    ))}
                </select>
            );
        }
        default:
            return <NumberField id={id} spec={spec} value={value} onChange={onChange} />;
    }
}

const numberText = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? String(v) : "");

/**
 * Number input that can be cleared and retyped: the text is local, valid numbers are reported as they are typed,
 * and the value is clamped to min / max (or restored when empty) on blur.
 */
function NumberField({ id, spec, value, onChange }: FieldProps) {
    const [text, setText] = React.useState(() => numberText(value));
    // follow outside changes (Defaults button)
    const [prev, setPrev] = React.useState(value);
    if (value !== prev) {
        setPrev(value);
        if (text === "" || Number(text) !== value) {
            setText(numberText(value));
        }
    }
    return (
        <input
            id={id}
            className="rc-w-input rc-w-field"
            type="number"
            min={spec.min}
            max={spec.max}
            step={spec.step ?? "any"}
            value={text}
            onChange={(e) => {
                setText(e.target.value);
                const n = e.target.valueAsNumber;
                if (Number.isFinite(n)) {
                    onChange(n);
                }
            }}
            onBlur={() => {
                const n = Number(text);
                const clamped =
                    text === "" || !Number.isFinite(n)
                        ? value
                        : Math.min(spec.max ?? Infinity, Math.max(spec.min ?? -Infinity, n));
                setText(numberText(clamped));
                if (clamped !== value) {
                    onChange(clamped);
                }
            }}
        />
    );
}

/** Inputs / Style tabs of one indicator, with Defaults, Cancel and Ok. */
export function IndicatorSettingsDialog({ id, onClose }: { readonly id: string; readonly onClose: () => void }) {
    const { state, definitions, dispatch, chartTheme } = useWidget();
    const indicator = state.indicators.find((i) => i.id === id);
    const def = indicator ? definitions[indicator.definitionId] : undefined;
    const [tab, setTab] = React.useState<"inputs" | "style">(
        def && Object.keys(def.inputs).length === 0 ? "style" : "inputs",
    );
    const [inputs, setInputs] = React.useState<Record<string, unknown>>(() =>
        def ? (resolveInputs(def, indicator!.inputs) as Record<string, unknown>) : {},
    );
    const [styles, setStyles] = React.useState<Record<string, IndicatorOutputStyle>>(() => ({
        ...indicator?.styles,
    }));
    const uid = React.useId();
    if (!indicator || !def) {
        return null;
    }
    const setStyle = (key: string, patch: IndicatorOutputStyle) =>
        setStyles((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
    const apply = () => {
        dispatch({ type: "updateIndicator", id, patch: { inputs: changedInputs(inputs, def.inputs), styles } });
        onClose();
    };
    const inputEntries = Object.entries(def.inputs);
    return (
        <Dialog
            title={indicatorName(def, inputs)}
            onClose={onClose}
            width={420}
            footer={
                <>
                    <button
                        type="button"
                        className="rc-w-button rc-w-button-ghost rc-w-footer-left"
                        onClick={() => {
                            setInputs(resolveInputs(def, {}) as Record<string, unknown>);
                            setStyles({});
                        }}
                    >
                        Defaults
                    </button>
                    <button type="button" className="rc-w-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="rc-w-button rc-w-button-primary" onClick={apply}>
                        Ok
                    </button>
                </>
            }
        >
            <div className="rc-w-tabs" role="tablist">
                {(["inputs", "style"] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        role="tab"
                        aria-selected={tab === t}
                        className="rc-w-tab"
                        data-active={tab === t ? "" : undefined}
                        onClick={() => setTab(t)}
                    >
                        {t === "inputs" ? "Inputs" : "Style"}
                    </button>
                ))}
            </div>
            <div className="rc-w-form" role="tabpanel">
                {tab === "inputs" &&
                    (inputEntries.length ? (
                        inputEntries.map(([key, spec]) => (
                            <div key={key} className="rc-w-form-row">
                                <label htmlFor={`${uid}-${key}`}>{spec.label}</label>
                                <InputField
                                    id={`${uid}-${key}`}
                                    spec={spec}
                                    value={inputs[key]}
                                    onChange={(v) => setInputs((s) => ({ ...s, [key]: v }))}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="rc-w-empty">No inputs</div>
                    ))}
                {tab === "style" &&
                    Object.entries(def.outputs).map(([key, o], k) => {
                        const s = styles[key] ?? {};
                        const visible = s.visible ?? !o.hidden;
                        const color = s.color ?? o.color ?? chartTheme.palette[k % chartTheme.palette.length];
                        return (
                            <div key={key} className="rc-w-form-row">
                                <label className="rc-w-check">
                                    <input
                                        type="checkbox"
                                        checked={visible}
                                        onChange={(e) => setStyle(key, { visible: e.target.checked })}
                                    />
                                    {o.label}
                                </label>
                                <span className="rc-w-style-controls">
                                    <input
                                        className="rc-w-color"
                                        type="color"
                                        aria-label={`${o.label} color`}
                                        value={toHex(color)}
                                        onChange={(e) => setStyle(key, { color: e.target.value })}
                                    />
                                    <select
                                        className="rc-w-select rc-w-field"
                                        aria-label={`${o.label} width`}
                                        value={s.width ?? o.width ?? (o.type === "dots" ? 2 : 1.5)}
                                        onChange={(e) => setStyle(key, { width: Number(e.target.value) })}
                                    >
                                        {widthOptions(s.width ?? o.width ?? (o.type === "dots" ? 2 : 1.5)).map((wd) => (
                                            <option key={wd} value={wd}>
                                                {wd}px
                                            </option>
                                        ))}
                                    </select>
                                </span>
                            </div>
                        );
                    })}
            </div>
        </Dialog>
    );
}
