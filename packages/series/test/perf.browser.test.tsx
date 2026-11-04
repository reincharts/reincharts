import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane, type ChartEngine } from "@reincharts/core";
import { mountChart } from "@reincharts/testing/browser";
import * as React from "react";
import { AreaSeries, BarSeries, CandlestickSeries, LineSeries, OHLCSeries, VolumeSeries } from "../src";

function generate(count: number) {
    let seed = 17;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const out = new Array<any>(count);
    let walk = 0;
    for (let i = 0; i < count; i++) {
        walk += (rand() - 0.5) * 2.4;
        const v = 200 + walk + Math.sin((i / 1440) * Math.PI * 2) * 18;
        out[i] = {
            time: new Date(Date.UTC(2026, 0, 1) + i * 60_000),
            value: v,
            baseline: 200 + walk * 0.98,
            open: v,
            high: v + 1,
            low: v - 1,
            close: v + 0.5,
        };
    }
    return out;
}

const measure = (engine: ChartEngine, frames = 30) => {
    const t: number[] = [];
    for (let i = 0; i < frames; i++) {
        const s = performance.now();
        engine.panBy(i % 2 ? 7 : -7);
        engine.render();
        t.push(performance.now() - s);
    }
    t.sort((a, b) => a - b);
    return { median: +t[t.length >> 1].toFixed(2), p90: +t[Math.floor(t.length * 0.9)].toFixed(2) };
};

// Large datasets must stay smooth: with many bars per pixel, series aggregate per pixel column (and per
// pre-aggregated block), so a frame costs about the same at 200k points as at 50k.
for (const n of [50_000, 200_000]) {
    it(`pans ${n} points within one 60fps frame budget for every series type`, async () => {
        const data = generate(n);
        const results: Record<string, unknown> = {};
        for (const kind of ["line", "candles", "area", "bars", "volume", "ohlc"] as const) {
            const ref = React.createRef<ChartEngine>();
            const { unmount } = await mountChart(
                <ChartCanvas
                    ref={ref}
                    data={data}
                    xMode={kind === "line" ? "linear" : "index"}
                    initialView="fit"
                    ratio={2}
                    xAccessor={(d: any) => d.time}
                >
                    <Pane>
                        <Grid />
                        {kind === "area" ? (
                            <AreaSeries y="value" />
                        ) : kind === "bars" ? (
                            <BarSeries y="value" />
                        ) : kind === "volume" ? (
                            <VolumeSeries y="value" />
                        ) : kind === "ohlc" ? (
                            <OHLCSeries />
                        ) : kind === "line" ? (
                            <>
                                <LineSeries y="baseline" width={1} />
                                <LineSeries y="value" width={1.25} />
                            </>
                        ) : (
                            <CandlestickSeries />
                        )}
                        <YAxis />
                    </Pane>
                    <XAxis />
                </ChartCanvas>,
                { width: 900, height: 460 },
            );
            results[kind] = measure(ref.current!);
            unmount();
        }
        for (const [kind, r] of Object.entries(results) as [string, { median: number }][]) {
            expect(r.median, `${kind} median frame time (ms) at ${n} points`).toBeLessThan(16);
        }
    });
}
