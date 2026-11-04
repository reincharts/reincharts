# @reincharts/coordinates

Crosshair (normal / magnet / hidden) with time and price labels, price lines, last value labels and hover dots for [Reincharts](https://reincharts.com).

```bash
npm i @reincharts/core @reincharts/coordinates
```

```tsx
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, LastValueLine, PriceLine } from "@reincharts/coordinates";

<ChartCanvas data={bars}>
  <Pane>
    <CandlestickSeries />
    <LastValueLine />
    <PriceLine price={180} title="Target" />
    <YAxis />
  </Pane>
  <XAxis />
  <Crosshair mode="magnet" />
</ChartCanvas>;
```

Docs: https://reincharts.com
