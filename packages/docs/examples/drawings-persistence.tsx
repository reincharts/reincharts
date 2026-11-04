"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { type Drawing, Drawings, DrawingStyleToolbar, DrawingToolbar, useDrawings } from "@reincharts/interactive";
import { useState } from "react";
import { ToolbarButton, WithToolbar } from "@/components/preview/controls";
import { weather, type WeatherDay } from "@/lib/data-general";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const KEY = "reincharts-docs-drawings";
const read = (): Drawing[] => {
    try {
        return JSON.parse(localStorage.getItem(KEY) ?? "{}").drawings ?? [];
    } catch {
        return [];
    }
};

export default function SaveAndLoad() {
    const theme = useDocsChartTheme();
    // controlled mode: the drawings live in React state (or your store / server)
    const [saved, setSaved] = useState<Drawing[]>(read);
    const [current, setCurrent] = useState<readonly Drawing[]>(saved);
    const drawings = useDrawings({ drawings: current, onChange: setCurrent });
    return (
        <WithToolbar
            toolbar={
                <>
                    <ToolbarButton
                        onClick={() => {
                            localStorage.setItem(KEY, JSON.stringify(drawings.toJSON()));
                            setSaved([...current]);
                        }}
                    >
                        Save
                    </ToolbarButton>
                    <ToolbarButton onClick={() => drawings.load(saved)}>Load saved</ToolbarButton>
                    <ToolbarButton onClick={() => drawings.undo()}>Undo</ToolbarButton>
                    <ToolbarButton onClick={() => drawings.redo()}>Redo</ToolbarButton>
                    <ToolbarButton onClick={() => drawings.removeAll()}>Clear</ToolbarButton>
                    <span className="text-xs text-fd-muted-foreground">
                        {current.length} drawings · {saved.length} saved
                    </span>
                </>
            }
        >
            <div className="flex size-full">
                <DrawingToolbar
                    controller={drawings}
                    tools={[
                        "trendLine",
                        "horizontalLine",
                        "brush",
                        "highlighter",
                        "rectangle",
                        "text",
                        "callout",
                        "dateRange",
                    ]}
                />
                <div className="min-w-0 flex-1">
                    <ChartCanvas data={weather} theme={theme} barSpacing={3}>
                        <Pane id="main">
                            <Grid />
                            <LineSeries<WeatherDay> name="Mean temperature" y="temp" curve="monotone" />
                            <YAxis tickFormat={(t) => `${t.label}°`} />
                        </Pane>
                        <XAxis />
                        <Crosshair />
                        <Drawings controller={drawings} />
                        <DrawingStyleToolbar controller={drawings} />
                    </ChartCanvas>
                </div>
            </div>
        </WithToolbar>
    );
}
