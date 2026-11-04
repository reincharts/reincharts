import { YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane, type ChartEngine } from "@reincharts/core";
import { CandlestickSeries, LineSeries } from "@reincharts/series";
import { drawCalls, flushFrames, generateBars } from "@reincharts/testing";
import { act, render } from "@testing-library/react";
import * as React from "react";
import {
    Label,
    Markers,
    ReferenceArea,
    ReferenceDot,
    ReferenceLine,
    Watermark,
    addShape,
    indexOf,
    logicalOf,
    pixelX,
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
    const calls = () => drawCalls(scene);
    const texts = () =>
        calls()
            .filter((c) => c.type === "fillText")
            .map((c) => c.props.text as string);
    const fillStyles = () =>
        ((scene.getContext("2d") as any).__getEvents() as any[])
            .filter((e) => e.type === "fillStyle")
            .map((e) => String(e.props.value));
    const clear = () => (scene.getContext("2d") as any).__clearDrawCalls();
    return { engine: ref.current!, scene, top, calls, texts, fillStyles, clear, ...utils };
};

describe("coords", () => {
    it("maps dates, numbers and categories to logical x and pixels", async () => {
        const { engine } = await mount(null);
        expect(logicalOf(engine, data[10].date)).toBe(10);
        expect(logicalOf(engine, data[10].date.getTime() + 43_200_000)).toBeCloseTo(10.5);
        expect(indexOf(engine, data[42].date)).toBe(42);
        expect(pixelX(engine, data[20].date)).toBeCloseTo(engine.xOfIndex(20));

        const cats = await mount(null, { data: [{ c: "a" }, { c: "b" }, { c: "c" }], xAccessor: (d: any) => d.c });
        expect(logicalOf(cats.engine, "b")).toBe(1);
        expect(logicalOf(cats.engine, "zzz")).toBeNaN();
        expect(logicalOf(cats.engine, 2)).toBe(2);

        const linear = await mount(null, {
            data: [{ x: 0 }, { x: 10 }, { x: 30 }],
            xMode: "linear",
            xAccessor: (d: any) => d.x,
        });
        expect(logicalOf(linear.engine, 17)).toBe(17);
        expect(indexOf(linear.engine, 17)).toBe(1);
    });

    it("builds every marker shape", () => {
        for (const shape of [
            "arrowUp",
            "arrowDown",
            "circle",
            "square",
            "diamond",
            "triangle",
            "triangleDown",
            "flag",
            "cross",
        ] as const) {
            const p = new Path2D();
            expect(() => addShape(p, shape, 10, 10, 12)).not.toThrow();
        }
    });
});

describe("Markers", () => {
    it("draws markers on bars selected by `when`, batched per color, with text", async () => {
        const { calls, texts, engine } = await mount(
            <>
                <CandlestickSeries />
                <Markers when={(_d, i) => i % 10 === 0} text="S" />
                <Markers when={(_d, i) => i % 10 === 5} position="below" text={(_d, i) => `B${i}`} />
            </>,
        );
        const fills = calls().filter((c) => c.type === "fill");
        expect(fills.length).toBeGreaterThanOrEqual(2);
        const visible = Array.from(
            { length: engine.range.end - engine.range.start + 1 },
            (_, k) => engine.range.start + k,
        );
        expect(texts().filter((t) => t === "S").length).toBeGreaterThanOrEqual(
            visible.filter((i) => i % 10 === 0).length,
        );
        expect(texts()).toContain("B95");
    });

    it("places explicit markers by x, at price, with custom paths, and ignores x outside the data", async () => {
        const { texts, fillStyles } = await mount(
            <>
                <CandlestickSeries />
                <Markers
                    data={[
                        { x: data[90].date, text: "buy", position: "below", shape: "arrowUp", color: "#00ff00" },
                        { x: data[95].date, text: "lvl", position: "atPrice", price: 100, shape: "square" },
                        { x: data[97].date, text: "svg", path: "M0 0 L24 0 L12 24 Z" },
                        { x: new Date(2030, 0, 1), text: "future", position: "above" },
                    ]}
                />
            </>,
        );
        expect(texts()).toEqual(expect.arrayContaining(["buy", "lvl", "svg"]));
        expect(texts()).not.toContain("future");
        expect(fillStyles()).toContain("#00ff00");
    });

    it("stacks markers on the same bar and calls onClick", async () => {
        const onClick = vi.fn();
        const { engine, top, calls } = await mount(
            <>
                <CandlestickSeries />
                <Markers
                    data={[
                        { x: data[95].date, text: "one", id: 1 },
                        { x: data[95].date, text: "two", id: 2 },
                    ]}
                    onClick={onClick}
                />
            </>,
        );
        const [a, b] = calls().filter((c) => c.type === "fillText" && ["one", "two"].includes(c.props.text));
        expect(a.props.y).not.toBe(b.props.y);
        const scale = engine.getScale(engine.paneIds[0]);
        const x = engine.layout.plotLeft + engine.xOfIndex(95);
        const y = scale.toY(data[95].high) - 4 - 6;
        await act(async () => {
            top.dispatchEvent(pointer("pointerdown", x, y));
            top.dispatchEvent(pointer("pointerup", x, y));
            await flushFrames();
        });
        expect(onClick).toHaveBeenCalledWith(
            expect.objectContaining({ index: 95, item: expect.objectContaining({ id: 1 }) }),
        );
    });
});

