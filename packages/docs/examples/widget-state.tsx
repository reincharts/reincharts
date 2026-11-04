"use client";
import { TradingChart, type TradingChartHandle, type TradingChartState } from "@reincharts/widget";
import { useRef, useState } from "react";
import { ToolbarButton, WithToolbar } from "@/components/preview/controls";
import { createDemoFeed } from "@/lib/demo-feed";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

const KEY = "reincharts-docs-layout";

export default function SaveAndLoadLayout() {
    const theme = useDocsChartTheme();
    const [feed] = useState(() => createDemoFeed());
    const chart = useRef<TradingChartHandle>(null);
    const [info, setInfo] = useState("Add indicators or drawings, then save");
    return (
        <WithToolbar
            toolbar={
                <>
                    <ToolbarButton
                        onClick={() => {
                            // the whole layout: symbol, interval, chart type, indicators, drawings, panes, range...
                            const state = chart.current!.save();
                            localStorage.setItem(KEY, JSON.stringify(state));
                            setInfo(
                                `Saved ${state.indicators.length} indicators and ${state.drawings.length} drawings`,
                            );
                        }}
                    >
                        Save layout
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => {
                            const json = localStorage.getItem(KEY);
                            if (json) {
                                chart.current!.load(json);
                                setInfo("Loaded the saved layout");
                            }
                        }}
                    >
                        Load layout
                    </ToolbarButton>
                    <ToolbarButton onClick={() => chart.current!.addIndicator("macd")}>Add MACD</ToolbarButton>
                    <span className="text-xs text-fd-muted-foreground">{info}</span>
                </>
            }
        >
            <TradingChart
                ref={chart}
                datafeed={feed}
                defaultSymbol="ACME"
                defaultResolution="60"
                defaultIndicators={["sma"]}
                onStateChange={(state: TradingChartState) =>
                    setInfo(`${state.indicators.length} indicators · ${state.drawings.length} drawings (unsaved)`)
                }
                theme={theme}
            />
        </WithToolbar>
    );
}
