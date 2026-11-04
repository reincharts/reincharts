# @reincharts/axes

Time / x axis, price / value axes and grid lines for [Reincharts](https://reincharts.com). Axes size themselves to their labels. Drag an axis to zoom and double-click it to reset.

```bash
npm i @reincharts/axes
```

```tsx
import { Grid, XAxis, YAxis } from "@reincharts/axes";

<ChartCanvas data={data}>
  <Pane>
    <Grid />
    <LineSeries y="value" />
    <YAxis />
  </Pane>
  <XAxis />
</ChartCanvas>;
```

Documentation: https://reincharts.com/docs/components/axes
