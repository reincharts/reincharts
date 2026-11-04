# @reincharts/series

Every chart type of [Reincharts](https://reincharts.com), canvas-rendered and built on one small `useSeries` hook:

- **Financial**: candlesticks (hollow, Heikin Ashi data), OHLC / HLC bars, line, step line, area, baseline, HLC area, columns, volume, volume candles, volume profile, renko, line break, kagi, point & figure.
- **General purpose**: lines (linear / step / monotone), areas and bands, stacked areas, bars (grouped / stacked / overlay), horizontal bars on category scales, scatter and bubble plots, error bars, reference lines.

Helpers: `stack()`, `drawMarker()` / `traceMarker()`, `tracePath()` / `traceArea()`, bar geometry (`barWidth`, `addColumn`, `groupLayout`...).

```bash
npm i @reincharts/core @reincharts/series @reincharts/axes
```

```tsx
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries, VolumeSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";

<ChartCanvas data={bars}>
  <Pane scales={{ volume: { margins: { top: 0.8, bottom: 0 } } }}>
    <VolumeSeries scale="volume" />
    <CandlestickSeries />
    <YAxis />
  </Pane>
  <XAxis />
</ChartCanvas>;
```

Documentation and live examples: https://reincharts.com
