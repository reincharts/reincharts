import { ChartCanvas, Pane, type ChartEngine } from "@reincharts/core";
import { drawCalls, flushFrames, generateBars } from "@reincharts/testing";
import { act, render } from "@testing-library/react";
import * as React from "react";
import {
    ATR,
    BollingerBands,
    ElderRay,
    ForceIndex,
    Indicator,
    indicators,
    MACD,
    MovingAverage,
    RSI,
    rsi,
    SAR,
    Stochastic,
    bollinger,
    ema,
} from "../src";

const data = generateBars(200, { seed: 9 });

const mount = async (ui: React.ReactNode) => {
    const ref = React.createRef<ChartEngine>();
    const result = render(
        <ChartCanvas ref={ref} data={data} width={800} height={500} ratio={1}>
            {ui}
        </ChartCanvas>,
    );
    await act(flushFrames);
    const scene = result.container.querySelectorAll("canvas")[0] as HTMLCanvasElement;
    return { ...result, engine: ref.current!, scene };
};

const last = data.length - 1;

describe("<Indicator>", () => {
    it("draws an oscillator with levels and band fill, registers a TradingView style legend", async () => {
        const { engine, scene } = await mount(
            <Pane id="rsi">
                <Indicator definition={indicators.rsi} />
            </Pane>,
        );
        const items = engine.legendItems("rsi", last);
        expect(items).toHaveLength(1);
        expect(items[0].name).toBe("RSI 14 close");
        expect(items[0].values).toEqual([{ value: rsi(data)[last]!.toFixed(2), color: "#7e57c2" }]);
        expect(engine.legendItems("rsi", 3)[0].values[0].value).toBe("∅");
        const calls = drawCalls(scene);
        expect(calls.some((c) => c.type === "stroke")).toBe(true);
        expect(calls.filter((c) => c.type === "fillRect").length).toBeGreaterThan(0);
        // autoscale includes the 30 / 70 levels (and the 30..70 band), not the whole 0..100 domain
        const r = engine.ordered().find((x) => x.pane === "rsi")!;
        const [min, max] = r.extent!(0, last)!;
        const values = rsi(data).filter((v) => v !== undefined) as number[];
        expect(min).toBeCloseTo(Math.min(30, ...values));
        expect(max).toBeCloseTo(Math.max(70, ...values));
    });

    it("fitDomain includes the definition domain in autoscale", async () => {
        const { engine } = await mount(
            <Pane id="rsi">
                <Indicator definition={indicators.rsi} fitDomain showLevels={false} />
            </Pane>,
        );
        const r = engine.ordered().find((x) => x.pane === "rsi")!;
        expect(r.extent!(0, last)).toEqual([0, 100]);
    });

    it("memoizes calculate on data + inputs", async () => {
        const calculate = vi.fn(indicators.sma.calculate);
        const def = { ...indicators.sma, calculate };
        const { rerender, engine } = await mount(<Indicator definition={def} inputs={{ period: 5 }} />);
        const calls = calculate.mock.calls.length;
        expect(calls).toBe(1);
        engine.legendItems("main", 10);
        engine.legendItems("main", 20);
        rerender(
            <ChartCanvas data={data} width={800} height={500} ratio={1}>
                <Indicator definition={def} inputs={{ period: 5 }} />
            </ChartCanvas>,
        );
        await act(flushFrames);
        expect(calculate.mock.calls.length).toBe(1);
        rerender(
            <ChartCanvas data={data} width={800} height={500} ratio={1}>
                <Indicator definition={def} inputs={{ period: 6 }} />
            </ChartCanvas>,
        );
        await act(flushFrames);
        expect(calculate.mock.calls.length).toBe(2);
    });

    it("overlay extents, styles, names and visibility", async () => {
        const { engine } = await mount(
            <>
                <Indicator definition={indicators.bollinger} styles={{ middle: { color: "#000000" } }} />
                <Indicator definition={indicators.ema} inputs={{ period: 21 }} name="Fast" id="fast" />
            </>,
        );
        const items = engine.legendItems("main", last);
        expect(items.map((i) => i.name)).toEqual(["BB 20 close 2", "Fast"]);
        const bb = bollinger(data);
        expect(items[0].values.map((v) => v.color)).toEqual(["#000000", "#2962ff", "#2962ff"]);
        expect(items[0].values[1].value).toBe(engine.getScale("main").format(bb.upper[last]!));
        // palette color for colorless outputs (BB has fixed colors, so the EMA takes the first palette slot)
        expect(items[1].color).toBe(engine.theme.palette[0]);
        const renderable = engine.ordered().find((r) => r.legend?.(last)?.name === "BB 20 close 2")!;
        const [min, max] = renderable.extent!(100, last)!;
        const lows = bb.lower.slice(100);
        expect(min).toBeCloseTo(Math.min(...(lows as number[])));
        expect(max).toBeCloseTo(Math.max(...(bb.upper.slice(100) as number[])));
        expect(renderable.snapValues!(last)).toHaveLength(3);
        const emaRenderable = engine.ordered().find((r) => r.legend?.(last)?.id === "fast")!;
        expect(emaRenderable.lastValue!()).toEqual({
            value: ema(data, { period: 21 })[last],
            color: engine.theme.palette[0],
        });
        engine.setHidden("fast", true);
        expect(emaRenderable.visible).toBe(false);
    });

    it("hides outputs via styles and draws histograms per color", async () => {
        const { engine, scene } = await mount(
            <Pane id="macd">
                <Indicator definition={indicators.macd} styles={{ signal: { visible: false } }} />
            </Pane>,
        );
        const item = engine.legendItems("macd", last)[0];
        expect(item.name).toBe("MACD 12 26 close 9");
        expect(item.values).toHaveLength(2);
        const hist = item.values[0].color;
        expect(["#26a69a", "#b2dfdb", "#ffcdd2", "#ff5252"]).toContain(hist);
        const fills = drawCalls(scene).filter((c) => c.type === "fill");
        expect(fills.length).toBeGreaterThanOrEqual(2);
        // histogram extent includes zero
        const r = engine.ordered().find((x) => x.pane === "macd")!;
        const [min, max] = r.extent!(50, last)!;
        expect(min).toBeLessThanOrEqual(0);
        expect(max).toBeGreaterThanOrEqual(0);
    });

    it("draws Ichimoku spans shifted into the future", async () => {
        const { engine } = await mount(<Indicator definition={indicators.ichimoku} />);
        const item = engine.legendItems("main", last)[0];
        // span A plotted at `last` was computed 25 bars earlier
        const spanA = indicators.ichimoku.calculate(data, {
            conversion: 9,
            base: 26,
            spanB: 52,
            displacement: 26,
        }).spanA;
        expect(item.values[3].value).toBe(engine.getScale("main").format(spanA[last - 25]!));
        // lagging span shows the close 25 bars ahead
        expect(item.values[2].value).toBe("∅");
        expect(engine.legendItems("main", last - 30)[0].values[2].value).toBe(
            engine.getScale("main").format(data[last - 5].close),
        );
        // the cloud extends 25 bars beyond the data in autoscale / drawing
        const r = engine.ordered().find((x) => x.legend)!;
        expect(r.extent!(last + 20, last + 20)).toBeDefined();
    });

    it("convenience components render their definitions", async () => {
        const { engine } = await mount(
            <>
                <MovingAverage type="ema" period={20} color="#ff0000" />
                <MovingAverage period={50} />
                <BollingerBands multiplier={2.5} />
                <SAR color="#123456" />
                <Pane id="a">
                    <RSI period={7} />
                </Pane>
                <Pane id="b">
                    <MACD fast={8} />
                </Pane>
                <Pane id="c">
                    <Stochastic variant="slow" />
                </Pane>
                <Pane id="d">
                    <ATR />
                    <ElderRay />
                    <ForceIndex period={2} />
                </Pane>
            </>,
        );
        expect(engine.legendItems("main", last).map((i) => i.name)).toEqual([
            "EMA 20 close",
            "MA 50 close",
            "BB 20 close 2.5",
            "SAR 0.02 0.02 0.2",
        ]);
        expect(engine.legendItems("main", last)[0].color).toBe("#ff0000");
        expect(engine.legendItems("main", last)[3].color).toBe("#123456");
        expect(engine.legendItems("a", last)[0].name).toBe("RSI 7 close");
        expect(engine.legendItems("b", last)[0].name).toBe("MACD 8 26 close 9");
        expect(engine.legendItems("c", last)[0].name).toBe("Stoch 14 3 3");
        expect(engine.legendItems("d", last).map((i) => i.name)).toEqual(["ATR 14", "ER 13 close", "EFI 2 close"]);
    });

    it("renders with empty data", async () => {
        const { container } = render(
            <ChartCanvas data={[]} width={300} height={200} ratio={1}>
                <Indicator definition={indicators.ichimoku} />
                <RSI />
            </ChartCanvas>,
        );
        await act(flushFrames);
        expect(container.querySelector("canvas")).toBeTruthy();
    });
});
