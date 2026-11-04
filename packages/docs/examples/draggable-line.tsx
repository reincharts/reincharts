"use client";
import { ChartCanvas, Pane, useChart, useHitTarget, usePaneId, useRenderable } from "@reincharts/core";
import { BarSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { useState } from "react";
import { WithToolbar } from "@/components/preview/controls";
import { traffic, type TrafficDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

/** A horizontal line users can drag: useRenderable draws it, useHitTarget makes it hoverable and draggable. */
function DraggableGoal({ value, onChange }: { value: number; onChange: (value: number) => void }) {
    const engine = useChart();
    const pane = usePaneId();
    const [active, setActive] = useState(false);
    const color = "#10b981";
    useRenderable({
        zIndex: 10,
        draw(ctx, { y, pane: layout, theme }) {
            const py = Math.round(y(value)) + 0.5;
            const width = layout?.width ?? 0;
            ctx.strokeStyle = color;
            ctx.lineWidth = active ? 2 : 1;
            ctx.setLineDash(active ? [] : [6, 4]);
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(width, py);
            ctx.stroke();
            ctx.setLineDash([]);
            const text = `Goal ${Math.round(value)} · drag me`;
            ctx.font = `600 12px ${theme.fontFamily}`;
            const w = ctx.measureText(text).width + 12;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(8, py - 20, w, 18, 4);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.fillText(text, 14, py - 7);
        },
    });
    useHitTarget({
        // plot-relative coordinates: hit within 5px of the line, with a resize cursor
        hitTest: (_x, y) => Math.abs(y - engine.getScale(pane).toY(value)) <= 5 && "ns-resize",
        onHover: setActive,
        // e.price() converts the pointer position to a value on the pane's scale
        onDrag: (e) => onChange(Math.max(0, e.price())),
    });
    return null;
}

export default function DraggableLine() {
    const theme = useDocsChartTheme();
    const [goal, setGoal] = useState(110);
    const recent = traffic.slice(-90);
    const hit = recent.filter((d) => d.signups >= goal).length;
    return (
        <WithToolbar
            toolbar={
                <span className="text-xs text-fd-muted-foreground">
                    Goal <b className="text-fd-foreground tabular-nums">{Math.round(goal)}</b> sign-ups a day: reached
                    on <b className="text-fd-foreground tabular-nums">{hit}</b> of the last 90 days
                </span>
            }
        >
            <ChartCanvas data={traffic} theme={theme} barSpacing={8}>
                <Pane>
                    <Grid />
                    <BarSeries<TrafficDay>
                        name="Sign-ups"
                        y="signups"
                        fill={(d) => (d.signups >= goal ? "#10b981" : "rgba(161, 161, 170, 0.55)")}
                    />
                    <DraggableGoal value={goal} onChange={setGoal} />
                    <YAxis />
                </Pane>
                <XAxis />
                <Crosshair />
            </ChartCanvas>
        </WithToolbar>
    );
}
