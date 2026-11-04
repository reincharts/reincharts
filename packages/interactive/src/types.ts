import type { ChartEngine, LineDash, PriceScale, Theme } from "@reincharts/core";
import type * as React from "react";

/** A drawing anchor: data x value (timestamp / number) and raw price. Survives data reloads and zoom. */
export interface DrawingPoint {
    /** X value (timestamp in ms for time data, the x number otherwise). May lie beyond the last bar. */
    readonly time: number;
    /** Raw price on the drawing's scale. */
    readonly price: number;
}

/** A fibonacci / gann level. */
export interface DrawingLevel {
    /** Level ratio, e.g. 0.618. */
    readonly value: number;
    /** Line color (defaults to the drawing color). */
    readonly color?: string;
    /** Set false to hide the level. */
    readonly visible?: boolean;
}

/** Visual style of a drawing. Every field is optional; tools fill in their defaults. */
export interface DrawingStyle {
    /** Line / main color. Defaults to `theme.drawing.color`. */
    readonly color?: string;
    /** Line width in pixels. */
    readonly width?: number;
    /** Line dash. */
    readonly dash?: LineDash;
    /** Background fill color of shapes / channels (any CSS color, use alpha for transparency). */
    readonly fill?: string;
    /** Opacity of the per-level fills of multi-level tools (fib, gann). 0 disables them. */
    readonly fillOpacity?: number;
    /** Text of text-like tools, or an optional label on lines. */
    readonly text?: string;
    /** Font size of the text in pixels. */
    readonly fontSize?: number;
    /** Text color (defaults to the line color for text tools, theme text otherwise). */
    readonly textColor?: string;
    /** Bold text. */
    readonly bold?: boolean;
    /** Extend lines beyond their points. */
    readonly extend?: "none" | "left" | "right" | "both";
    /** Levels of fibonacci / gann tools. */
    readonly levels?: readonly DrawingLevel[];
    /** Show level / value labels (fib, measure...). Default true. */
    readonly showLabels?: boolean;
    /** Show the price label on the price axis (horizontal lines). Default true. */
    readonly axisLabel?: boolean;
    /** Standard deviations of the regression channel (default 2). */
    readonly deviation?: number;
    /** Quantity used for P&L of long / short positions (default 1). */
    readonly quantity?: number;
    /** Any extra tool specific setting. */
    readonly [key: string]: unknown;
}

/** One drawing on the chart. Plain JSON: store it, send it, load it. */
export interface Drawing {
    /** Unique id. */
    readonly id: string;
    /** Tool type, e.g. "trendLine". */
    readonly type: string;
    /** Pane id the drawing lives in. */
    readonly pane: string;
    /** Price scale id in the pane. Default "right". */
    readonly scale?: string;
    /** Anchor points. */
    readonly points: readonly DrawingPoint[];
    /** Style overrides. */
    readonly style: DrawingStyle;
    /** Locked drawings can be selected but not moved. */
    readonly locked?: boolean;
    /** Hidden drawings are not rendered. */
    readonly hidden?: boolean;
    /** Stacking order (higher draws on top). */
    readonly z?: number;
    /** Free form user data (order id, alert id...). */
    readonly meta?: unknown;
}

/** A point in pane plot pixels. */
export interface Pt {
    readonly x: number;
    readonly y: number;
}

