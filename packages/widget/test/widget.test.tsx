import { createMemoryDatafeed } from "@reincharts/datafeed";
import { flushFrames, generateBars } from "@reincharts/testing";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import * as React from "react";
import { TradingChart, type TradingChartHandle, type TradingChartProps, type TradingChartState } from "../src";

const bars = generateBars(300);

const mount = async (props: Partial<TradingChartProps> = {}) => {
    const ref = React.createRef<TradingChartHandle>();
    const onStateChange = vi.fn<(s: TradingChartState) => void>();
    const utils = render(
        <TradingChart
            ref={ref}
            data={bars}
            symbol="TEST"
            width={1000}
            height={600}
            ratio={1}
            timeZone="UTC"
            onStateChange={onStateChange}
            {...props}
        />,
    );
    await act(flushFrames);
    return { ...utils, ref, onStateChange, last: () => onStateChange.mock.calls.at(-1)![0] };
};

const button = (name: string | RegExp) => screen.getByRole("button", { name });

describe("TradingChart", () => {
    it("renders toolbar, chart and bottom bar", async () => {
        const { container, ref } = await mount();
        expect(container.querySelector(".rc-widget")).toBeTruthy();
        expect(container.querySelectorAll("canvas").length).toBe(2);
        expect(screen.getByText("TEST")).toBeTruthy();
        expect(button("Indicators")).toBeTruthy();
        expect(button("Log scale")).toBeTruthy();
        expect(ref.current!.engine).not.toBeNull();
        expect(ref.current!.engine!.data).toBe(bars);
    });

    it("hides parts with feature toggles", async () => {
        const { container } = await mount({ toolbar: false, bottomBar: false, drawingToolbar: false });
        expect(container.querySelector(".rc-w-toolbar")).toBeNull();
        expect(container.querySelector(".rc-w-bottombar")).toBeNull();
        expect(container.querySelector(".rc-dt")).toBeNull();
    });

    it("adds an indicator from the dialog and removes it from the object tree", async () => {
        const { last, ref } = await mount({ objectTree: "open" });
        fireEvent.click(button("Indicators"));
        const dialog = screen.getByRole("dialog");
        fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "relative strength" } });
        fireEvent.click(within(dialog).getByRole("button", { name: /Relative Strength Index/ }));
        await act(flushFrames);
        expect(last().indicators).toMatchObject([{ id: "rsi-1", definitionId: "rsi", paneId: "pane-rsi-1" }]);
        expect(ref.current!.engine!.paneIds).toEqual(["price", "pane-rsi-1"]);
        // Escape closes the dialog
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        expect(screen.queryByRole("dialog")).toBeNull();

        const tree = screen.getByRole("tree");
        fireEvent.click(within(tree).getByRole("button", { name: "Hide RSI 14 close" }));
        expect(last().indicators[0].hidden).toBe(true);
        fireEvent.click(within(tree).getByRole("button", { name: "Remove RSI 14 close" }));
        await act(flushFrames);
        expect(last().indicators).toEqual([]);
        expect(ref.current!.engine!.paneIds).toEqual(["price"]);
    });

    it("edits indicator inputs in the settings dialog", async () => {
        const { ref, last } = await mount({ defaultIndicators: ["ema"] });
        expect(ref.current!.save().indicators[0].styles.ma?.color).toBeTruthy();
        fireEvent.click(button("Object tree"));
        fireEvent.click(within(screen.getByRole("tree")).getByRole("button", { name: "EMA 9 close settings" }));
        const dialog = screen.getByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText("Length"), { target: { value: "50" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Ok" }));
        expect(last().indicators[0].inputs).toEqual({ period: 50 });
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("switches the chart type", async () => {
        const onChartTypeChange = vi.fn();
        const { last, ref } = await mount({ onChartTypeChange });
        fireEvent.click(button(/Chart type/));
        fireEvent.click(screen.getByRole("menuitem", { name: "Renko" }));
        await act(flushFrames);
        expect(onChartTypeChange).toHaveBeenCalledWith("renko");
        expect(last().chartType).toBe("renko");
        expect(ref.current!.engine!.data.length).toBeLessThan(bars.length);
        expect(screen.queryByRole("menu")).toBeNull();
    });

    it("toggles scale modes from the bottom bar", async () => {
        const { ref, last } = await mount();
        const scale = () => ref.current!.engine!.getScale("price");
        fireEvent.click(button("Log scale"));
        await act(flushFrames);
        expect(last().scaleMode).toBe("log");
        expect(scale().mode).toBe("log");
        fireEvent.click(button("Percentage scale"));
        await act(flushFrames);
        expect(scale().mode).toBe("percent");
        fireEvent.click(button("Percentage scale"));
        await act(flushFrames);
        expect(scale().mode).toBe("linear");
        scale().auto = false;
        fireEvent.click(button("Auto scale"));
        expect(scale().isAuto).toBe(true);
    });

    it("applies range presets", async () => {
        const { ref } = await mount();
        const e = ref.current!.engine!;
        fireEvent.click(button("1M"));
        expect(e.to - e.from).toBeLessThan(40);
        fireEvent.click(button("All"));
        expect(e.from).toBe(-0.5);
    });

    it("opens the context menu and removes all indicators", async () => {
        const { container, last } = await mount({ defaultIndicators: ["rsi", "sma"] });
        const top = container.querySelectorAll("canvas")[1];
        fireEvent.contextMenu(top, { clientX: 100, clientY: 100 });
        const menu = screen.getByRole("menu");
        fireEvent.click(within(menu).getByRole("menuitem", { name: "Remove all indicators" }));
        expect(last().indicators).toEqual([]);
        expect(screen.queryByRole("menu")).toBeNull();
    });

    it("saves and loads the whole state", async () => {
        const { ref } = await mount({ defaultIndicators: ["ema", "macd"], defaultChartType: "line" });
        const saved = ref.current!.save();
        expect(saved).toMatchObject({ symbol: "TEST", chartType: "line" });
        expect(saved.indicators.map((i) => i.definitionId)).toEqual(["ema", "macd"]);
        expect(saved.visibleRange!.to).toBeGreaterThan(saved.visibleRange!.from);
        expect(Object.keys(saved.paneSizes!)).toEqual(["price", "pane-macd-1"]);

        act(() => {
            ref.current!.removeIndicator("ema-1");
        });
        act(() => {
            ref.current!.addIndicator("bollinger");
        });
        expect(ref.current!.save().indicators.map((i) => i.id)).toEqual(["macd-1", "bollinger-1"]);

        act(() => ref.current!.load(JSON.stringify(saved)));
        await act(flushFrames);
        const again = ref.current!.save();
        expect(again.indicators).toEqual(saved.indicators);
        expect(again.chartType).toBe("line");
        expect(ref.current!.screenshot()).toMatch(/^data:image\/png/);
    });

    it("loads a partial state keeping the symbol and resolution", async () => {
        const { ref } = await mount({
            data: bars,
            symbol: undefined,
            defaultSymbol: "TEST",
            defaultIndicators: ["ema"],
        });
        act(() => ref.current!.load({ chartType: "line" }));
        await act(flushFrames);
        expect(ref.current!.save()).toMatchObject({
            symbol: "TEST",
            resolution: "1D",
            chartType: "line",
            indicators: [],
        });
    });

    it("stores only the settings the user changed", async () => {
        const { last, onStateChange } = await mount({ volume: false });
        fireEvent.click(button("Settings"));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Ok" }));
        expect(onStateChange).not.toHaveBeenCalled();
        fireEvent.click(button("Settings"));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("checkbox", { name: "Grid lines" }));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Ok" }));
        expect(last().settings).toEqual({ grid: false });
        expect(last().theme).toBeUndefined();
    });

    it("returns ids from addIndicator", async () => {
        const { ref } = await mount();
        let id: string | undefined;
        act(() => {
            id = ref.current!.addIndicator("rsi", { inputs: { period: 7 } });
        });
        expect(id).toBe("rsi-1");
        expect(ref.current!.addIndicator("does-not-exist")).toBeUndefined();
    });

    it("supports controlled props", async () => {
        const onSymbolChange = vi.fn();
        const { rerender, ref } = await mount({ chartType: "area", layout: "2h", onSymbolChange });
        expect(ref.current!.save().chartType).toBe("area");
        expect(document.querySelectorAll(".rc-w-cell").length).toBe(2);
        rerender(
            <TradingChart
                data={bars}
                symbol="TEST"
                chartType="bars"
                layout="single"
                width={1000}
                height={600}
                ratio={1}
            />,
        );
        expect(document.querySelectorAll(".rc-w-cell").length).toBe(1);
    });

    it("toggles the theme", async () => {
        const { container, last } = await mount();
        fireEvent.click(button("Dark theme"));
        expect(container.querySelector(".rc-widget")!.getAttribute("data-theme")).toBe("dark");
        expect(last().theme).toBe("dark");
    });

    it("works in datafeed mode with symbol search and compare", async () => {
        const daily = (seed: number) =>
            generateBars(200, { seed }).map((b) => ({ ...b, time: b.date.getTime(), date: undefined }));
        const feed = createMemoryDatafeed({ AAA: daily(1), BBB: daily(2), CCC: daily(3) });
        const onSymbolChange = vi.fn();
        const { ref, last } = await mount({
            data: undefined,
            symbol: undefined,
            datafeed: feed,
            defaultSymbol: "AAA",
            onSymbolChange,
        });
        await waitFor(() => expect(ref.current!.engine!.data.length).toBe(200));
        expect(button(/Symbol search/)).toBeTruthy();

        fireEvent.click(button(/Symbol search/));
        const dialog = screen.getByRole("dialog");
        await waitFor(() => expect(within(dialog).getAllByRole("option").length).toBe(3));
        fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "bb" } });
        await waitFor(() => expect(within(dialog).getAllByRole("option").length).toBe(1));
        fireEvent.click(within(dialog).getByRole("option"));
        expect(onSymbolChange).toHaveBeenCalledWith("BBB");
        await waitFor(() => expect(ref.current!.engine!.data[0].close).toBe(daily(2)[0].close));

        fireEvent.click(button("Compare symbol"));
        const compare = screen.getByRole("dialog");
        await waitFor(() => expect(within(compare).getAllByRole("option").length).toBe(3));
        fireEvent.click(within(compare).getByRole("option", { name: /CCC/ }));
        expect(last().compare).toEqual(["CCC"]);
        expect(last().scaleMode).toBe("percent");
        await waitFor(() =>
            expect(ref.current!.engine!.legendItems("price", 199).some((i) => i.name === "CCC")).toBe(true),
        );
    });
});