describe("Label / Watermark / Reference", () => {
    it("Label draws in data and pixel units, with background and at chart level", async () => {
        const { texts, calls } = await mount(
            <Pane id="p" scales={{ right: { domain: [0, 100] } }}>
                <Label text="data" x={data[50].date} y={50} />
                <Label text="px" x={-10} y={10} units="pixel" align="right" background="#ff0000" />
                <Label text="chart" pane={null} x={300} y={20} units="pixel" />
                <Label path="M0 0 L10 0 L10 10 Z" x={data[10].date} y={20} pathScale={2} />
            </Pane>,
        );
        expect(texts()).toEqual(expect.arrayContaining(["data", "px", "chart"]));
        const px = calls().find((c) => c.type === "fillText" && c.props.text === "data");
        expect(px).toBeDefined();
    });

    it("Watermark draws title and subtitle behind series", async () => {
        const { texts } = await mount(
            <>
                <Watermark text="AAPL" subtitle="1D · NASDAQ" />
                <LineSeries />
            </>,
        );
        expect(texts()).toEqual(expect.arrayContaining(["AAPL", "1D · NASDAQ"]));
    });

    it("Reference line, area and dot draw with labels", async () => {
        const { texts, fillStyles } = await mount(
            <Pane id="p" scales={{ right: { domain: [0, 100] } }}>
                <YAxis />
                <ReferenceLine y={70} label="Overbought" />
                <ReferenceLine x={data[80].date} label="Earnings" labelPosition="start" />
                <ReferenceArea x1={data[60].date} x2={data[70].date} label="Range" stroke="#000" />
                <ReferenceArea y1={30} y2={70} color="#ff0000" />
                <ReferenceArea x1={data[90].date} />
                <ReferenceDot x={data[85].date} y={50} label="Peak" />
            </Pane>,
        );
        expect(texts()).toEqual(expect.arrayContaining(["Overbought", "Earnings", "Range", "Peak"]));
        expect(fillStyles().some((f) => /^rgba\(255, 0, 0, 0\.12\)$/.test(f))).toBe(true);
    });

    it("works in linear x mode", async () => {
        const points = Array.from({ length: 40 }, (_, i) => ({ x: i * 2.5, y: i }));
        const { texts } = await mount(
            <>
                <LineSeries y="y" />
                <ReferenceLine x={50} label="x=50" />
                <ReferenceArea x1={10} x2={20} label="band" />
                <Markers data={[{ x: 50, text: "m", position: "above" }]} high="y" />
            </>,
            { data: points, xMode: "linear", xAccessor: (d: any) => d.x },
        );
        expect(texts()).toEqual(expect.arrayContaining(["x=50", "band", "m"]));
    });
});
