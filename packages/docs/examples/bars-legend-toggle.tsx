"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { GroupedBarSeries, OverlayBarSeries, StackedBarSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Tooltip } from "@reincharts/tooltip";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const products = [
    { key: "starter", name: "Starter", color: "#93c5fd" },
    { key: "pro", name: "Pro", color: "#3b82f6" },
    { key: "team", name: "Team", color: "#1d4ed8" },
    { key: "enterprise", name: "Enterprise", color: "#f59e0b" },
] as const;
type Key = (typeof products)[number]["key"];

// stacked: on top of each other · grouped: side by side · overlay: over each other, largest at the back
const layouts = ["stacked", "grouped", "overlay"] as const;
const series = { stacked: StackedBarSeries, grouped: GroupedBarSeries, overlay: OverlayBarSeries };

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const data = months.map((month, i) => ({
    month,
    starter: 32 + ((i * 7) % 12),
    pro: 48 + i * 3 + ((i * 11) % 9),
    team: 22 + i * 2.5,
    enterprise: 12 + (i > 5 ? (i - 5) * 4 : 0),
}));

export default function BarsLegendToggle() {
    const theme = useDocsChartTheme();
    const [layout, setLayout] = useState<(typeof layouts)[number]>("stacked");
    const [hidden, setHidden] = useState<Set<Key>>(new Set());
    const visible = products.filter((p) => !hidden.has(p.key));
    const toggle = (key: Key) =>
        setHidden((h) => {
            const next = new Set(h);
            if (!next.delete(key)) {
                next.add(key);
            }
            return next.size === products.length ? h : next; // keep at least one series
        });
    const Series = series[layout];
    return (
        <WithToolbar
            toolbar={
                <>
                    <Segmented value={layout} options={layouts} onChange={setLayout} />
                    {/* a DOM legend: clicking a product removes it from the bars, which regroup / restack */}
                    <div className="flex flex-wrap gap-1.5">
                        {products.map((p) => (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => toggle(p.key)}
                                className={`inline-flex items-center gap-1.5 rounded-full border border-fd-border px-2 py-0.5 text-xs font-medium transition-opacity hover:bg-fd-accent ${
                                    hidden.has(p.key) ? "opacity-45" : ""
                                }`}
                            >
                                <span className="size-2 rounded-full" style={{ background: p.color }} />
                                {p.name}
                            </button>
                        ))}
                    </div>
                </>
            }
        >
            <ChartCanvas data={data} theme={theme} xAccessor={(d) => d.month} initialView="fit">
                <Pane>
                    <Grid vertical={false} />
                    <Series
                        name="Seats sold"
                        ys={visible.map((p) => p.key)}
                        names={visible.map((p) => p.name)}
                        colors={visible.map((p) => p.color)}
                        radius={layout === "stacked" ? 0 : 3}
                    />
                    <YAxis />
                    <Tooltip />
                </Pane>
                <XAxis />
                <Crosshair horizontal={false} />
            </ChartCanvas>
        </WithToolbar>
    );
}