describe("TradingChart drawings", () => {
    const drawing = (id: string) => ({
        id,
        type: "horizontalLine",
        pane: "price",
        points: [{ time: bars[250].date.getTime(), price: 100 }],
        style: {},
    });

    it("loads drawings from the state, lists them in the object tree and supports undo / redo", async () => {
        const { last, ref } = await mount({
            defaultState: { drawings: [drawing("a"), drawing("b")] },
            objectTree: "open",
        });
        expect(ref.current!.save().drawings).toHaveLength(2);
        const tree = screen.getByRole("tree");
        expect(within(tree).getAllByText("Horizontal Line")).toHaveLength(2);
        expect(button("Undo")).toHaveProperty("disabled", true);

        fireEvent.click(within(tree).getAllByRole("button", { name: "Lock Horizontal Line" })[0]);
        expect((last().drawings[0] as any).locked).toBe(true);
        fireEvent.click(within(tree).getAllByRole("button", { name: "Remove Horizontal Line" })[1]);
        expect(last().drawings.map((d: any) => d.id)).toEqual(["a"]);

        fireEvent.click(button("Undo"));
        expect(last().drawings).toHaveLength(2);
        fireEvent.click(button("Redo"));
        expect(last().drawings).toHaveLength(1);
    });

    it("removes all drawings from the context menu and renders the drawing toolbar", async () => {
        const { container, last } = await mount({ defaultState: { drawings: [drawing("a")] } });
        expect(container.querySelector(".rc-dt")).toBeTruthy();
        fireEvent.contextMenu(container.querySelectorAll("canvas")[1], { clientX: 50, clientY: 50 });
        fireEvent.click(screen.getByRole("menuitem", { name: "Remove all drawings" }));
        expect(last().drawings).toEqual([]);
    });
});
