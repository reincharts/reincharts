import type { ChartEngine } from "@reincharts/core";
import { chartTypeInfo } from "./chartTypes";
import { useEngineState, useWidget } from "./context";
import { applyPreset, RANGE_PRESETS, type RangePreset } from "./rangePresets";
import type { ScaleMode } from "./state";
import { Dropdown, MenuItem } from "./toolbar/Menu";
import { localZone, zoneLabel, zoneOptions } from "./utils";

/** Applies a preset, loading older history (via onReachStart) until the range is covered. */
const showPreset = (engine: ChartEngine, preset: RangePreset) => {
    let attempts = 0;
    const run = () => {
        const missing = applyPreset(engine, preset);
        if (missing === undefined || attempts++ >= 20 || !engine.options.onReachStart) {
            return;
        }
        const off = engine.on("datachange", (e) => {
            off();
            if (e.prepended > 0) {
                // wait for the chart to apply the new data before measuring again
                requestAnimationFrame(run);
            }
        });
        engine.options.onReachStart(engine.times[0]);
    };
    run();
};

/** Range presets, time zone and the % / log / auto price scale toggles. */
export function BottomBar() {
    const w = useWidget();
    const { engine, state, dispatch, settings } = w;
    const auto = useEngineState(engine, (e) => e.getScale("price").isAuto, true);
    const timeBased = chartTypeInfo(state.chartType).timeBased;
    const browser = localZone();
    const zone = settings.timeZone ?? browser;
    const toggleMode = (mode: ScaleMode) =>
        dispatch({ type: "scaleMode", mode: state.scaleMode === mode ? "linear" : mode });
    return (
        <div className="rc-w-bottombar" role="toolbar" aria-label="Range and scale">
            {RANGE_PRESETS.map((p) => (
                <button
                    key={p}
                    type="button"
                    className="rc-w-btn rc-w-text-btn rc-w-range"
                    disabled={!engine || (!timeBased && p !== "All")}
                    title={p === "All" ? "All data" : p === "YTD" ? "Year to date" : `Last ${p}`}
                    onClick={() => engine && showPreset(engine, p)}
                >
                    {p}
                </button>
            ))}
            <span className="rc-w-spacer" />
            <Dropdown
                title={`Time zone: ${zoneLabel(zone)}`}
                label={zoneLabel(zone)}
                className="rc-w-text-btn rc-w-zone"
                alignRight
                up
            >
                {(close) =>
                    zoneOptions(zone).map((z) => (
                        <MenuItem
                            key={z}
                            icon={z === zone ? "check" : null}
                            label={z === browser ? `${zoneLabel(z)} (browser)` : zoneLabel(z)}
                            active={z === zone}
                            onClick={() => {
                                if (z !== zone) {
                                    dispatch({ type: "settings", settings: { timeZone: z } });
                                }
                                close();
                            }}
                        />
                    ))
                }
            </Dropdown>
            <span className="rc-w-sep" />
            <button
                type="button"
                className="rc-w-btn rc-w-text-btn rc-w-scale-btn"
                data-active={state.scaleMode === "percent" ? "" : undefined}
                aria-pressed={state.scaleMode === "percent"}
                title="Toggle percentage scale"
                aria-label="Percentage scale"
                onClick={() => toggleMode("percent")}
            >
                %
            </button>
            <button
                type="button"
                className="rc-w-btn rc-w-text-btn rc-w-scale-btn"
                data-active={state.scaleMode === "log" ? "" : undefined}
                aria-pressed={state.scaleMode === "log"}
                title="Toggle log scale"
                aria-label="Log scale"
                onClick={() => toggleMode("log")}
            >
                log
            </button>
            <button
                type="button"
                className="rc-w-btn rc-w-text-btn rc-w-scale-btn"
                data-active={auto ? "" : undefined}
                aria-pressed={auto}
                title="Auto (fits data to screen)"
                aria-label="Auto scale"
                onClick={() => {
                    for (const e of w.engines.current) {
                        for (const s of e?.paneScales("price") ?? []) {
                            s.resetAuto();
                        }
                        e?.invalidate("layout");
                    }
                }}
            >
                auto
            </button>
        </div>
    );
}
