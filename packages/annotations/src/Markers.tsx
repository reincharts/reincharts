import {
    accessor,
    clamp,
    font,
    functor,
    isFiniteNumber,
    useChart,
    useHitTarget,
    useRenderable,
    type Accessor,
    type DrawScope,
    type Functor,
    type Theme,
} from "@reincharts/core";
import * as React from "react";
import { indexOf, logicalOf, type DataX } from "./coords";
import { addShape, svgPath, type AnnotationShape } from "./shapes";

export type MarkerPosition = "above" | "below" | "inBar" | "atPrice";

/** One explicit marker placed by data x. */
export interface MarkerItem {
    /** x of the bar / point (Date, timestamp, number or category). */
    readonly x: DataX;
    /** Default: the `position` prop. */
    readonly position?: MarkerPosition;
    readonly shape?: AnnotationShape;
    /** Custom SVG path (drawn in a `pathSize` box) instead of `shape`. */
    readonly path?: string;
    readonly color?: string;
    readonly text?: string;
    readonly size?: number;
    /** Price for `position: "atPrice"`. */
    readonly price?: number;
    /** Any payload, passed back to `onClick`. */
    readonly id?: string | number;
}

/** A marker resolved to pixels (passed to `onClick`). */
export interface ResolvedMarker {
    /** Data index the marker belongs to (-1 when outside the data). */
    readonly index: number;
    /** Plot-relative center of the shape. */
    readonly x: number;
    readonly y: number;
    readonly size: number;
    readonly item?: MarkerItem;
}

export interface MarkersProps<T = any> {
    /** Explicit markers. Without it, markers are placed on the chart data selected by `when`. */
    readonly data?: readonly MarkerItem[];
    /** Selects chart data points that get a marker Without `data` or `when` nothing is drawn. */
    readonly when?: (d: T, index: number) => boolean;
    /** Where the marker sits relative to the bar. Default "above". */
    readonly position?: Functor<T, MarkerPosition>;
    /** Default: "arrowDown" above, "arrowUp" below, "circle" otherwise. */
    readonly shape?: Functor<T, AnnotationShape>;
    /** Custom SVG path string, drawn scaled from a `pathSize` box. */
    readonly path?: Functor<T, string | undefined>;
    /** Size of the SVG path's coordinate box. Default 24. */
    readonly pathSize?: number;
    /** Default: theme.down above, theme.up below, theme.line otherwise. */
    readonly color?: Functor<T, string>;
    /** Text drawn next to the shape. */
    readonly text?: Functor<T, string | undefined>;
    /** Text color. Defaults to the marker color. */
    readonly textColor?: string;
    /** Shape size in pixels. Default: follows bar spacing, between 10 and 16. */
    readonly size?: Functor<T, number>;
    /** Price for "atPrice". */
    readonly price?: Accessor<T, number | undefined>;
    /** Value markers "above" sit on. Default: `high`, then `close` / `y` / `value`. */
    readonly high?: Accessor<T, number | undefined>;
    /** Value markers "below" sit under. Default: `low`, then `close` / `y` / `value`. */
    readonly low?: Accessor<T, number | undefined>;
    /** Gap between the bar and the marker in pixels. Default 4. */
    readonly offset?: number;
    /** Price scale id. Default "right". */
    readonly scale?: string;
    /** Called when a marker is clicked. */
    readonly onClick?: (marker: ResolvedMarker) => void;
    readonly zIndex?: number;
}

const fallback = (d: any, key: string) => {
    const v = d?.[key] ?? d?.close ?? d?.y ?? d?.value;
    return typeof v === "number" ? v : undefined;
};

