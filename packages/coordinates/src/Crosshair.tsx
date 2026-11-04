import {
    applyStroke,
    clamp,
    drawLabel,
    font,
    horizontalLine,
    useChart,
    useRenderable,
    verticalLine,
    type ChartEngine,
    type CrosshairState,
    type LineDash,
} from "@reincharts/core";
import * as React from "react";
import { axesOf, axisBand, drawAxisLabel } from "./labels";

export type CrosshairMode = "normal" | "magnet" | "hidden";

export interface CrosshairProps {
    /**
     * "normal": lines follow the pointer (x snaps to bars in index mode), "magnet": the horizontal line
     * snaps to the closest series value of the hovered bar (e.g. OHLC), "hidden": nothing is drawn. Default "normal".
     */
    readonly mode?: CrosshairMode;
    /** Line color. Defaults to theme.crosshair.color. */
    readonly color?: string;
    /** Line width. Defaults to theme.crosshair.width. */
    readonly width?: number;
    /** Line dash. Defaults to theme.crosshair.dash. */
    readonly dash?: LineDash;
    /** Draw the vertical line (across all panes). Default true. */
    readonly vertical?: boolean;
    /** Draw the horizontal line (hovered pane only). Default true. */
    readonly horizontal?: boolean;
    /** Show the x / time label on the time axis. Default true. */
    readonly xLabel?: boolean;
    /** Show the value label on each price axis of the hovered pane. Default true. */
    readonly yLabel?: boolean;
    /** Snap x to the hovered data point. Default true in index mode, false in linear mode. */
    readonly snapX?: boolean;
    /** Price scale used by the magnet. Default: the first price axis scale of the pane, else "right". */
    readonly scale?: string;
    /** Label background. Defaults to theme.crosshair.labelBackground. */
    readonly labelBackground?: string;
    /** Label text color. Defaults to theme.crosshair.labelText. */
    readonly labelColor?: string;
    /** Custom x label (receives the hovered data index and the logical x). */
    readonly formatX?: (index: number, logical: number) => string;
    /** Custom value label (receives the raw value, the scale id and the pane id). */
    readonly formatY?: (value: number, scaleId: string, paneId: string) => string;
}

/** Resolved crosshair position in whole-canvas coordinates. */
export interface CrosshairPoint {
    /** Canvas x of the vertical line. */
    readonly x: number;
    /** Canvas y of the horizontal line (NaN when there is none, e.g. synced crosshair). */
    readonly y: number;
    /** Text for the x label. */
    readonly label: string;
}

/**
 * Computes where the crosshair lines go: snapped to the bar center in index mode
 * (including empty future slots for time data), free in linear mode, magnet-snapped vertically.
 */
export const crosshairPoint = (
    engine: ChartEngine,
    c: CrosshairState,
    { mode = "normal", snapX, scale, formatX }: Pick<CrosshairProps, "mode" | "snapX" | "scale" | "formatX"> = {},
): CrosshairPoint => {
    const { layout } = engine;
    const n = engine.data.length;
    const linear = engine.options.xMode === "linear";
    let px = c.x;
    let label: string;
    if (c.synced) {
        label = engine.formatX(c.index, c.logical);
    } else if (!(snapX ?? !linear) || c.index < 0) {
        label = formatX ? formatX(c.index, c.logical) : engine.formatX(c.index, linear ? c.logical : undefined);
    } else if (!linear && engine.xType === "time" && (c.logical < -0.5 || c.logical > n - 0.5)) {
        // empty slots left / right of the data (show the extrapolated time)
        const slot = Math.round(c.logical);
        px = engine.xOfLogical(slot);
        label = formatX ? formatX(-1, slot) : engine.time.format(engine.timeOfLogical(slot), engine.intraday);
    } else {
        px = engine.xOfIndex(c.index);
        label = formatX ? formatX(c.index, c.logical) : engine.formatX(c.index);
    }
    let y = NaN;
    const pane = c.paneId ? layout.panes.find((p) => p.id === c.paneId) : undefined;
    if (pane && !c.synced) {
        y = c.y;
        if (mode === "magnet" && c.index >= 0) {
            const scaleId = scale ?? axesOf(engine, pane.id)[0]?.scale ?? "right";
            const v = engine.snap(pane.id, c.index, c.y, scaleId);
            if (v !== undefined) {
                const yy = engine.getScale(pane.id, scaleId).toY(v);
                if (Number.isFinite(yy)) {
                    y = clamp(yy, 0, pane.height);
                }
            }
        }
        y += pane.top;
    }
    return { x: layout.plotLeft + px, y, label };
};

