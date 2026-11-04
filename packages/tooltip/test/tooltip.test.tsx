import { ChartCanvas, Pane, formatPrice, useRenderable, type ChartEngine } from "@reincharts/core";
import { CandlestickSeries, LineSeries, StackedAreaSeries } from "@reincharts/series";
import { flushFrames, generateBars } from "@reincharts/testing";
import { act, fireEvent, render } from "@testing-library/react";
import * as React from "react";
import { Legend, Tooltip, collectLegend, formatChange } from "../src";

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
    const top = utils.container.querySelectorAll("canvas")[1];
    const hover = async (x: number, y: number) => {
        await act(async () => {
            top.dispatchEvent(pointer("pointermove", x, y));
            await flushFrames();
        });
    };
    const leave = async () => {
        await act(async () => {
            top.dispatchEvent(pointer("pointerleave", 0, 0));
            await flushFrames();
        });
    };
    return { engine: ref.current!, hover, leave, ...utils };
};

const series = (
    <>
        <CandlestickSeries name="TEST" />
        <LineSeries name="SMA 10" y={(d) => d.close * 1.01} color="#ff9800" />
    </>
);

describe("Legend", () => {
    it("shows the last bar without crosshair and follows the crosshair", async () => {
        const { container, engine, hover, leave } = await mount(
            <Pane id="price">
                {series}
                <Legend title="AAPL" />
            </Pane>,
        );
        const text = () => container.querySelector(".rc-legend")!.textContent!;
        expect(text()).toContain("AAPL");
        expect(text()).toContain(formatPrice(data[99].close));
        expect(text()).toContain("SMA 10");
        const change = {
            value: data[99].close - data[98].close,
            percent: ((data[99].close - data[98].close) / data[98].close) * 100,
        };
        expect(text()).toContain(formatChange(change));

        await hover(200, 100);
        const i = engine.crosshair!.index;
        expect(i).toBeLessThan(99);
        expect(text()).toContain(formatPrice(data[i].close));
        await leave();
        expect(text()).toContain(formatPrice(data[99].close));
    });

    it("goes compact in narrow panes: current value only, other series behind a toggle", async () => {
        const { container } = await mount(
            <Pane id="price">
                {series}
                <Legend title="AAPL" />
            </Pane>,
            { width: 360 },
        );
        const legend = container.querySelector(".rc-legend")!;
        const text = legend.textContent!;
        expect(text).toContain("AAPL");
        expect(text).toContain(formatPrice(data[99].close)); // current value stays
        expect(text).not.toContain(formatPrice(data[99].open)); // no OHLC breakdown
        expect(text).toContain("1 more"); // other series collapsed behind a toggle
        expect(text).not.toContain("SMA 10");
        fireEvent.click(legend.querySelector(".rc-legend-toggle")!);
        expect(legend.textContent).toContain("SMA 10"); // expanded: chips with names only
        expect(legend.textContent).not.toContain(formatPrice(data[99].close * 1.01));
        fireEvent.click([...legend.querySelectorAll(".rc-legend-item")].find((el) => el.textContent === "SMA 10")!);
        await act(flushFrames);
        expect(container.querySelector(".rc-legend [data-hidden]")).toBeTruthy(); // chips still toggle
    });

    it("shows item actions on pointer move too (row slid under a resting pointer)", async () => {
        const { container } = await mount(
            <Pane id="price">
                {series}
                <Legend
                    actions={(item, { hovered }) => (hovered ? <button type="button">x {item.name}</button> : null)}
                />
            </Pane>,
        );
        const row = [...container.querySelectorAll(".rc-legend-item")].find((el) =>
            el.textContent?.includes("SMA 10"),
        )!;
        expect(row.querySelector("button")).toBeNull();
        fireEvent.pointerMove(row); // no pointerenter
        expect(row.querySelector("button")?.textContent).toBe("x SMA 10");
    });

    it("toggles series visibility on click and renders hidden items muted", async () => {
        const { container, engine } = await mount(
            <Pane id="price">
                {series}
                <Legend />
            </Pane>,
        );
        const rows = container.querySelectorAll<HTMLElement>(".rc-legend-item");
        expect(rows).toHaveLength(2);
        expect(rows[1].style.pointerEvents).toBe("auto");
        const id = collectLegend(engine, "price", 99)[1].item.id;
        await act(async () => {
            fireEvent.click(rows[1]);
            await flushFrames();
        });
        expect(engine.isHidden(id)).toBe(true);
        const after = container.querySelectorAll<HTMLElement>(".rc-legend-item")[1];
        expect(after.dataset.hidden).toBe("");
        expect(after.style.opacity).toBe("0.45");
        expect(after.textContent).toBe("SMA 10");
    });

    it("keeps hidden nameless series clickable so they can be shown again", async () => {
        const { container, engine } = await mount(
            <Pane id="price">
                <StackedAreaSeries ys={[(d) => d.open, (d) => d.close]} names={["Open", "Close"]} />
                <LineSeries y={(d) => d.high} />
                <Legend />
            </Pane>,
        );
        const rows = () => container.querySelectorAll<HTMLElement>(".rc-legend-item");
        const [stacked, line] = collectLegend(engine, "price", 99).map((e) => e.item.id);
        await act(async () => {
            fireEvent.click(rows()[0]);
            fireEvent.click(rows()[1]);
            await flushFrames();
        });
        expect(engine.isHidden(stacked) && engine.isHidden(line)).toBe(true);
        expect(rows()[0].textContent).toBe("OpenClose"); // layer labels without values
        expect(rows()[1].querySelector("span")).toBeTruthy(); // swatch
        await act(async () => {
            fireEvent.click(rows()[0]);
            await flushFrames();
        });
        expect(engine.isHidden(stacked)).toBe(false);
    });

    it("supports actions, renderItem, filter and no toggling", async () => {
        const onItemClick = vi.fn();
        const { container, engine, getAllByRole } = await mount(
            <Pane id="price">
                {series}
                <Legend
                    toggleOnClick={false}
                    onItemClick={onItemClick}
                    filter={(item) => item.name !== "TEST"}
                    renderItem={(item, ctx) => <b>{`${item.name}@${ctx.index}`}</b>}
                    actions={(item, ctx) => (
                        <button type="button" onClick={(e) => (e.stopPropagation(), ctx.toggle())}>
                            {item.name}
                        </button>
                    )}
                />
            </Pane>,
        );
        expect(container.querySelector(".rc-legend")!.textContent).toBe("SMA 10@99SMA 10");
        fireEvent.click(container.querySelector(".rc-legend-item")!);
        expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ name: "SMA 10" }));
        expect(engine.isHidden(collectLegend(engine, "price", 99)[1].item.id)).toBe(false);
        await act(async () => {
            fireEvent.click(getAllByRole("button")[0]);
            await flushFrames();
        });
        expect(engine.isHidden(collectLegend(engine, "price", 99)[1].item.id)).toBe(true);
    });

    it("re-renders only when the shown data changes", async () => {
        let renders = 0;
        const { hover } = await mount(
            <Pane id="price">
                {series}
                <Legend
                    renderItem={(item) => {
                        renders++;
                        return item.name;
                    }}
                />
            </Pane>,
        );
        await hover(200, 100);
        const count = renders;
        await hover(200, 120);
        expect(renders).toBe(count);
    });
});

