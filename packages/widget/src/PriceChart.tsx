import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Watermark } from "@reincharts/annotations";
import {
    ChartCanvas,
    formatCompact,
    formatPrice,
    Pane,
    shallowEqual,
    useChart,
    useChartEvent,
    useChartState,
    type ChartEngine,
} from "@reincharts/core";
import { Crosshair, LastValueLabel } from "@reincharts/coordinates";
import { Indicator } from "@reincharts/indicators";
import { LineSeries, VolumeSeries } from "@reincharts/series";
import * as React from "react";
import { MainSeries } from "./chartTypes";
import { useWidget } from "./context";
import { ChartDrawings } from "./Drawings";
import { Icon } from "./icons";
import { PaneControls, PaneLegend, VOLUME_NAME } from "./legend";
import { indicatorPanes, PRICE_PANE, type IndicatorState } from "./state";

/** A compare symbol aligned to the chart bars. */
export interface CompareLine {
    readonly symbol: string;
    readonly values: readonly (number | undefined)[];
    readonly color: string;
}

export interface PriceChartProps {
    readonly cell: number;
    /** Chart data (already transformed for the chart type). */
    readonly data: readonly any[];
    readonly symbol: string;
    readonly exchange?: string;
    readonly description?: string;
    /** Interval label ("1D", "5m"). */
    readonly interval: string;
    readonly precision?: number;
    readonly compare: readonly CompareLine[];
    readonly resetKey: string;
    readonly onReachStart?: () => void;
    /** Click on a bar (replay start selection). */
    readonly onBarClick?: (index: number) => void;
    readonly ratio?: number;
}

const volumeScale = { margins: { top: 0.8, bottom: 0 } };

function IndicatorView({ indicator }: { readonly indicator: IndicatorState }) {
    const def = useWidget().definitions[indicator.definitionId];
    if (!def) {
        return null;
    }
    return (
        <Indicator
            definition={def}
            id={indicator.id}
            inputs={indicator.inputs}
            styles={indicator.styles}
            visible={!indicator.hidden}
        />
    );
}

/** Context menu, active cell and replay clicks. */
function ChartEvents({ cell, onBarClick }: { readonly cell: number; readonly onBarClick?: (index: number) => void }) {
    const w = useWidget();
    const engine = useChart();
    useChartEvent(
        "contextmenu",
        w.features.contextMenu
            ? (e) => {
                  e.preventDefault();
                  const root = w.rootRef.current?.getBoundingClientRect();
                  const native = e.native as MouseEvent;
                  const paneId = e.paneId;
                  const price = paneId ? e.price() : undefined;
                  const scale = paneId ? engine.getScale(paneId) : undefined;
                  w.openContextMenu({
                      x: native.clientX - (root?.left ?? 0),
                      y: native.clientY - (root?.top ?? 0),
                      cell,
                      paneId,
                      price,
                      // the price itself, also on % / indexed scales (whose labels are relative)
                      priceText:
                          scale && price !== undefined && Number.isFinite(price)
                              ? scale.mode === "percent" || scale.mode === "indexed"
                                  ? formatPrice(price, scale.options.precision)
                                  : scale.format(price)
                              : undefined,
                  });
              }
            : undefined,
    );
    useChartEvent("click", onBarClick ? (e) => e.index >= 0 && onBarClick(e.index) : undefined);
    return null;
}

/** ">>" button that scrolls back to the latest bar, shown when it is out of view. */
function RealtimeButton() {
    const engine = useChart();
    const s = useChartState(
        (st) => ({
            show: st.dataLength > 0 && st.range.to < st.dataLength - 1,
            right: st.layout.axisRight,
            bottom: st.layout.timeAxis?.height ?? 0,
        }),
        shallowEqual,
    );
    if (!s.show) {
        return null;
    }
    return (
        <button
            type="button"
            className="rc-w-realtime"
            style={{ right: s.right + 8, bottom: s.bottom + 8 }}
            title="Scroll to the most recent bar"
            aria-label="Scroll to the most recent bar"
            onClick={() => engine.scrollToRealtime()}
        >
            <Icon name="realtime" size={16} />
        </button>
    );
}

