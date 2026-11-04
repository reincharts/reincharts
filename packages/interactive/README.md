# @reincharts/interactive

Drawing tools for [Reincharts](https://reincharts.com): ~30 tools (trend lines, rays, channels,
pitchfork, regression, fibonacci, gann, shapes, brush, text, callouts, long / short positions, measure, price lines),
selection and editing, magnet, undo / redo, copy / paste, JSON save / load, controlled state, price-cross alerts and a
custom tool API. Canvas rendering, plain-CSS toolbars, no dependencies.

```bash
npm i @reincharts/core @reincharts/interactive
```

```tsx
import { ChartCanvas } from "@reincharts/core";
import { CandlestickSeries } from "@reincharts/series";
import { Drawings, DrawingStyleToolbar, DrawingToolbar, useDrawings } from "@reincharts/interactive";
import "@reincharts/interactive/styles.css";

function App({ data }) {
  const drawings = useDrawings({ onChange: (all) => localStorage.setItem("drawings", JSON.stringify(all)) });
  return (
    <div style={{ display: "flex", height: 500 }}>
      <DrawingToolbar controller={drawings} />
      <ChartCanvas data={data}>
        <CandlestickSeries />
        <Drawings controller={drawings} />
        <DrawingStyleToolbar controller={drawings} />
      </ChartCanvas>
    </div>
  );
}
```

Custom tools: `defineTool({ type, label, group, icon, points, draw, hitTest })` and pass them to `useDrawings({ tools })`.

Documentation: https://reincharts.com
