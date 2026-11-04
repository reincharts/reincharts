import { XAxis, YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane, formatPrice, type ChartEngine } from "@reincharts/core";
import { CandlestickSeries, LineSeries } from "@reincharts/series";
import { drawCalls, flushFrames, generateBars } from "@reincharts/testing";
import { act, render } from "@testing-library/react";
import * as React from "react";
import {
    Crosshair,
    CurrentCoordinate,
    EdgeIndicator,
    LastValueLabel,
    LastValueLine,
    PriceLine,
    crosshairPoint,
    lastValues,
} from "../src";

const data = generateBars(100);

const pointer = (type: string, x: number, y: number) => {
    const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, button: 0 });
    Object.assign(e, { pointerId: 1, pointerType: "mouse" });
    return e;
};

const mount = async (ui: React.ReactNode, props: Record<string, unknown> = {}) => {
    const ref = React.createRef<ChartEngine>();
    const utils = render(
        <ChartCanvas ref={ref} data={data} width={600} height={300} ratio={1} timeZone="UTC" {...props}>
            {ui}
        </ChartCanvas>,
    );
    await act(flushFrames);
    const [scene, top] = Array.from(utils.container.querySelectorAll("canvas"));
    const texts = (canvas: HTMLCanvasElement) =>
        drawCalls(canvas)
            .filter((c) => c.type === "fillText")
            .map((c) => c.props.text as string);
    const clear = () => {
        (scene.getContext("2d") as any).__clearDrawCalls();
        (top.getContext("2d") as any).__clearDrawCalls();
    };
    const hover = async (x: number, y: number) => {
        clear();
        await act(async () => {
            top.dispatchEvent(pointer("pointermove", x, y));
            await flushFrames();
        });
    };
    return { engine: ref.current!, scene, top, texts, clear, hover, ...utils };
};

const chart = (extra: React.ReactNode = null) => (
    <>
        <Pane id="price" size={3}>
            <CandlestickSeries name="TEST" />
            <YAxis />
            {extra}
        </Pane>
        <Pane id="volume">
            <LineSeries y="volume" />
            <YAxis />
        </Pane>
        <XAxis />
    </>
);

describe("Crosshair", () => {
    it("draws lines and labels on the time axis and on the hovered pane's price axis", async () => {
        const { engine, top, texts, hover } = await mount(chart(<Crosshair />));
        await hover(200, 100);
        const c = engine.crosshair!;
        expect(c.paneId).toBe("price");
        const labels = texts(top);
        expect(labels).toContain(engine.formatX(c.index));
        expect(labels).toContain(engine.getScale("price").format(engine.getScale("price").fromY(100)));
        expect(labels).toHaveLength(2);
        expect(drawCalls(top).filter((d) => d.type === "stroke").length).toBe(2);
    });

    it("snaps x to the bar center and y to the closest OHLC value in magnet mode", async () => {
        const { engine, hover } = await mount(chart(<Crosshair mode="magnet" />));
        await hover(203, 100);
        const c = engine.crosshair!;
        const p = crosshairPoint(engine, c, { mode: "magnet" });
        expect(p.x).toBeCloseTo(engine.layout.plotLeft + engine.xOfIndex(c.index));
        const scale = engine.getScale("price");
        const d = data[c.index];
        const ys = [d.open, d.high, d.low, d.close].map((v) => scale.toY(v));
        const best = ys.reduce((a, b) => (Math.abs(b - 100) < Math.abs(a - 100) ? b : a));
        expect(p.y).toBeCloseTo(best);
        expect(crosshairPoint(engine, c).y).toBe(100);
    });

    it("shows only the vertical line for a synced crosshair", async () => {
        const { engine, top, texts, clear } = await mount(chart(<Crosshair />));
        clear();
        await act(async () => {
            engine.setCrosshair({ x: 100, y: -1, paneId: null, index: 50, logical: 50, synced: true });
            await flushFrames();
        });
        expect(texts(top)).toHaveLength(0);
        expect(drawCalls(top).filter((d) => d.type === "stroke")).toHaveLength(1);
    });

    it("extrapolates time labels in the empty area right of the data", async () => {
        const { engine, hover } = await mount(chart(<Crosshair />));
        const right = engine.layout.plotWidth - 2;
        await hover(right, 50);
        const p = crosshairPoint(engine, engine.crosshair!);
        expect(engine.crosshair!.logical).toBeGreaterThan(99.5);
        expect(p.label).not.toBe(engine.formatX(99));
    });

    it("uses free x and custom formatters in linear mode", async () => {
        const points = Array.from({ length: 50 }, (_, i) => ({ x: i * 2, y: Math.sin(i / 5) }));
        const { engine, top, texts, hover } = await mount(
            <>
                <LineSeries y="y" />
                <YAxis />
                <XAxis />
                <Crosshair formatX={(_i, l) => `x=${l.toFixed(1)}`} formatY={(v) => `y=${v.toFixed(1)}`} />
            </>,
            { data: points, xMode: "linear", xAccessor: (d: any) => d.x },
        );
        await hover(123, 80);
        const p = crosshairPoint(engine, engine.crosshair!);
        expect(p.x).toBe(engine.layout.plotLeft + 123);
        expect(texts(top).some((t) => t.startsWith("x="))).toBe(true);
        expect(texts(top).some((t) => t.startsWith("y="))).toBe(true);
    });

    it("hidden mode draws nothing and switches the cursor to default while mounted", async () => {
        const { engine, top, hover, rerender } = await mount(chart(<Crosshair mode="hidden" />));
        await hover(200, 100);
        expect(drawCalls(top).filter((d) => d.type === "stroke")).toHaveLength(0);
        expect(engine.toolCursor).toBe("default");
        rerender(
            <ChartCanvas data={data} width={600} height={300} ratio={1} timeZone="UTC">
                {chart()}
            </ChartCanvas>,
        );
        expect(engine.toolCursor).toBeNull();
    });

    it("can draw only the time label (no lines, no price labels)", async () => {
        const { top, texts, hover } = await mount(
            chart(<Crosshair vertical={false} horizontal={false} yLabel={false} />),
        );
        await hover(200, 100);
        expect(texts(top)).toHaveLength(1);
        expect(drawCalls(top).filter((d) => d.type === "stroke")).toHaveLength(0);
    });
});

