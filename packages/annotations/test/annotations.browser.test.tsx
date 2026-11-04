import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane } from "@reincharts/core";
import { CandlestickSeries, LineSeries } from "@reincharts/series";
import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import { page } from "vitest/browser";
import { Label, Markers, ReferenceArea, ReferenceDot, ReferenceLine, Watermark } from "../src";

const bars = generateBars(90, { seed: 5 });

const sma = (i: number, n: number) => {
    if (i < n - 1) {
        return undefined;
    }
    let s = 0;
    for (let k = i - n + 1; k <= i; k++) {
        s += bars[k].close;
    }
    return s / n;
};

// crossovers of the close and its 10-bar average
const cross = (i: number, dir: 1 | -1) => {
    const a = sma(i, 20);
    const b = sma(i - 1, 20);
    return a !== undefined && b !== undefined && (bars[i].close - a) * dir > 0 && (bars[i - 1].close - b) * dir <= 0;
};

// alternate buy / sell signals at least 6 bars apart so the chart stays readable
const signals = new Map<number, 1 | -1>();
for (let i = 1, last = -99, prev = 0; i < bars.length; i++) {
    const dir = cross(i, 1) ? 1 : cross(i, -1) ? -1 : 0;
    if (dir && dir !== prev && i - last >= 6) {
        signals.set(i, dir);
        last = i;
        prev = dir;
    }
}

const FLAG = "M4 2h2v20H4z M6 3h13l-3 5 3 5H6z";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const temps = months.map((month, i) => ({ month, value: 8 + 14 * Math.sin(((i - 3) / 12) * Math.PI * 2) + (i % 3) }));

describe("annotations (visual)", () => {
    for (const theme of ["light", "dark"] as const) {
        it(`markers, watermark and labels on candles (${theme})`, async () => {
            const { host, unmount } = await mountChart(
                <ChartCanvas data={bars} theme={theme} ratio={1} timeZone="UTC" barSpacing={7}>
                    <Pane id="price">
                        <Watermark text="TEST" subtitle="1D · Reincharts Exchange" />
                        <Grid />
                        <CandlestickSeries name="TEST" />
                        <LineSeries y={(_d, i) => sma(i, 20)} color="#ff9800" width={1.5} />
                        <Markers when={(_d, i) => signals.get(i) === 1} position="below" text="Buy" />
                        <Markers when={(_d, i) => signals.get(i) === -1} position="above" text="Sell" />
                        <Markers
                            data={[
                                {
                                    x: bars[52].date,
                                    position: "inBar",
                                    shape: "circle",
                                    color: "#9c27b0",
                                },
                                {
                                    x: bars[62].date,
                                    position: "atPrice",
                                    price: bars[62].low,
                                    shape: "diamond",
                                    color: "#2962ff",
                                },
                                { x: bars[75].date, position: "above", path: FLAG, color: "#ff6d00", size: 16 },
                            ]}
                        />
                        <ReferenceLine y={bars[10].close} label="Prior close" color="#787b86" />
                        <Label
                            text="Breakout zone"
                            x={bars[45].date}
                            y={bars[45].high}
                            dy={-28}
                            align="center"
                            background="#2962ff"
                            color="#ffffff"
                        />
                        <YAxis />
                    </Pane>
                    <XAxis />
                </ChartCanvas>,
            );
            await expect.element(page.elementLocator(host)).toMatchScreenshot(`markers-${theme}`);
            unmount();
        });
    }

    it("reference area, lines and dot on a general chart", async () => {
        const peak = temps.reduce((best, d, i) => (d.value > temps[best].value ? i : best), 0);
        const { host, unmount } = await mountChart(
            <ChartCanvas data={temps} xAccessor={(d) => d.month} ratio={1}>
                <Pane id="main" scales={{ right: { domain: [-10, 32] } }}>
                    <Grid />
                    <ReferenceArea y1={15} y2={25} color="#4caf50" label="Comfort zone" labelAlign="right" />
                    <ReferenceArea x1="Jun" x2="Aug" color="#ff9800" opacity={0.1} label="Summer" />
                    <ReferenceLine y={0} label="Freezing" color="#2962ff" labelPosition="start" />
                    <ReferenceLine x="Oct" label="Season change" color="#9c27b0" dash="dotted" labelPosition="start" />
                    <LineSeries y="value" color="#e91e63" width={2} points curve="monotone" />
                    <ReferenceDot
                        x={temps[peak].month}
                        y={temps[peak].value}
                        color="#e91e63"
                        label={`Peak ${temps[peak].value.toFixed(1)}°`}
                    />
                    <Label text="Avg. temperature (°C)" x={8} y={-14} units="pixel" fontWeight="600" />
                    <YAxis />
                </Pane>
                <XAxis />
            </ChartCanvas>,
        );
        await expect.element(page.elementLocator(host)).toMatchScreenshot("reference");
        unmount();
    });
});
