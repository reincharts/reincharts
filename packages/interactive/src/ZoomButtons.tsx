import { useChart, useChartState } from "@reincharts/core";
import * as React from "react";
import { icons } from "./icons";

export interface ZoomButtonsProps {
    /** Show only while the pointer is over the chart. Default true. */
    readonly autoHide?: boolean;
    /** Show the scroll left / right buttons. Default true. */
    readonly scroll?: boolean;
    /** Called after the reset button restored the initial view. */
    readonly onReset?: () => void;
    /** Pixel distance from the bottom of the lowest pane. Default 12. */
    readonly offset?: number;
    /** Extra CSS class. */
    readonly className?: string;
}

/** Zoom out / zoom in / scroll / reset buttons at the bottom of the chart. */
export function ZoomButtons({ autoHide = true, scroll = true, onReset, offset = 12, className }: ZoomButtonsProps) {
    const engine = useChart();
    const box = useChartState((s) => {
        const panes = s.layout.panes.filter((p) => p.height > 0);
        const last = panes[panes.length - 1];
        return last
            ? `${s.layout.plotLeft + s.layout.plotWidth / 2}:${last.top + last.height - offset}:${s.theme.name}`
            : "";
    });
    if (!box) {
        return null;
    }
    const [cx, bottom, theme] = box.split(":");
    const step = () => engine.barSpacing * 10;
    const buttons: { label: string; icon: React.ReactElement; run: () => void }[] = [
        { label: "Zoom Out", icon: icons.zoomOut, run: () => engine.zoomOut() },
        { label: "Zoom In", icon: icons.zoomIn, run: () => engine.zoomIn() },
        ...(scroll
            ? [
                  { label: "Scroll Left", icon: icons.left, run: () => engine.panBy(step()) },
                  { label: "Scroll Right", icon: icons.right, run: () => engine.panBy(-step()) },
              ]
            : []),
        {
            label: "Reset Chart",
            icon: icons.reset,
            run: () => {
                engine.resetView();
                onReset?.();
            },
        },
    ];
    return (
        <div
            className={`rc-zoom-buttons${autoHide ? " rc-autohide" : ""}${className ? ` ${className}` : ""}`}
            data-theme={theme === "dark" ? "dark" : "light"}
            style={{ left: Number(cx), top: Number(bottom) }}
        >
            {buttons.map((b) => (
                <button
                    key={b.label}
                    type="button"
                    title={b.label}
                    aria-label={b.label}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => {
                        b.run();
                        engine.settle();
                    }}
                >
                    {b.icon}
                </button>
            ))}
        </div>
    );
}
