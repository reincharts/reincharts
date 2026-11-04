# @reincharts/core

The engine behind [Reincharts](https://reincharts.com): `<ChartCanvas>`, `<Pane>`, time and price scales, theming, interaction (pan, zoom, pinch, keyboard), and the single canvas render loop.

```bash
npm i @reincharts/core
```

```tsx
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";

<ChartCanvas data={bars} height={400}>
  <Pane>
    <CandlestickSeries />
    <YAxis />
  </Pane>
  <XAxis />
</ChartCanvas>;
```

Most apps should install the umbrella package [`reincharts`](https://www.npmjs.com/package/reincharts). Documentation: https://reincharts.com
