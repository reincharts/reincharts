"use client";
import { ChartCanvas } from "@reincharts/core";
import { LineSeries } from "@reincharts/series";
import { XAxis, YAxis } from "@reincharts/axes";
import { useState } from "react";
import { Segmented, WithToolbar } from "@/components/preview/controls";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// hourly readings during business hours only (9:00-17:00, Monday to Friday): nights and weekends are missing
const readings: { date: Date; value: number }[] = [];
for (let day = 0; day < 14; day++) {
    const date = new Date(Date.UTC(2026, 0, 5 + day));
    if (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
        continue;
    }
    for (let hour = 9; hour <= 17; hour++) {
        const i = readings.length;
        readings.push({
            date: new Date(date.getTime() + hour * 3_600_000),
            value: 50 + day * 0.8 + 6 * Math.sin(i / 3),
        });
    }
}

export default function XModes() {
    const theme = useDocsChartTheme();
    const [mode, setMode] = useState<"index" | "linear">("index");
    return (
        <WithToolbar
            toolbar={<Segmented label="xMode" value={mode} options={["index", "linear"] as const} onChange={setMode} />}
        >
            {/* resetKey: switching xMode changes what the x values mean, so start from a fresh view */}
            <ChartCanvas data={readings} theme={theme} xMode={mode} initialView="fit" resetKey={mode}>
                <LineSeries y="value" points />
                <YAxis />
                <XAxis />
            </ChartCanvas>
        </WithToolbar>
    );
}
