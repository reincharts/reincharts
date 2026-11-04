# @reincharts/indicators

Technical indicators for [Reincharts](https://reincharts.com):

- **Pure calculators**: fast, single-pass functions such as `sma`, `ema`, `rsi`, `macd`, `bollinger`, `ichimoku`, `vwap`, `supertrend`, `dmi` and about 40 more. Each one returns arrays aligned 1:1 with your data, with `undefined` during warm-up.
- **Bar transforms**: `heikinAshi`, `renko`, `kagi`, `pointAndFigure` and `lineBreak` return new bars that you can use as chart data.
- **Indicator definitions**: a registry (`indicators.rsi`, `indicators.macd`, ...) that describes inputs, outputs, levels and fills. Use `defineIndicator` to add your own.
- **`<Indicator>`** renders any definition (lines, histograms, areas, dots, levels, band fills) with autoscale, legend and magnet support. It also comes as convenience components: `MovingAverage`, `BollingerBands`, `MACD`, `RSI`, `Stochastic`, `ATR`, `ElderRay`, `ForceIndex` and `SAR`.

```bash
npm i @reincharts/core @reincharts/series @reincharts/indicators
```

```tsx
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { BollingerBands, Indicator, indicators, MovingAverage, RSI, rsi } from "@reincharts/indicators";

<ChartCanvas data={bars}>
  <Pane id="price" size={3}>
    <CandlestickSeries />
    <MovingAverage type="ema" period={21} />
    <BollingerBands />
  </Pane>
  <Pane id="rsi">
    <RSI />
  </Pane>
  <Pane id="macd">
    <Indicator definition={indicators.macd} inputs={{ fast: 8 }} />
  </Pane>
</ChartCanvas>;

const values = rsi(bars, { period: 14, source: "close" }); // (number | undefined)[]
```

Docs: https://reincharts.com