/** The drawing converted to pixels plus helpers, handed to tool `draw` / `hitTest` / `handles`. */
export interface Geometry {
    /** Drawing points in pane plot pixels. */
    readonly points: readonly Pt[];
    /** Plot width / height of the pane. */
    readonly width: number;
    readonly height: number;
    readonly drawing: Drawing;
    readonly theme: Theme;
    readonly engine: ChartEngine;
    readonly scale: PriceScale;
    /** Pixel spacing between bars. */
    readonly barSpacing: number;
    /** Resolved line color. */
    readonly color: string;
    /** Data x value -> pixel x. */
    x(time: number): number;
    /** Raw price -> pixel y. */
    y(price: number): number;
    /** Pixel x -> data x value. */
    time(x: number): number;
    /** Pixel y -> raw price. */
    price(y: number): number;
    /** Data x value -> logical position (bar index in index mode). */
    logical(time: number): number;
    /** Formats a price like the price axis. */
    formatPrice(price: number): string;
    /** Formats a data x value like the crosshair label. */
    formatTime(time: number): string;
    /** Source value (close) of the bar at data index i. */
    value(index: number): number | undefined;
    /** Extends segment a→b to the pane borders ("right" extends past b). */
    extend(a: Pt, b: Pt, mode?: DrawingStyle["extend"]): readonly [Pt, Pt];
}

/** Render state of a drawing. */
export interface DrawState {
    readonly selected: boolean;
    readonly hovered: boolean;
    /** True while the drawing is being created. */
    readonly preview: boolean;
}

/** Result of a hit test: false = miss, "body" (or true) = the drawing, a number = handle index, "remove" = a close button. */
export type HitPart = boolean | "body" | "remove" | number;

/** A drawing tool. Use `defineTool` to create custom tools. */
export interface ToolDefinition {
    /** Unique type stored in `Drawing.type`. */
    readonly type: string;
    /** Human readable name (toolbar tooltip, object tree). */
    readonly label: string;
    /** Toolbar group, e.g. "lines", "fib", "shapes", "annotation", "measure" or a custom one. */
    readonly group: string;
    /** 18×18 inline SVG icon. */
    readonly icon: React.ReactElement;
    /** Number of points placed by the user, or "multi" for paths / freehand. */
    readonly points: number | "multi";
    /** Multi-point tool drawn by dragging (brush) instead of clicking each point (path). */
    readonly freehand?: boolean;
    /** Snap x to bars when placing points (default true). */
    readonly snapX?: boolean;
    /** Default style of new drawings. */
    readonly defaults?: DrawingStyle;
    /** Draws the drawing. ctx is translated to the pane plot origin and clipped to it. */
    draw(ctx: CanvasRenderingContext2D, g: Geometry, drawing: Drawing, state: DrawState): void;
    /** Hit test in pane plot pixels. Handles are tested before this (see `handles`). */
    hitTest(g: Geometry, x: number, y: number): HitPart;
    /** Pixel positions of the edit handles. Defaults to the points. */
    handles?(g: Geometry): readonly Pt[];
    /** New pixel points when handle `index` is dragged to `p`. Default: moves point `index`. */
    dragHandle?(g: Geometry, index: number, p: Pt): readonly Pt[];
    /** Price of the drawing at a logical x (for `onCross` alerts). */
    crossValue?(drawing: Drawing, logical: number, logicalOf: (time: number) => number): number | undefined;
    /** Opens the inline text editor after creation / on double click. */
    readonly editableText?: boolean;
    /** Where the inline text editor is placed (pixels). Defaults to the first point. */
    textAnchor?(g: Geometry): Pt;
    /** Style controls offered by the floating style toolbar. Default ["color", "width", "dash"]. */
    readonly styleControls?: readonly StyleControl[];
    /** Labels always shown on the axes (e.g. the price of a horizontal line). Selected drawings show all their points. */
    axisLabels?(drawing: Drawing): { readonly prices?: readonly number[]; readonly times?: readonly number[] };
    /** Converts the points placed by the user (pixels) into the stored points, e.g. adds a stop to a position. */
    build?(points: readonly Pt[]): readonly Pt[];
}

/** Controls of the floating style toolbar. */
export type StyleControl = "color" | "width" | "dash" | "fill" | "text" | "fontSize" | "extend";

/** Magnet mode used while placing points. */
export type MagnetMode = "off" | "weak" | "strong";

/** Pointer mode of the chart when no drawing tool is active. */
export type CursorMode = "cross" | "arrow" | "eraser";