describe("price lines", () => {
    it("lastValues collects every visible series of a pane", async () => {
        const { engine } = await mount(chart());
        const values = lastValues(engine, "price");
        expect(values).toHaveLength(1);
        expect(values[0].value).toBe(data[99].close);
        expect(values[0].name).toBe("TEST");
        expect(lastValues(engine, "volume")[0].value).toBe(data[99].volume);
    });

    it("LastValueLabel labels the last value on the price axis with the series color", async () => {
        const { engine, scene, texts } = await mount(chart(<LastValueLine />));
        const label = engine.getScale("price").format(data[99].close);
        expect(texts(scene)).toContain(label);
        const fills = drawCalls(scene).filter((d) => d.type === "fill");
        expect(fills.length).toBeGreaterThan(0);
    });

    it("LastValueLabel filter and format", async () => {
        const { scene, texts } = await mount(
            chart(<LastValueLabel filter={(e) => e.name === "nope"} format={(v) => `LV ${v}`} />),
        );
        expect(texts(scene).some((t) => t.startsWith("LV"))).toBe(false);
    });

    it("PriceLine draws a line, axis label and title", async () => {
        const { scene, texts } = await mount(chart(<PriceLine price={100} title="Entry" format={(v) => `P${v}`} />));
        expect(texts(scene)).toEqual(expect.arrayContaining(["P100", "Entry"]));
    });

    it("EdgeIndicator labels the first visible value", async () => {
        const { engine, scene, texts } = await mount(
            chart(<EdgeIndicator y="close" item="first" format={(v) => formatPrice(v)} />),
        );
        expect(texts(scene)).toContain(formatPrice(data[engine.range.start].close));
    });

    it("pushes overlapping last value labels apart", async () => {
        const { scene } = await mount(
            chart(
                <>
                    <LineSeries y="close" />
                    <LineSeries y={(d) => d.close + 0.01} />
                    <LastValueLabel format={(_v, e) => (e.name === "TEST" ? "C" : "L")} />
                </>,
            ),
        );
        const calls = drawCalls(scene).filter((d) => d.type === "fillText" && ["C", "L"].includes(d.props.text));
        const ys = calls.slice(-3).map((c) => c.props.y);
        expect(ys).toHaveLength(3);
        const sorted = [...ys].sort((a, b) => a - b);
        expect(sorted[1] - sorted[0]).toBeGreaterThanOrEqual(20);
        expect(sorted[2] - sorted[1]).toBeGreaterThanOrEqual(20);
    });
});

describe("CurrentCoordinate", () => {
    it("draws a dot at the hovered bar", async () => {
        const { top, hover, clear } = await mount(chart(<CurrentCoordinate y="close" />));
        clear();
        expect(drawCalls(top).filter((d) => d.type === "fill")).toHaveLength(0);
        await hover(200, 100);
        expect(drawCalls(top).filter((d) => d.type === "fill")).toHaveLength(2);
    });
});
