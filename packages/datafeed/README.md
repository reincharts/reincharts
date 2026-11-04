# @reincharts/datafeed

A small datafeed adapter for [Reincharts](https://reincharts.com): plug in your backend once and get
history loading, realtime updates, infinite scroll back in time, symbol search, bar aggregation, ticks → seconds bars,
compare-symbol alignment, bar replay and demo feeds that work in the browser without a server.

```bash
npm i @reincharts/datafeed @reincharts/core @reincharts/series @reincharts/axes
```

```tsx
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { useDatafeed, type Datafeed } from "@reincharts/datafeed";

// Your adapter: only getBars is required.
const feed: Datafeed = {
  getBars: async ({ symbol, resolution, to, countBack, signal }) => {
    const res = await fetch(`/api/bars?symbol=${symbol}&resolution=${resolution}&to=${to}&count=${countBack}`, {
      signal,
    });
    const bars = await res.json(); // [{ time: ms, open, high, low, close, volume }]
    return { bars, noData: bars.length === 0 };
  },
  subscribeBars: (symbol, resolution, onBar) => {
    const ws = new WebSocket(`wss://example.com/${symbol}/${resolution}`);
    ws.onmessage = (e) => onBar(JSON.parse(e.data));
    return () => ws.close();
  },
};

// …or a deterministic demo feed: createRandomDatafeed({ symbols: ["DEMO"], seed: 1 })

export function Chart({ symbol = "AAPL", resolution = "1D" }) {
  const { data, loadMore } = useDatafeed(feed, { symbol, resolution });
  return (
    <ChartCanvas data={data} onReachStart={loadMore} resetKey={symbol + resolution}>
      <Pane>
        <CandlestickSeries />
        <YAxis />
      </Pane>
      <XAxis />
    </ChartCanvas>
  );
}
```

Also included: `aggregateBars`, `ticksToBars`, `mergeBar`, `alignSeries`, `parseCsv`, `createMemoryDatafeed`,
`useBarReplay` and resolution helpers. Documentation: https://reincharts.com
