# @reincharts/tooltip

Legends and tooltips for [Reincharts](https://reincharts.com): a pane legend (values at the crosshair, click to hide series, per-item actions) and a floating recharts-style tooltip (shared or nearest point). Plain DOM with inline theme styles — no CSS import needed.

```bash
npm i @reincharts/core @reincharts/tooltip
```

```tsx
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries, LineSeries } from "@reincharts/series";
import { Legend, Tooltip } from "@reincharts/tooltip";

<ChartCanvas data={bars}>
  <Pane>
    <CandlestickSeries name="AAPL" />
    <LineSeries name="SMA 20" y={(d) => d.sma20} />
    <Legend title="AAPL · 1D" />
    <Tooltip />
  </Pane>
</ChartCanvas>;
```

Docs: https://reincharts.com
