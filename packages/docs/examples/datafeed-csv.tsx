"use client";
import { ChartCanvas, Pane } from "@reincharts/core";
import { AreaSeries } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair } from "@reincharts/coordinates";
import { Legend } from "@reincharts/tooltip";
import { parseCsv } from "@reincharts/datafeed";
import { useMemo } from "react";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

// any CSV / TSV export with a header row (Yahoo Finance, exchanges, spreadsheets...)
const csv = `Date,Open,High,Low,Adj Close,Volume
2026-03-02,182.1,184.6,180.9,183.9,51200000
2026-03-03,184.0,186.2,183.1,185.7,48700000
2026-03-04,185.5,185.9,181.2,182.0,62100000
2026-03-05,182.3,183.8,179.6,180.4,58900000
2026-03-06,180.9,184.4,180.2,184.1,47300000
2026-03-09,184.6,188.0,184.0,187.5,55800000
2026-03-10,187.9,189.3,186.1,188.6,44100000
2026-03-11,188.2,188.9,184.7,185.3,49900000
2026-03-12,185.0,187.7,183.9,187.2,41800000
2026-03-13,187.6,191.4,187.1,190.8,63300000
2026-03-16,191.0,192.2,189.5,190.1,39700000
2026-03-17,190.4,193.9,190.0,193.4,52600000`;

export default function CsvData() {
    const theme = useDocsChartTheme();
    // map the "Adj Close" column to close; dates without a zone are read as UTC
    const bars = useMemo(
        () => parseCsv(csv, { columns: { close: "Adj Close" } }).map((b) => ({ ...b, date: new Date(b.time) })),
        [],
    );
    return (
        <ChartCanvas data={bars} theme={theme} initialView="fit" timeZone="UTC">
            <Pane>
                <Grid />
                <AreaSeries name="Adj Close" curve="monotone" />
                <YAxis />
                <Legend />
            </Pane>
            <XAxis />
            <Crosshair />
        </ChartCanvas>
    );
}
