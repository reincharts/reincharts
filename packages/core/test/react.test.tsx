import { flushFrames, generateBars } from "@reincharts/testing";
import { act, render } from "@testing-library/react";
import * as React from "react";
import {
    ChartCanvas,
    ChartOverlay,
    Pane,
    useChartEvent,
    useChartState,
    useHitTarget,
    useRenderable,
    type ChartEngine,
} from "../src";

const Probe = ({ onDraw }: { onDraw: (s: any) => void }) => {
    useRenderable({ draw: (_ctx, scope) => onDraw(scope), extent: () => [0, 10] });
    return null;
};

const Legend = () => {
    const index = useChartState((s) => s.crosshair?.index ?? -1);
    return <span data-testid="legend">{index}</span>;
};

const pointer = (type: string, x: number, y: number, extra: Record<string, unknown> = {}) => {
    const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, button: 0, ...extra });
    Object.assign(e, { pointerId: 1, pointerType: "mouse", ...extra });
    return e;
};

describe("<ChartCanvas>", () => {
    it("renders panes, draws renderables and exposes the engine via ref", async () => {
        const draws: any[] = [];
        const ref = React.createRef<ChartEngine>();
        render(
            <ChartCanvas ref={ref} data={generateBars(100)} width={600} height={300} ratio={1}>
                <Pane id="price">
                    <Probe onDraw={(s) => draws.push(s)} />
                </Pane>
            </ChartCanvas>,
        );
        await act(flushFrames);
        expect(draws.length).toBeGreaterThan(0);
        expect(draws.at(-1).pane.id).toBe("price");
        expect(draws.at(-1).end).toBe(99);
        expect(ref.current?.layout.panes).toHaveLength(1);
    });

    it("keeps rendering under React.StrictMode (double mount)", async () => {
        const draw = vi.fn();
        render(
            <React.StrictMode>
                <ChartCanvas data={generateBars(50)} width={400} height={200} ratio={1}>
                    <Probe onDraw={draw} />
                </ChartCanvas>
            </React.StrictMode>,
        );
        await act(flushFrames);
        expect(draw).toHaveBeenCalled();
    });

    it("creates an implicit pane when there is no <Pane>", async () => {
        const ref = React.createRef<ChartEngine>();
        const draw = vi.fn();
        render(
            <ChartCanvas ref={ref} data={generateBars(20)} width={300} height={200} ratio={1}>
                <Probe onDraw={draw} />
            </ChartCanvas>,
        );
        await act(flushFrames);
        expect(ref.current?.paneIds).toEqual(["main"]);
        expect(draw).toHaveBeenCalled();
    });

    it("auto-sizes from the container", async () => {
        const ref = React.createRef<ChartEngine>();
        render(
            <div style={{ width: 640, height: 320 }}>
                <ChartCanvas ref={ref} data={generateBars(20)} ratio={1} style={{ width: "640px", height: "320px" }} />
            </div>,
        );
        await act(flushFrames);
        expect(ref.current?.width).toBe(640);
    });

    it("moves the crosshair, updates state subscribers and pans / zooms", async () => {
        const ref = React.createRef<ChartEngine>();
        const moves = vi.fn();
        const Listener = () => {
            useChartEvent("pointermove", moves);
            return null;
        };
        const { container, getByTestId } = render(
            <ChartCanvas ref={ref} data={generateBars(300)} width={800} height={400} ratio={1}>
                <Listener />
                <Legend />
            </ChartCanvas>,
        );
        await act(flushFrames);
        const top = container.querySelectorAll("canvas")[1];
        await act(async () => {
            top.dispatchEvent(pointer("pointermove", 400, 200));
            await flushFrames();
        });
        expect(moves).toHaveBeenCalled();
        expect(Number(getByTestId("legend").textContent)).toBeGreaterThan(200);

        const engine = ref.current!;
        const from = engine.from;
        await act(async () => {
            top.dispatchEvent(pointer("pointerdown", 400, 200));
            top.dispatchEvent(pointer("pointermove", 500, 200));
            top.dispatchEvent(pointer("pointerup", 500, 200));
            await flushFrames();
        });
        expect(engine.from).toBeLessThan(from);

        // with autoscale on, a vertical drag never moves the price scale (data can't get lost)
        const scale = engine.getScale(engine.paneIds[0]);
        const verticalDrag = async () => {
            await act(async () => {
                top.dispatchEvent(pointer("pointerdown", 400, 200));
                top.dispatchEvent(pointer("pointermove", 400, 230));
                top.dispatchEvent(pointer("pointermove", 400, 300));
                top.dispatchEvent(pointer("pointerup", 400, 300));
                await flushFrames();
            });
        };
        const autoMax = scale.max;
        await verticalDrag();
        expect(scale.isAuto).toBe(true);
        expect(scale.max).toBeCloseTo(autoMax);
        // after adjusting the price scale manually, vertical dragging pans it
        scale.scaleBy(1.2);
        const manualMax = scale.max;
        await verticalDrag();
        expect(scale.max).toBeGreaterThan(manualMax);
        scale.resetAuto();

        const span = engine.to - engine.from;
        await act(async () => {
            const wheel = new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true });
            Object.defineProperties(wheel, { clientX: { value: 400 }, clientY: { value: 200 } });
            top.dispatchEvent(wheel);
            await flushFrames();
        });
        expect(engine.to - engine.from).toBeLessThan(span);

        await act(async () => {
            top.dispatchEvent(pointer("pointerleave", 0, 0));
            await flushFrames();
        });
        expect(getByTestId("legend").textContent).toBe("-1");
    });

    it("routes drags to hit targets before panning", async () => {
        const ref = React.createRef<ChartEngine>();
        const onDrag = vi.fn();
        const onClick = vi.fn();
        const Target = () => {
            useHitTarget({ hitTest: (x) => x > 100 && x < 200, onDrag, onClick });
            return null;
        };
        const { container } = render(
            <ChartCanvas ref={ref} data={generateBars(300)} width={800} height={400} ratio={1}>
                <Target />
            </ChartCanvas>,
        );
        await act(flushFrames);
        const top = container.querySelectorAll("canvas")[1];
        const from = ref.current!.from;
        await act(async () => {
            top.dispatchEvent(pointer("pointerdown", 150, 100));
            top.dispatchEvent(pointer("pointermove", 170, 100));
            top.dispatchEvent(pointer("pointerup", 170, 100));
            top.dispatchEvent(pointer("pointerdown", 150, 100));
            top.dispatchEvent(pointer("pointerup", 150, 100));
            await flushFrames();
        });
        expect(onDrag).toHaveBeenCalledWith(expect.objectContaining({ dx: 20 }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(ref.current!.from).toBe(from);
    });

    it("lets listeners capture pointerdown (drawing tools) and handles keyboard", async () => {
        const ref = React.createRef<ChartEngine>();
        const drag = vi.fn();
        const Tool = () => {
            useChartEvent("pointerdown", (e) => e.preventDefault());
            useChartEvent("drag", drag);
            return null;
        };
        const { container } = render(
            <ChartCanvas ref={ref} data={generateBars(300)} width={800} height={400} ratio={1}>
                <Tool />
            </ChartCanvas>,
        );
        await act(flushFrames);
        const [, top] = container.querySelectorAll("canvas");
        await act(async () => {
            top.dispatchEvent(pointer("pointerdown", 300, 100));
            top.dispatchEvent(pointer("pointermove", 350, 120));
            top.dispatchEvent(pointer("pointerup", 350, 120));
            await flushFrames();
        });
        expect(drag).toHaveBeenCalled();
        const span = ref.current!.to - ref.current!.from;
        const chart = container.querySelector(".rc-chart")!;
        await act(async () => {
            chart.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
            await flushFrames();
        });
        expect(ref.current!.to - ref.current!.from).toBeLessThan(span);
    });

    it("positions overlays over panes", async () => {
        const { getByTestId } = render(
            <ChartCanvas data={generateBars(30)} width={500} height={300} ratio={1}>
                <Pane id="a">
                    <ChartOverlay>
                        <span data-testid="overlay">hi</span>
                    </ChartOverlay>
                </Pane>
                <Pane id="b" />
            </ChartCanvas>,
        );
        await act(flushFrames);
        const box = getByTestId("overlay").parentElement!;
        expect(box.style.height).toBe("150px");
    });
});
