import { ChartCanvas, Pane, type ChartEngine } from "@reincharts/core";
import { drawCalls, flushFrames, generateBars } from "@reincharts/testing";
import { act, render } from "@testing-library/react";
import * as React from "react";
import {
    AreaSeries,
    BarSeries,
    BaselineSeries,
    BubbleSeries,
    CandlestickSeries,
    ColumnsSeries,
    ErrorBarSeries,
    GroupedBarSeries,
    GroupedHorizontalBarSeries,
    HLCAreaSeries,
    HorizontalBarSeries,
    KagiSeries,
    LineBreakSeries,
    LineSeries,
    OHLCSeries,
    OverlayBarSeries,
    PointAndFigureSeries,
    RenkoSeries,
    ScatterSeries,
    StackedAreaSeries,
    StackedBarSeries,
    StackedHorizontalBarSeries,
    StraightLine,
    VolumeCandlesSeries,
    VolumeProfileSeries,
    VolumeSeries,
} from "../src";
import { kagiLines, lineBreakBoxes, pointAndFigure, renkoBricks } from "./fixtures";

const bars = generateBars(60);
const general = Array.from({ length: 6 }, (_, i) => ({ x: `c${i}`, a: i + 1, b: 10 - i, c: i % 2 ? -2 : 3, e: 0.5 }));
const points = [
    { x: 5, y: 1, r: 4 },
    { x: 1, y: 3, r: 1 },
    { x: 3, y: 2, r: 9 },
];

const mount = async (data: readonly any[], children: React.ReactNode, props: Record<string, unknown> = {}) => {
    const ref = React.createRef<ChartEngine>();
    const { container } = render(
        <ChartCanvas ref={ref} data={data} width={600} height={300} ratio={1} {...props}>
            <Pane id="p" scales={props.scales as any}>
                {children}
            </Pane>
        </ChartCanvas>,
    );
    await act(flushFrames);
    const engine = ref.current!;
    const scene = container.querySelectorAll("canvas")[0];
    return {
        engine,
        calls: drawCalls(scene),
        scale: (id = "right") => engine.getScale("p", id),
        legend: (i: number) => engine.legendItems("p", i),
    };
};

const drawsSomething = (calls: any[]) => calls.filter((c) => c.type === "fill" || c.type === "stroke").length;

describe("every series draws inside a chart", () => {
    const cases: [string, readonly any[], React.ReactNode, Record<string, unknown>?][] = [
        ["candles", bars, <CandlestickSeries key="s" />],
        ["hollow candles", bars, <CandlestickSeries key="s" hollow />],
        ["custom candles", bars, <CandlestickSeries key="s" fill={() => "#123456"} borderColor="#000000" />],
        ["volume candles", bars, <VolumeCandlesSeries key="s" mode="both" />],
        ["ohlc", bars, <OHLCSeries key="s" />],
        ["hlc", bars, <OHLCSeries key="s" hlc thickness={2} />],
        ["line", bars, <LineSeries key="s" points />],
        ["area", bars, <AreaSeries key="s" base={0} />],
        ["area band", bars, <AreaSeries key="s" y="high" y0="low" lineWidth={0} />],
        ["baseline", bars, <BaselineSeries key="s" base={100} />],
        ["hlc area", bars, <HLCAreaSeries key="s" />],
        ["bars", bars, <BarSeries key="s" y="volume" radius={2} stroke="#000" />],
        ["histogram", bars, <BarSeries key="s" y={(d) => d.close - d.open} />],
        ["volume", bars, <VolumeSeries key="s" scale="volume" />],
        ["columns", bars, <ColumnsSeries key="s" />],
        ["volume profile", bars, <VolumeProfileSeries key="s" sessionStart={(_d, i) => i % 20 === 0} />],
        ["renko", renkoBricks(), <RenkoSeries key="s" />],
        ["line break", lineBreakBoxes(), <LineBreakSeries key="s" />],
        ["kagi", kagiLines(), <KagiSeries key="s" />],
        ["point & figure", pointAndFigure(), <PointAndFigureSeries key="s" />],
        ["grouped bars", general, <GroupedBarSeries key="s" ys={["a", "b"]} />],
        ["stacked bars", general, <StackedBarSeries key="s" ys={["a", "b", "c"]} radius={2} />],
        ["overlay bars", general, <OverlayBarSeries key="s" ys={["a", "b"]} />],
        ["stacked area", general, <StackedAreaSeries key="s" ys={["a", "b"]} curve="monotone" />],
        ["scatter", points, <ScatterSeries key="s" y="y" marker="cross" />, { xMode: "linear" }],
        ["bubble", points, <BubbleSeries key="s" y="y" r="r" />, { xMode: "linear" }],
        ["error bars", general, <ErrorBarSeries key="s" y="a" error="e" />],
        [
            "horizontal bars",
            general,
            <HorizontalBarSeries key="s" x="a" />,
            { xMode: "linear", scales: { right: { categories: general.map((d) => d.x) } } },
        ],
        [
            "grouped horizontal",
            general,
            <GroupedHorizontalBarSeries key="s" ys={["a", "b"]} />,
            { xMode: "linear", scales: { right: { categories: general.map((d) => d.x) } } },
        ],
        [
            "stacked horizontal",
            general,
            <StackedHorizontalBarSeries key="s" ys={["a", "b"]} />,
            { xMode: "linear", scales: { right: { categories: general.map((d) => d.x) } } },
        ],
        [
            "straight lines",
            bars,
            [<StraightLine key="h" value={100} />, <StraightLine key="v" type="vertical" value={bars[30].date} />],
        ],
    ];

    it.each(cases)("%s", async (_name, data, children, props) => {
        const { calls } = await mount(data, children, props);
        expect(drawsSomething(calls)).toBeGreaterThan(0);
    });

    it("draws nothing when hidden", async () => {
        const { calls } = await mount(bars, <CandlestickSeries visible={false} />);
        expect(drawsSomething(calls)).toBe(0);
    });
});