/**
 * Crosshair: dashed lines across all panes at the hovered bar and in the hovered pane
 * at the pointer (or the magnet value), with labels on the time axis and on every price axis of the pane.
 * A crosshair driven by a synced chart shows only the vertical line.
 */
export function Crosshair({
    mode = "normal",
    color,
    width,
    dash,
    vertical = true,
    horizontal = true,
    xLabel = true,
    yLabel = true,
    snapX,
    scale,
    labelBackground,
    labelColor,
    formatX,
    formatY,
}: CrosshairProps) {
    const engine = useChart();
    React.useLayoutEffect(() => {
        if (mode !== "hidden") {
            return;
        }
        const prev = engine.toolCursor;
        engine.toolCursor = "default";
        return () => {
            if (engine.toolCursor === "default") {
                engine.toolCursor = prev;
            }
        };
    }, [engine, mode]);
    useRenderable({
        pane: null,
        layer: "top",
        zIndex: 1000,
        visible: mode !== "hidden",
        draw(ctx, { crosshair: c, layout, theme }) {
            if (!c || layout.plotWidth <= 0) {
                return;
            }
            const t = theme.crosshair;
            const p = crosshairPoint(engine, c, { mode, snapX, scale, formatX });
            const bottom = layout.timeAxis?.top ?? layout.height;
            const plotLeft = layout.plotLeft;
            const plotRight = plotLeft + layout.plotWidth;
            const inX = p.x >= plotLeft - 0.5 && p.x <= plotRight + 0.5;
            applyStroke(ctx, { color: color ?? t.color, width: width ?? t.width, dash: dash ?? t.dash });
            if (vertical && inX) {
                verticalLine(ctx, p.x, 0, bottom);
            }
            const pane = c.paneId ? layout.panes.find((each) => each.id === c.paneId) : undefined;
            const hasY = !c.synced && pane && Number.isFinite(p.y);
            if (horizontal && hasY) {
                horizontalLine(ctx, p.y, plotLeft, plotRight);
            }
            if (c.synced) {
                return;
            }
            ctx.setLineDash([]);
            const bg = labelBackground ?? t.labelBackground;
            const fg = labelColor ?? t.labelText;
            const band = layout.timeAxis;
            if (xLabel && band && inX && p.label) {
                ctx.font = font(theme);
                const w = ctx.measureText(p.label).width + 18;
                const cx = clamp(p.x, w / 2, layout.width - w / 2);
                drawLabel(ctx, {
                    text: p.label,
                    x: cx,
                    y: band.top + 2,
                    align: "center",
                    baseline: "top",
                    background: bg,
                    color: fg,
                    font: font(theme),
                    paddingX: 9,
                    paddingY: 5,
                });
            }
            if (yLabel && hasY && pane) {
                for (const axis of axesOf(engine, pane.id)) {
                    const side = axis.side ?? "right";
                    const scaleId = axis.scale ?? "right";
                    const s = engine.getScale(pane.id, scaleId);
                    const value = s.fromY(p.y - pane.top);
                    const text = formatY ? formatY(value, scaleId, pane.id) : s.format(value);
                    drawAxisLabel(ctx, {
                        ...axisBand(layout, side, plotLeft),
                        y: p.y,
                        min: pane.top,
                        max: pane.top + pane.height,
                        side,
                        text,
                        background: bg,
                        color: fg,
                        theme,
                    });
                }
            }
        },
    });
    return null;
}