describe("Tooltip", () => {
    it("appears in the hovered pane with every series at the index", async () => {
        const { container, engine, hover, leave } = await mount(
            <>
                <Pane id="price">
                    {series}
                    <Tooltip />
                </Pane>
                <Pane id="other">
                    <LineSeries y="volume" name="Volume" />
                </Pane>
            </>,
        );
        expect(container.querySelector(".rc-tooltip")).toBeNull();
        await hover(200, 60);
        const tip = container.querySelector<HTMLElement>(".rc-tooltip")!;
        const i = engine.crosshair!.index;
        expect(tip.textContent).toContain(engine.formatX(i));
        expect(tip.textContent).toContain("TEST");
        expect(tip.textContent).toContain("SMA 10");
        expect(tip.style.transform).toMatch(/translate\(\d+px, \d+px\)/);
        await hover(200, 250);
        expect(container.querySelector(".rc-tooltip")).toBeNull();
        await leave();
        expect(container.querySelector(".rc-tooltip")).toBeNull();
    });

    it("nearest mode shows only the series picked by indexAt", async () => {
        const points = Array.from({ length: 30 }, (_, i) => ({ x: i, y: (i * 7) % 11 }));
        const Scatter = () => {
            useRenderable({
                extent: () => [0, 10],
                xExtent: () => [0, 29],
                legend: (i) => ({ id: "scatter", name: "Points", values: [{ value: String(points[i]?.y) }] }),
                indexAt: () => 5,
                draw: () => {},
            });
            return null;
        };
        const { container, hover } = await mount(
            <>
                <Scatter />
                <LineSeries y="y" name="Line" />
                <Tooltip
                    mode="nearest"
                    render={(c) => (
                        <span className="custom">{`${c.items.map((it) => it.name).join(",")}#${c.index}`}</span>
                    )}
                />
            </>,
            { data: points, xMode: "linear", xAccessor: (d: any) => d.x },
        );
        await hover(400, 100);
        expect(container.querySelector(".custom")!.textContent).toBe("Points#5");
    });

    it("nearest mode without indexAt picks the series closest to the pointer", async () => {
        const { container, engine, hover } = await mount(
            <Pane id="p" scales={{ right: { domain: [0, 100] } }}>
                <LineSeries y={() => 80} name="High" />
                <LineSeries y={() => 20} name="Low" />
                <Tooltip mode="nearest" />
            </Pane>,
        );
        const y = engine.getScale("p").toY(25);
        await hover(200, y);
        const text = container.querySelector(".rc-tooltip")!.textContent!;
        expect(text).toContain("Low");
        expect(text).not.toContain("High");
    });
});