describe("extents", () => {
    it("candles autoscale to the visible high / low", async () => {
        const { scale, engine } = await mount(bars, <CandlestickSeries />);
        const { start, end } = engine.range;
        const visible = bars.slice(start, end + 1);
        const hi = Math.max(...visible.map((b) => b.high));
        const lo = Math.min(...visible.map((b) => b.low));
        expect(scale().max).toBeGreaterThan(hi);
        expect(scale().min).toBeLessThan(lo);
        expect(scale().min).toBeGreaterThan(lo - (hi - lo));
    });

    it("bars include their base", async () => {
        const { scale } = await mount(bars, <BarSeries y="close" />);
        expect(scale().min).toBeLessThanOrEqual(0);
        const { scale: s2 } = await mount(bars, <BarSeries y="close" base={50} />);
        expect(s2().min).toBeLessThanOrEqual(50);
        expect(s2().min).toBeGreaterThan(0);
    });

    it("columns from the pane bottom do not include 0", async () => {
        const { scale } = await mount(bars, <ColumnsSeries />);
        expect(scale().min).toBeGreaterThan(50);
    });

    it("stacked bars include the stack totals and negative parts", async () => {
        const { scale } = await mount(general, <StackedBarSeries ys={["a", "b", "c"]} />, {
            scales: { right: { margins: { top: 0, bottom: 0 } } },
        });
        expect(scale().max).toBeCloseTo(14);
        expect(scale().min).toBeCloseTo(-2);
    });

    it("volume overlay uses its own scale with margins", async () => {
        const { scale } = await mount(bars, [<CandlestickSeries key="c" />, <VolumeSeries key="v" scale="volume" />], {
            scales: { volume: { margins: { top: 0.8, bottom: 0 } } },
        });
        expect(scale("volume").min).toBe(0);
        expect(scale("right").min).toBeGreaterThan(50);
        // the tallest volume bar reaches only the bottom 20% of the pane
        expect(scale("volume").toY(scale("volume").max * 0.2)).toBeGreaterThan(0.7 * scale("volume").height);
    });

    it("horizontal bars give an x extent and pick the hovered band", async () => {
        const { engine } = await mount(general, <HorizontalBarSeries x="b" />, {
            xMode: "linear",
            scales: { right: { categories: general.map((d) => d.x) } },
        });
        const r = engine.ordered().find((each) => each.xExtent)!;
        expect(r.xExtent!()).toEqual([0, 10]);
        expect(engine.from).toBeLessThan(0);
        expect(engine.to).toBeGreaterThan(10);
        const scale = engine.getScale("p");
        expect(r.indexAt!(0, scale.toY(2))).toBe(2);
        expect(r.indexAt!(0, scale.toY(4.4))).toBe(4);
        expect(r.indexAt!(0, -100)).toBeUndefined();
        expect(r.lastValue).toBeUndefined();
    });

    it("scatter picks the nearest point in 2D, also for unsorted data", async () => {
        const { engine } = await mount(points, <ScatterSeries y="y" hoverRadius={1000} />, { xMode: "linear" });
        const r = engine.ordered().find((each) => each.indexAt)!;
        const scale = engine.getScale("p");
        expect(r.indexAt!(engine.xOfLogical(1), scale.toY(3))).toBe(1);
        expect(r.indexAt!(engine.xOfLogical(4.9), scale.toY(1.1))).toBe(0);
        const { engine: e2 } = await mount(points, <ScatterSeries y="y" hoverRadius={2} />, { xMode: "linear" });
        expect(e2.ordered().find((each) => each.indexAt)!.indexAt!(-500, -500)).toBeUndefined();
    });

    it("straight lines stay out of autoscale unless asked", async () => {
        const { scale } = await mount(bars, [<CandlestickSeries key="c" />, <StraightLine key="l" value={500} />]);
        expect(scale().max).toBeLessThan(500);
        const { scale: s2 } = await mount(bars, [
            <CandlestickSeries key="c" />,
            <StraightLine key="l" value={500} autoscale />,
        ]);
        expect(s2().max).toBeGreaterThanOrEqual(500);
    });
});

