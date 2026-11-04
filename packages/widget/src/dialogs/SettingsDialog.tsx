import type { CrosshairMode } from "@reincharts/coordinates";
import * as React from "react";
import { useWidget } from "../context";
import type { TradingChartSettings } from "../state";
import { localZone, zoneLabel, zoneOptions } from "../utils";
import { Dialog } from "./Dialog";

const TOGGLES: { key: keyof TradingChartSettings; label: string }[] = [
    { key: "volume", label: "Volume" },
    { key: "lastPriceLine", label: "Last price line" },
    { key: "grid", label: "Grid lines" },
    { key: "legend", label: "Legend" },
    { key: "watermark", label: "Symbol watermark" },
];

/** Chart settings: theme, crosshair, time zone and visibility toggles (Ok / Cancel). */
export function SettingsDialog({ onClose }: { readonly onClose: () => void }) {
    const w = useWidget();
    // the effective values (the time zone defaults to the browser's)
    const current = { ...w.settings, timeZone: w.settings.timeZone ?? localZone() };
    const [draft, setDraft] = React.useState(current);
    const [theme, setTheme] = React.useState(w.themeName);
    const uid = React.useId();
    const browser = localZone();
    const apply = () => {
        // store only what the user changed, so untouched options keep following the TradingChart props
        const changed: TradingChartSettings = {};
        for (const key of Object.keys(draft) as (keyof TradingChartSettings)[]) {
            if (draft[key] !== current[key]) {
                (changed as Record<string, unknown>)[key] = draft[key];
            }
        }
        if (Object.keys(changed).length) {
            w.dispatch({ type: "settings", settings: changed });
        }
        if (theme !== w.themeName) {
            w.dispatch({ type: "theme", theme });
        }
        onClose();
    };
    return (
        <Dialog
            title="Chart settings"
            onClose={onClose}
            width={420}
            footer={
                <>
                    <button type="button" className="rc-w-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="rc-w-button rc-w-button-primary" onClick={apply}>
                        Ok
                    </button>
                </>
            }
        >
            <div className="rc-w-form">
                <div className="rc-w-form-row">
                    <label htmlFor={`${uid}-theme`}>Theme</label>
                    <select
                        id={`${uid}-theme`}
                        className="rc-w-select rc-w-field"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                    >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
                <div className="rc-w-form-row">
                    <label htmlFor={`${uid}-crosshair`}>Crosshair</label>
                    <select
                        id={`${uid}-crosshair`}
                        className="rc-w-select rc-w-field"
                        value={draft.crosshair}
                        onChange={(e) => setDraft((d) => ({ ...d, crosshair: e.target.value as CrosshairMode }))}
                    >
                        <option value="normal">Normal</option>
                        <option value="magnet">Magnet</option>
                        <option value="hidden">Hidden</option>
                    </select>
                </div>
                <div className="rc-w-form-row">
                    <label htmlFor={`${uid}-tz`}>Time zone</label>
                    <select
                        id={`${uid}-tz`}
                        className="rc-w-select rc-w-field"
                        value={draft.timeZone}
                        onChange={(e) => setDraft((d) => ({ ...d, timeZone: e.target.value }))}
                    >
                        {zoneOptions(draft.timeZone).map((z) => (
                            <option key={z} value={z} title={z}>
                                {z === browser ? `${zoneLabel(z)} (browser)` : zoneLabel(z)}
                            </option>
                        ))}
                    </select>
                </div>
                {TOGGLES.map((t) => (
                    <div key={t.key} className="rc-w-form-row">
                        <label className="rc-w-check">
                            <input
                                type="checkbox"
                                checked={!!draft[t.key]}
                                onChange={(e) => setDraft((d) => ({ ...d, [t.key]: e.target.checked }))}
                            />
                            {t.label}
                        </label>
                    </div>
                ))}
            </div>
        </Dialog>
    );
}
