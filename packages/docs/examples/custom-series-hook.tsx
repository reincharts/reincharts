"use client";
import { accessor, ChartCanvas, Pane, type Accessor } from "@reincharts/core";
import { drawMarker, useSeries, type SeriesProps } from "@reincharts/series";
import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { Crosshair, LastValueLabel } from "@reincharts/coordinates";
import { Legend, Tooltip } from "@reincharts/tooltip";
import { useDocsChartTheme } from "@/lib/use-docs-theme";

interface LollipopSeriesProps<T> extends SeriesProps {
    readonly y: Accessor<T, number | undefined>;
    readonly color?: string;
}

/**
 * A lollipop series in a few lines: useSeries wires autoscale, the legend and tooltip values, the magnet,
 * the last-value label and percent mode; you only write `values` and `draw`.
 */
function LollipopSeries<T>({ y, color = "#ec4899", ...props }: LollipopSeriesProps<T>) {
    const value = accessor(y);
    useSeries<T>({
        ...props,
        color,
        values: value,
        extentIncludes: [0], // stems start at 0
        draw(ctx, { data, start, end, x, y: toY, theme }) {
            const zero = toY(0);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = start; i <= end; i++) {
                const v = value(data[i], i);
                if (v !== undefined) {
                    ctx.moveTo(Math.round(x(i)) + 0.5, zero);
                    ctx.lineTo(Math.round(x(i)) + 0.5, toY(v));
                }
            }
            ctx.stroke();
            for (let i = start; i <= end; i++) {
                const v = value(data[i], i);
                if (v !== undefined) {
                    drawMarker(ctx, "circle", x(i), toY(v), 9, {
                        fill: color,
                        stroke: theme.background,
                        strokeWidth: 1.5,
                    });
                }
            }
        },
    });
    return null;
}

const data = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, i) => ({
    month,
    nps: Math.round(32 + 14 * Math.sin(i / 2.2) + i * 1.5),
}));
type Row = (typeof data)[number];

export default function CustomSeriesHook() {
    const theme = useDocsChartTheme();
    return (
        <ChartCanvas data={data} theme={theme} xAccessor={(d) => d.month} initialView="fit">
            <Pane scales={{ right: { precision: 0 } }}>
                <Grid vertical={false} />
                <LollipopSeries<Row> name="NPS" y="nps" />
                <LastValueLabel />
                <YAxis />
                <Legend />
                <Tooltip />
            </Pane>
            <XAxis />
            <Crosshair horizontal={false} />
        </ChartCanvas>
    );
}
