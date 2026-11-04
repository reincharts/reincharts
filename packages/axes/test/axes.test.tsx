import { ChartCanvas, Pane, useChart, useRenderable, type ChartEngine } from "@reincharts/core";
import { drawCalls, flushFrames, generateBars } from "@reincharts/testing";
import { act, render } from "@testing-library/react";
import * as React from "react";
import { Grid, XAxis, YAxis } from "../src";

const mount = async (ui: React.ReactNode, data: any[] = generateBars(200)) => {
    const ref = React.createRef<ChartEngine>();
    const utils = render(
        <ChartCanvas ref={ref} data={data} width={600} height={300} ratio={1} timeZone="UTC">
            {ui}
        </ChartCanvas>,
    );
    await act(flushFrames);
    const scene = utils.container.querySelector("canvas")!;
    const texts = () =>
        drawCalls(scene)
            .filter((c) => c.type === "fillText")
            .map((c) => c.props.text as string);
    return { engine: ref.current!, scene, texts };
};

describe("axes", () => {
    it("XAxis reserves a band and draws time labels", async () => {
        const { engine, texts } = await mount(<XAxis />);
        expect(engine.layout.timeAxis).toEqual({ top: 272, height: 28 });
        expect(texts().length).toBeGreaterThan(2);
    });

    it("XAxis height and custom formatter", async () => {
        const { engine, texts } = await mount(<XAxis height={40} tickFormat={(t) => `#${t.label}`} />);
        expect(engine.layout.timeAxis?.height).toBe(40);
        expect(texts().every((t) => t.startsWith("#"))).toBe(true);
    });

    it("YAxis reserves width on its side and labels the scale", async () => {
        const { engine, texts } = await mount(
            <Pane id="p" scales={{ right: { domain: [0, 100] } }}>
                <YAxis />
                <YAxis side="left" width={70} />
            </Pane>,
        );
        expect(engine.layout.axisLeft).toBe(70);
        expect(engine.layout.axisRight).toBeGreaterThanOrEqual(50);
        expect(engine.layout.plotWidth).toBe(600 - 70 - engine.layout.axisRight);
        expect(texts()).toEqual(expect.arrayContaining(["20", "40", "60", "80"]));
    });

    it("YAxis skips tick labels under value labels drawn by other renderables", async () => {
        const ValueLabel = ({ value }: { value: number }) => {
            const engine = useChart();
            useRenderable({
                draw() {},
                axisLabels: (pane) => [{ scale: "right", y: engine.getScale(pane).toY(value) }],
            });
            return null;
        };
        const { texts } = await mount(
            <Pane id="p" scales={{ right: { domain: [0, 100], margins: { top: 0, bottom: 0 } } }}>
                <ValueLabel value={40} />
                <YAxis />
            </Pane>,
        );
        expect(texts()).not.toContain("40");
        expect(texts()).toEqual(expect.arrayContaining(["20", "60", "80"]));
    });

    it("YAxis can hide labels and show a custom scale", async () => {
        const { texts } = await mount(
            <Pane id="p" scales={{ v: { domain: [0, 1] } }}>
                <YAxis scale="v" tickFormat={(t) => `${t.value * 100}%`} />
                <YAxis side="left" showTickLabels={false} />
            </Pane>,
        );
        expect(texts()).toEqual(expect.arrayContaining(["40%", "60%"]));
    });

    it("Grid strokes lines behind everything", async () => {
        const { scene } = await mount(
            <Pane id="p" scales={{ right: { domain: [0, 10] } }}>
                <Grid />
            </Pane>,
        );
        expect(drawCalls(scene).some((c) => c.type === "stroke")).toBe(true);
    });

    it("labels category and numeric x axes", async () => {
        const cats = await mount(
            <XAxis />,
            ["Mon", "Tue", "Wed"].map((x, i) => ({ x, y: i })),
        );
        expect(cats.texts()).toEqual(["Mon", "Tue", "Wed"]);
        const nums = await mount(
            <XAxis />,
            Array.from({ length: 11 }, (_, i) => ({ x: i * 10, y: i })),
        );
        expect(nums.texts()).toEqual(expect.arrayContaining(["0", "20", "40"]));
    });
});
