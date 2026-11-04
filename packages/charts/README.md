# reincharts

Interactive, canvas-rendered charts for React: line, area, bar and scatter charts plus financial charts, with pan, zoom, crosshair, tooltips, annotations and drawing tools. This package re-exports every Reincharts package.

```bash
npm i reincharts
```

```tsx
import { CandlestickSeries, ChartCanvas, Crosshair, Pane, XAxis, YAxis } from "reincharts";
import "reincharts/styles.css"; // only needed for drawing toolbars and <TradingChart>

<ChartCanvas data={bars} height={420}>
  <Pane>
    <CandlestickSeries />
    <YAxis />
    <Crosshair />
  </Pane>
  <XAxis />
</ChartCanvas>;
```

Documentation, live examples and API reference: https://reincharts.com
