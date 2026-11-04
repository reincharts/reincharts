import { useChart, useChartEvent, useRenderable, withAlpha, type ChartPointerEvent } from "@reincharts/core";
import * as React from "react";

/** Range selected with `<Brush>`. */
export interface BrushRange {
    /** Pane the brush was drawn in. */
    readonly paneId: string;
    /** X values (timestamps / numbers) of the left and right edges. */
    readonly from: number;
    readonly to: number;
    /** First / last data index inside the range. */
    readonly startIndex: number;
    readonly endIndex: number;
    /** Price range (low, high) of the rectangle. */
    readonly priceFrom: number;
    readonly priceTo: number;
}

export interface BrushProps {
    /** Capture drags (default true). Toggle it to switch between panning and brushing. */
    readonly enabled?: boolean;
    /** "x" selects a time range over the full pane height, "xy" a rectangle. Default "x". */
    readonly mode?: "x" | "xy";
    /** Zoom to the selected x range on release. Default true. */
    readonly zoom?: boolean;
    /** Called with the selected range on release. */
    readonly onSelect?: (range: BrushRange) => void;
    /** Border color. Defaults to the theme drawing color. */
    readonly color?: string;
    /** Fill color. Defaults to the border color at 12% opacity. */
    readonly fill?: string;
}

/** Drag a rectangle to zoom into / report a range. */
export function Brush({ enabled = true, mode = "x", zoom = true, onSelect, color, fill }: BrushProps) {
    const engine = useChart();
    const rect = React.useRef<{ paneId: string; x0: number; y0: number; x1: number; y1: number } | null>(null);

    const local = (e: ChartPointerEvent, paneId: string) => {
        const pane = engine.layout.panes.find((p) => p.id === paneId);
        return { x: e.x, y: e.canvasY - (pane?.top ?? 0) };
    };

    useChartEvent(
        "pointerdown",
        enabled
            ? (e) => {
                  if (e.defaultPrevented || !e.paneId) {
                      return;
                  }
                  e.preventDefault();
                  rect.current = { paneId: e.paneId, x0: e.x, y0: e.y, x1: e.x, y1: e.y };
              }
            : undefined,
    );
    useChartEvent(
        "drag",
        enabled
            ? (e) => {
                  const r = rect.current;
                  if (r) {
                      const p = local(e, r.paneId);
                      r.x1 = p.x;
                      r.y1 = p.y;
                      engine.invalidate("top");
                  }
              }
            : undefined,
    );
    useChartEvent(
        "dragend",
        enabled
            ? () => {
                  const r = rect.current;
                  rect.current = null;
                  engine.invalidate("top");
                  if (!r || Math.abs(r.x1 - r.x0) < 3) {
                      return;
                  }
                  const scale = engine.getScale(r.paneId);
                  const l0 = engine.logicalOfX(Math.min(r.x0, r.x1));
                  const l1 = engine.logicalOfX(Math.max(r.x0, r.x1));
                  const [a, b] = [l0, l1].sort((p, q) => p - q);
                  const range: BrushRange = {
                      paneId: r.paneId,
                      from: engine.timeOfLogical(a),
                      to: engine.timeOfLogical(b),
                      startIndex: Math.max(0, engine.indexOfX(engine.xOfLogical(a))),
                      endIndex: engine.indexOfX(engine.xOfLogical(b)),
                      priceFrom: scale.fromY(Math.max(r.y0, r.y1)),
                      priceTo: scale.fromY(Math.min(r.y0, r.y1)),
                  };
                  if (zoom) {
                      engine.setLogicalRange(a, b);
                  }
                  onSelect?.(range);
              }
            : undefined,
    );
    useChartEvent(
        "click",
        enabled
            ? () => {
                  rect.current = null;
              }
            : undefined,
    );

    useRenderable({
        pane: null,
        layer: "top",
        zIndex: 60,
        visible: enabled,
        draw(ctx, { theme, layout }) {
            const r = rect.current;
            const pane = r && layout.panes.find((p) => p.id === r.paneId);
            if (!r || !pane) {
                return;
            }
            const stroke = color ?? theme.drawing.color;
            const left = layout.plotLeft + Math.min(r.x0, r.x1);
            const w = Math.abs(r.x1 - r.x0);
            const top = pane.top + (mode === "xy" ? Math.min(r.y0, r.y1) : 0);
            const h = mode === "xy" ? Math.abs(r.y1 - r.y0) : pane.height;
            ctx.fillStyle = fill ?? withAlpha(stroke, 0.12);
            ctx.fillRect(left, top, w, h);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(Math.round(left) + 0.5, Math.round(top) + 0.5, Math.round(w), Math.round(h) - 1);
        },
    });
    return null;
}