describe("legends, snapping and last values", () => {
    it("candles show OHLC colored by direction", async () => {
        const { legend, engine } = await mount(bars, <CandlestickSeries name="TEST" format={(v) => v.toFixed(1)} />);
        const b = bars[10];
        const [item] = legend(10);
        expect(item.name).toBe("TEST");
        expect(item.values.map((v) => v.label)).toEqual(["O", "H", "L", "C"]);
        expect(item.values.map((v) => v.value)).toEqual([b.open, b.high, b.low, b.close].map((v) => v.toFixed(1)));
        expect(item.color).toBe(b.close >= b.open ? engine.theme.up : engine.theme.down);
        expect(engine.snap("p", 10, 0)).toBe(b.high);
    });

    it("multi-value series label each value with its color", async () => {
        const { legend, engine } = await mount(
            general,
            <StackedBarSeries ys={["a", "b"]} names={["A", "B"]} colors={["#111111"]} />,
        );
        const [item] = legend(2);
        expect(item.values.map((v) => [v.label, v.value, v.color])).toEqual([
            ["A", expect.any(String), "#111111"],
            ["B", expect.any(String), engine.theme.palette[1]],
        ]);
        expect(item.values[0].value).toContain("3");
    });

    it("hidden series are flagged in legends", async () => {
        const { legend, engine } = await mount(bars, <LineSeries name="L" />);
        engine.setHidden(legend(0)[0].id, true);
        expect(legend(0)[0].hidden).toBe(true);
    });

    it("reports last values and the percent base", async () => {
        const { engine } = await mount(bars, <LineSeries color="#abcdef" />);
        const r = engine.ordered()[0];
        expect(r.lastValue!()).toEqual({ value: bars.at(-1)!.close, color: "#abcdef" });
        expect(r.baseValue!(5)).toBe(bars[5].close);
    });

    it("horizontal bars format plain numbers", async () => {
        const { legend } = await mount(general, <HorizontalBarSeries x={(d) => d.a * 1000} />, {
            xMode: "linear",
            scales: { right: { categories: general.map((d) => d.x) } },
        });
        expect(legend(1)[0].values[0].value).toBe("2,000");
    });

    it("error bars show the value and the range", async () => {
        const { legend } = await mount(general, <ErrorBarSeries y="a" error="e" format={(v) => String(v)} />);
        expect(legend(0)[0].values.map((v) => v.value)).toEqual(["1", "0.5 – 1.5"]);
    });

    it("volume profile and straight lines have no legend", async () => {
        const { legend } = await mount(bars, [<VolumeProfileSeries key="v" />, <StraightLine key="l" value={1} />]);
        expect(legend(0)).toEqual([]);
    });
});
