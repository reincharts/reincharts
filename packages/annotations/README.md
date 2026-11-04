# @reincharts/annotations

Canvas annotations for [Reincharts](https://reincharts.com): series markers (arrows, shapes, flags, custom SVG paths, text), labels, a symbol watermark and reference lines / areas / dots for general charts.

```bash
npm i @reincharts/core @reincharts/annotations
```

```tsx
import { ChartCanvas } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Markers, ReferenceArea, ReferenceLine, Watermark } from "@reincharts/annotations";

<ChartCanvas data={bars}>
  <Watermark text="AAPL" subtitle="1D · NASDAQ" />
  <CandlestickSeries />
  <Markers when={(d) => d.signal === "buy"} position="below" text="Buy" />
  <ReferenceLine y={150} label="Support" />
  <ReferenceArea x1={new Date("2024-03-01")} x2={new Date("2024-03-15")} label="Earnings window" />
</ChartCanvas>;
```

Docs: https://reincharts.com