/** One chart: price pane (series, volume, overlays, legend), indicator panes, axes and crosshair. */
export function PriceChart({
    cell,
    data,
    symbol,
    exchange,
    description,
    interval,
    precision,
    compare,
    resetKey,
    onReachStart,
    onBarClick,
    ratio,
}: PriceChartProps) {
    const w = useWidget();
    const { state, settings, registerEngine, pendingRange } = w;
    const engineRef = React.useRef<ChartEngine | null>(null);
    const setEngine = React.useCallback(
        (e: ChartEngine | null) => {
            engineRef.current = e;
            registerEngine(cell, e);
        },
        [cell, registerEngine],
    );

    // restore a saved / loaded visible range once the first chart has its data. Runs after every render, after
    // ChartCanvas applied the new data and reset key (child effects run first), so a reset doesn't undo it.
    React.useLayoutEffect(() => {
        const range = pendingRange.current;
        const e = engineRef.current;
        if (cell === 0 && range && e && data.length) {
            pendingRange.current = undefined;
            e.setVisibleRange(range.from, range.to);
        }
    });

    const sizes = state.paneSizes ?? {};
    const panes = indicatorPanes(state);
    const overlays = state.indicators.filter((i) => i.paneId === PRICE_PANE);
    const last = data[data.length - 1];
    const hasVolume = typeof last?.volume === "number";
    const title = [symbol, interval, exchange].filter(Boolean).join(" · ");
    const scales = React.useMemo(
        () => ({ right: { mode: state.scaleMode, precision }, volume: volumeScale }),
        [state.scaleMode, precision],
    );
    const compareNames = React.useMemo(() => compare.map((c) => c.symbol), [compare]);
    // axis labels for every series of the right scale, a dotted price line for the main series only
    const isMain = (e: { scale: string; name: string }) => e.scale === "right" && e.name === symbol;
    const onRight = (e: { scale: string }) => e.scale === "right";

    return (
        <ChartCanvas
            ref={setEngine}
            data={data}
            theme={w.chartTheme}
            timeZone={settings.timeZone}
            xType="time"
            syncId={w.syncId}
            syncRange={w.syncRange}
            resetKey={resetKey}
            onReachStart={onReachStart}
            ratio={ratio}
        >
            <Pane id={PRICE_PANE} size={sizes[PRICE_PANE] ?? 3} scales={scales}>
                {settings.grid && <Grid />}
                {settings.watermark && symbol && <Watermark text={symbol} subtitle={description} />}
                {settings.volume && hasVolume && (
                    <VolumeSeries scale="volume" name={VOLUME_NAME} format={formatCompact} zIndex={-1} />
                )}
                <MainSeries type={state.chartType} name={symbol} />
                {compare.map((c) => (
                    <LineSeries
                        key={c.symbol}
                        name={c.symbol}
                        y={(_d: unknown, i: number) => c.values[i]}
                        color={c.color}
                        width={1.5}
                    />
                ))}
                {overlays.map((i) => (
                    <IndicatorView key={i.id} indicator={i} />
                ))}
                {settings.lastPriceLine && <LastValueLabel line axisLabel={false} filter={isMain} zIndex={-1} />}
                <LastValueLabel filter={onRight} />
                <YAxis />
                {settings.legend && (
                    <PaneLegend paneId={PRICE_PANE} symbol={symbol} title={title} compare={compareNames} />
                )}
                {panes.length > 0 && <PaneControls paneId={PRICE_PANE} />}
                {cell === 0 && w.drawings.available && <ChartDrawings integration={w.drawings} />}
            </Pane>
            {panes.map((paneId) => (
                <Pane key={paneId} id={paneId} size={sizes[paneId] ?? 1}>
                    {settings.grid && <Grid />}
                    {state.indicators
                        .filter((i) => i.paneId === paneId)
                        .map((i) => (
                            <IndicatorView key={i.id} indicator={i} />
                        ))}
                    <LastValueLabel />
                    <YAxis />
                    {settings.legend && <PaneLegend paneId={paneId} />}
                    <PaneControls paneId={paneId} />
                </Pane>
            ))}
            <XAxis />
            <Crosshair mode={settings.crosshair} />
            <ChartEvents cell={cell} onBarClick={onBarClick} />
            <RealtimeButton />
        </ChartCanvas>
    );
}