/** Series markers above / below / in bars or at a price: arrows, shapes, flags, custom paths and text. */
export function Markers<T = any>({
    data: items,
    when,
    position = "above",
    shape,
    path,
    pathSize = 24,
    color,
    text,
    textColor,
    size,
    price,
    high,
    low,
    offset = 4,
    scale,
    onClick,
    zIndex = 50,
}: MarkersProps<T>) {
    const engine = useChart<T>();
    const drawn = React.useRef<ResolvedMarker[]>([]);
    const positionOf = functor(position);
    const highOf = high ? accessor(high) : (d: T) => fallback(d, "high");
    const lowOf = low ? accessor(low) : (d: T) => fallback(d, "low");
    const priceOf = price ? accessor(price) : (d: T) => fallback(d, "price");

    const draw = (ctx: CanvasRenderingContext2D, scope: DrawScope<T>) => {
        const { data, start, end, theme, pane, barSpacing } = scope;
        const out: ResolvedMarker[] = [];
        if (!pane) {
            return;
        }
        const auto = clamp(Math.round(barSpacing), 10, 16);
        const fills = new Map<string, Path2D>();
        const texts: { text: string; x: number; y: number; color: string; below: boolean }[] = [];
        const stack = new Map<string, number>();
        const place = (index: number, px: number, d: T | undefined, o: Resolved) => {
            if (px < -o.size || px > pane.width + o.size) {
                return;
            }
            let anchor: number | undefined;
            if (o.position === "atPrice") {
                anchor = o.price;
            } else if (d !== undefined) {
                const hi = highOf(d, index);
                const lo = lowOf(d, index);
                anchor =
                    o.position === "above"
                        ? hi
                        : o.position === "below"
                          ? lo
                          : isFiniteNumber(hi) && isFiniteNumber(lo)
                            ? (hi + lo) / 2
                            : hi;
            }
            if (!isFiniteNumber(anchor)) {
                return;
            }
            const key = `${index}:${o.position}`;
            const used = stack.get(key) ?? 0;
            const ay = scope.y(anchor);
            let cy = ay;
            if (o.position === "above") {
                cy = ay - offset - used - o.size / 2;
            } else if (o.position === "below") {
                cy = ay + offset + used + o.size / 2;
            }
            const textH = o.text ? theme.fontSize + 3 : 0;
            stack.set(key, used + o.size + 2 + textH);
            if (o.path) {
                ctx.save();
                ctx.translate(px - o.size / 2, cy - o.size / 2);
                ctx.scale(o.size / pathSize, o.size / pathSize);
                ctx.fillStyle = o.color;
                ctx.fill(svgPath(o.path));
                ctx.restore();
            } else {
                let p = fills.get(o.color);
                if (!p) {
                    p = new Path2D();
                    fills.set(o.color, p);
                }
                addShape(p, o.shape, px, cy, o.size);
            }
            if (o.text) {
                const below = o.position === "below";
                texts.push({
                    text: o.text,
                    x: px,
                    y: below ? cy + o.size / 2 + 3 : cy - o.size / 2 - 3,
                    color: textColor ?? o.color,
                    below,
                });
            }
            out.push({ index, x: px, y: cy, size: o.size, item: o.item });
        };
        if (items) {
            const linear = engine.options.xMode === "linear";
            for (const item of items) {
                const l = logicalOf(engine, item.x);
                let index = indexOf(engine, item.x);
                if (index >= 0 && Math.abs(engine.xs[index] - l) > (linear ? engine.step / 2 : 0.5)) {
                    index = -1;
                }
                const d = index >= 0 ? data[index] : undefined;
                const pos = item.position ?? (d !== undefined ? positionOf(d, index) : "atPrice");
                place(index, index >= 0 && !linear ? scope.x(index) : engine.xOfLogical(l), d, {
                    position: pos,
                    shape: item.shape ?? defaultShape(pos),
                    path: item.path,
                    color:
                        item.color ?? (d !== undefined && color ? functor(color)(d, index) : defaultColor(theme, pos)),
                    text: item.text,
                    size: item.size ?? auto,
                    price: item.price,
                    item,
                });
            }
        } else if (when) {
            for (let i = start; i <= end; i++) {
                const d = data[i];
                if (d === undefined || !when(d, i)) {
                    continue;
                }
                const pos = positionOf(d, i);
                place(i, scope.x(i), d, {
                    position: pos,
                    shape: shape ? functor(shape)(d, i) : defaultShape(pos),
                    path: path ? functor(path)(d, i) : undefined,
                    color: color ? functor(color)(d, i) : defaultColor(theme, pos),
                    text: text ? functor(text)(d, i) : undefined,
                    size: size ? functor(size)(d, i) : auto,
                    price: priceOf(d, i),
                });
            }
        }
        for (const [c, p] of fills) {
            ctx.fillStyle = c;
            ctx.fill(p);
        }
        if (texts.length) {
            ctx.font = font(theme, theme.fontSize, "600");
            ctx.textAlign = "center";
            for (const t of texts) {
                ctx.fillStyle = t.color;
                ctx.textBaseline = t.below ? "top" : "bottom";
                ctx.fillText(t.text, t.x, t.y);
            }
        }
        drawn.current = out;
    };

    useRenderable<T>({ scale, zIndex, draw });

    const at = (x: number, y: number) =>
        drawn.current.find((m) => Math.abs(m.x - x) <= m.size / 2 + 2 && Math.abs(m.y - y) <= m.size / 2 + 2);
    useHitTarget(
        onClick
            ? {
                  zIndex,
                  hitTest: (x, y) => !!at(x, y),
                  onClick: (e) => {
                      const m = at(e.x, e.y);
                      if (m) {
                          onClick(m);
                      }
                  },
              }
            : null,
    );
    return null;
}

interface Resolved {
    readonly position: MarkerPosition;
    readonly shape: AnnotationShape;
    readonly path?: string;
    readonly color: string;
    readonly text?: string;
    readonly size: number;
    readonly price?: number;
    readonly item?: MarkerItem;
}

const defaultShape = (p: MarkerPosition): AnnotationShape =>
    p === "above" ? "arrowDown" : p === "below" ? "arrowUp" : "circle";

const defaultColor = (theme: Theme, p: MarkerPosition) =>
    p === "above" ? theme.down : p === "below" ? theme.up : theme.line;
