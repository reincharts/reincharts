import { alignSeries, useBarReplay, useDatafeed, type Bar, type Datafeed } from "@reincharts/datafeed";
import * as React from "react";
import { chartData, chartTypeInfo, dataFamily } from "./chartTypes";
import { useWidget } from "./context";
import { Icon } from "./icons";
import { PriceChart, type CompareLine } from "./PriceChart";
import { ReplayBar } from "./ReplayBar";
import { inferResolution, intervalLabel, timeOf } from "./utils";

const EMPTY: readonly any[] = [];
const DISABLED: Datafeed = { getBars: async () => ({ bars: [], noData: true }) };

/** Loads a compare symbol and reports its bars. */
function CompareFeed({
    datafeed,
    symbol,
    resolution,
    onData,
}: {
    datafeed: Datafeed;
    symbol: string;
    resolution: string;
    onData: (symbol: string, bars: readonly Bar[]) => void;
}) {
    const { data } = useDatafeed(datafeed, { symbol, resolution, initialBars: 2000 });
    React.useEffect(() => onData(symbol, data), [symbol, data, onData]);
    return null;
}

/** Close of `other` aligned to each chart bar (last known value carried forward). */
const alignCloses = (data: readonly any[], other: readonly Bar[] | undefined): (number | undefined)[] => {
    if (!other?.length || !data.length) {
        return [];
    }
    const base = data.map((d) => ({ time: timeOf(d) }));
    return alignSeries(base, other, "c", { fill: "previous" }).map((x) => x.c?.close);
};

/** Index in `bars` of the chart datum `index` (renko bricks, kagi lines... map to the last bar at or before them). */
export const sourceIndex = (bars: readonly any[], data: readonly any[], index: number) => {
    if (data.length && bars[index] === data[index]) {
        return index;
    }
    const t = timeOf(data[index]);
    let lo = 0;
    let hi = bars.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (timeOf(bars[mid]) <= t) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    return lo;
};

export interface ChartCellProps {
    /** Index in the layout grid (0 = main chart, the one with the drawings). */
    readonly cell: number;
    readonly ratio?: number;
}

/** One chart of the layout: loads its data (bars or datafeed), applies replay / chart type / compare. */
export function ChartCell({ cell, ratio }: ChartCellProps) {
    const w = useWidget();
    const { state, datafeed } = w;
    const symbol = cell === 0 ? state.symbol : (state.cells?.[cell - 1] ?? state.symbol);
    const feed = useDatafeed(datafeed ?? DISABLED, {
        symbol,
        resolution: state.resolution,
        enabled: !!datafeed && !!symbol,
    });
    const bars = datafeed ? feed.data : (w.data ?? EMPTY);

    const { setSymbolInfo } = w;
    const info = feed.symbolInfo;
    React.useEffect(() => {
        setSymbolInfo(cell, {
            symbol,
            description: datafeed ? info?.description : undefined,
            exchange: datafeed ? info?.exchange : undefined,
        });
    }, [cell, symbol, datafeed, info, setSymbolInfo]);

    // ------------------------------------------------------------ bar replay
    const replayOn = w.replay && cell === w.activeCell;
    const replay = useBarReplay(bars);
    const [selecting, setSelecting] = React.useState(false);
    const { setStart, pause } = replay;
    React.useEffect(() => {
        if (replayOn && bars.length) {
            setStart(-Math.max(2, Math.floor(bars.length / 4)));
        } else if (!replayOn) {
            // leaving replay (exit button, another active chart) stops the playback timer
            pause();
        }
        setSelecting(false);
        // restart only when replay is switched on
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [replayOn, setStart, pause]);
    const source = replayOn ? replay.data : bars;

    // ------------------------------------------------------------ chart type + compare
    const type = state.chartType;
    const data = React.useMemo(() => chartData(type, source), [type, source]);
    const [compareBars, setCompareBars] = React.useState<Record<string, readonly Bar[]>>({});
    const onCompareData = React.useCallback(
        (s: string, b: readonly Bar[]) => setCompareBars((prev) => (prev[s] === b ? prev : { ...prev, [s]: b })),
        [],
    );
    const compareSymbols = React.useMemo(
        () => (datafeed && w.features.compare ? (state.compare ?? []).filter((s) => s !== symbol) : []),
        [datafeed, w.features.compare, state.compare, symbol],
    );
    const palette = w.chartTheme.palette;
    const compare = React.useMemo<CompareLine[]>(
        () =>
            chartTypeInfo(type).timeBased
                ? compareSymbols.map((s, k) => ({
                      symbol: s,
                      values: alignCloses(data, compareBars[s]),
                      // from the middle of the palette: the first colors go to the main series and indicators
                      color: palette[(k + 4) % palette.length],
                  }))
                : [],
        [type, compareSymbols, data, compareBars, palette],
    );

    const resolutionLabel = datafeed ? state.resolution : (inferResolution(bars) ?? state.resolution);
    const meta = w.symbolInfo(cell);
    const multi = (state.layout ?? "single") !== "single";
    return (
        <div
            className="rc-w-cell"
            data-active={multi && w.activeCell === cell ? "" : undefined}
            onPointerDownCapture={() => {
                if (w.activeCell !== cell) {
                    w.setActiveCell(cell);
                }
            }}
        >
            <PriceChart
                cell={cell}
                data={data}
                symbol={symbol}
                exchange={meta.exchange}
                description={meta.description}
                interval={intervalLabel(resolutionLabel)}
                precision={datafeed ? info?.pricePrecision : undefined}
                compare={compare}
                resetKey={`${symbol}|${state.resolution}|${dataFamily(type)}${replayOn ? "|replay" : ""}`}
                onReachStart={datafeed && !replayOn ? feed.loadMore : undefined}
                onBarClick={
                    replayOn && selecting
                        ? (index) => {
                              setStart(sourceIndex(bars, data, index));
                              setSelecting(false);
                          }
                        : undefined
                }
                ratio={ratio}
            />
            {datafeed &&
                compareSymbols.map((s) => (
                    <CompareFeed
                        key={s}
                        datafeed={datafeed}
                        symbol={s}
                        resolution={state.resolution}
                        onData={onCompareData}
                    />
                ))}
            {datafeed && !symbol && <div className="rc-w-status">Select a symbol</div>}
            {datafeed && symbol && feed.loading && (
                <div className="rc-w-status" role="status">
                    <Icon name="loading" className="rc-w-spin" size={20} />
                </div>
            )}
            {datafeed && !feed.loading && feed.error !== undefined && feed.data.length === 0 && (
                <div className="rc-w-status rc-w-error" role="alert">
                    Could not load {symbol}
                </div>
            )}
            {replayOn && <ReplayBar replay={replay} selecting={selecting} onSelect={() => setSelecting((v) => !v)} />}
        </div>
    );
}
