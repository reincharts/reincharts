# @reincharts/widget

`<TradingChart>`: a batteries-included stock chart built on [Reincharts](https://reincharts.com). If you know
TradingView's charting library, this covers the same ground for free, including multi-chart layouts with sync and bar replay.

- Top toolbar: symbol search, favorite intervals, chart types (candles, hollow, bars, Heikin Ashi, line, step,
  area, baseline, columns, HLC area, renko, kagi, point & figure, line break), indicators dialog, compare symbols,
  layouts, replay, undo / redo, settings, theme, fullscreen, snapshot.
- Drawing toolbar and ~30 drawing tools (`@reincharts/interactive`), legends with hide / settings / remove buttons,
  indicator settings dialogs, context menu, object tree, range presets, % / log / auto scale toggles.
- Data mode (`data`) or datafeed mode (`datafeed`, see `@reincharts/datafeed`). Controlled or uncontrolled,
  with a serializable `TradingChartState` (`ref.save()` / `ref.load()`).

```bash
npm i @reincharts/widget
```

```tsx
import { TradingChart } from "@reincharts/widget";
import { createRandomDatafeed } from "@reincharts/datafeed";
import "@reincharts/widget/styles.css"; // also pulls in @reincharts/interactive/styles.css

const feed = createRandomDatafeed({ symbols: ["DEMO", "TEST"] });

<div style={{ height: 600 }}>
  <TradingChart datafeed={feed} defaultSymbol="DEMO" defaultIndicators={["ema", "rsi"]} theme="dark" />
</div>;

// or with your own bars
<TradingChart data={bars} symbol="AAPL" height={500} />;
```

Theme the UI with `--rc-*` CSS custom properties on `.rc-widget` (`--rc-bg`, `--rc-panel`, `--rc-border`,
`--rc-text`, `--rc-muted`, `--rc-accent`, `--rc-hover`, `--rc-radius`, `--rc-font`...).

Documentation: https://reincharts.com
