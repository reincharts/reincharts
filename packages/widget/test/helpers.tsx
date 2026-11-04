// Shared helpers of the widget browser tests (real Chromium, real UI).
import { createMemoryDatafeed, createRandomDatafeed } from "@reincharts/datafeed";
import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import * as React from "react";
import { page, userEvent } from "vitest/browser";
import { TradingChart, type TradingChartHandle, type TradingChartProps, type TradingChartState } from "../src";

/** Fixed clock of the random datafeed (a Monday afternoon, UTC). */
const NOW = Date.UTC(2025, 5, 2, 15, 30);

/** Deterministic datafeed for any symbol / resolution, without realtime timers. */
export const randomFeed = () =>
    createRandomDatafeed({
        symbols: [
            { symbol: "AAPL", name: "AAPL", description: "Apple Inc.", exchange: "NASDAQ", type: "stock" },
            { symbol: "MSFT", name: "MSFT", description: "Microsoft Corporation", exchange: "NASDAQ", type: "stock" },
            { symbol: "NVDA", name: "NVDA", description: "NVIDIA Corporation", exchange: "NASDAQ", type: "stock" },
        ],
        startPrice: (s) => (s === "MSFT" ? 400 : s === "NVDA" ? 90 : 180),
        realtimeIntervalMs: 0,
        now: () => NOW,
    });

const daily = (seed: number, price: number) =>
    generateBars(300, { seed, price, start: Date.UTC(2024, 0, 1) }).map(({ date, ...b }) => ({
        ...b,
        time: date.getTime(),
    }));

/** In-memory daily datafeed (AAA, BBB, CCC). */
export const memoryFeed = () => createMemoryDatafeed({ AAA: daily(1, 100), BBB: daily(2, 50), CCC: daily(3, 20) });

/** Daily bars for data mode. */
const bars = generateBars(300, { seed: 5 });

export const frames = async (n = 2) => {
    for (let i = 0; i < n; i++) {
        await new Promise((r) => requestAnimationFrame(r));
    }
};

/** Polls `cond` every frame until it holds (fails with `message` after `timeout` ms). */
export async function until(cond: () => unknown, message = "condition", timeout = 4000) {
    const start = performance.now();
    while (!cond()) {
        if (performance.now() - start > timeout) {
            throw new Error(`Timed out waiting for ${message}`);
        }
        await frames(1);
    }
}

const mounted = new Set<() => void>();

/** Unmounts every widget still mounted (use in `afterEach`, so a failed test doesn't leak into the next). */
export const unmountAll = () => {
    for (const fn of [...mounted]) {
        fn();
    }
    mounted.clear();
    if (document.fullscreenElement) {
        void document.exitFullscreen();
    }
};

export interface Mounted {
    readonly host: HTMLElement;
    readonly ref: React.RefObject<TradingChartHandle | null>;
    /** Every state reported by onStateChange. */
    readonly states: TradingChartState[];
    /** Latest reported state (falls back to `save()`). */
    readonly state: () => TradingChartState;
    readonly engine: () => NonNullable<TradingChartHandle["engine"]>;
    readonly unmount: () => void;
    readonly rerender: (props: Partial<TradingChartProps>) => Promise<void>;
}

/** Mounts a TradingChart and waits until its data is drawn. */
export async function mountWidget(
    props: Partial<TradingChartProps> = {},
    { width = 1200, height = 700, strict = false } = {},
): Promise<Mounted> {
    const ref = React.createRef<TradingChartHandle>();
    const states: TradingChartState[] = [];
    let setProps: (p: Partial<TradingChartProps>) => void = () => {};
    function Harness({ initial }: { initial: Partial<TradingChartProps> }) {
        const [p, set] = React.useState(initial);
        setProps = set;
        return (
            <TradingChart
                ref={ref}
                timeZone="UTC"
                ratio={1}
                onStateChange={(s) => states.push(s)}
                {...(p.datafeed ? {} : { data: bars, symbol: "TEST" })}
                {...p}
            />
        );
    }
    const ui = <Harness initial={props} />;
    const { host, unmount: rawUnmount } = await mountChart(strict ? <React.StrictMode>{ui}</React.StrictMode> : ui, {
        width,
        height,
    });
    const unmount = () => {
        if (mounted.delete(unmount)) {
            rawUnmount();
        }
    };
    mounted.add(unmount);
    await until(() => (ref.current?.engine?.data.length ?? 0) > 0, "chart data");
    await until(() => !host.querySelector(".rc-w-status"), "loading to finish");
    await frames(3);
    return {
        host,
        ref,
        states,
        state: () => states.at(-1) ?? ref.current!.save(),
        engine: () => ref.current!.engine!,
        unmount,
        rerender: async (p) => {
            setProps({ ...props, ...p });
            await frames(3);
        },
    };
}

/** Toolbar / dialog button by its accessible name. */
export const button = (name: string | RegExp) =>
    page.getByRole("button", { name, exact: typeof name === "string" }).first();

export const menuitem = (name: string | RegExp) =>
    page.getByRole("menuitem", { name, exact: typeof name === "string" }).first();

export const clickButton = async (name: string | RegExp) => {
    await button(name).click();
    await frames();
};

export const press = async (keys: string) => {
    await userEvent.keyboard(keys);
    await frames();
};

/** The top canvas of chart `cell` (receives pointer events). */
export const chartCanvas = (host: HTMLElement, cell = 0) =>
    host.querySelectorAll(".rc-w-cell")[cell].querySelectorAll<HTMLCanvasElement>(".rc-chart canvas")[1];

/** Legend rows of a cell whose text starts with `prefix` (re-queried: rows re-render with the crosshair). */
export const legendRow = (host: HTMLElement, prefix: string, cell = 0) =>
    [...host.querySelectorAll(".rc-w-cell")[cell].querySelectorAll<HTMLElement>(".rc-legend-item")].find((r) =>
        r.textContent?.startsWith(prefix),
    );

/** Hovers a legend row and clicks one of its action buttons (eye, gear, ×). */
export async function legendAction(host: HTMLElement, prefix: string, label: string, cell = 0) {
    const row = legendRow(host, prefix, cell);
    expect(row, `legend row "${prefix}"`).toBeTruthy();
    // come from outside the row, like a real pointer (a row that slides under a resting pointer after the row
    // above was removed gets no pointerenter in React)
    await userEvent.hover(host.querySelector<HTMLElement>(".rc-w-bottombar") ?? document.body, { force: true });
    // legend values follow the pointer: skip Playwright's "element is stable" wait
    await userEvent.hover(legendRow(host, prefix, cell)!, { force: true });
    await frames();
    const btn = legendRow(host, prefix, cell)!.querySelector<HTMLElement>(`[aria-label="${label}"]`);
    expect(btn, `"${label}" button of legend row "${prefix}"`).toBeTruthy();
    await userEvent.click(btn!, { force: true });
    await frames();
}

/** Dispatches a pointer event in client coordinates (drags, drawing clicks). */
export const pointer = (el: Element, type: string, x: number, y: number, buttons = type === "pointerup" ? 0 : 1) =>
    el.dispatchEvent(
        new PointerEvent(type, {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            button: 0,
            buttons,
            pointerType: "mouse",
            isPrimary: true,
        }),
    );

/** Drags across the chart plot (pans) by `dx` pixels. */
export async function drag(canvas: HTMLCanvasElement, dx: number, dy = 0) {
    const r = canvas.getBoundingClientRect();
    const x = r.left + r.width * 0.5;
    const y = r.top + r.height * 0.4;
    pointer(canvas, "pointermove", x, y, 0);
    pointer(canvas, "pointerdown", x, y);
    for (let k = 1; k <= 8; k++) {
        pointer(canvas, "pointermove", x + (dx * k) / 8, y + (dy * k) / 8);
        await frames(1);
    }
    pointer(canvas, "pointerup", x + dx, y + dy);
    await frames(3);
}

/** Median spacing (ms) of the engine bars. */
export const medianStep = (times: Float64Array) => {
    const d: number[] = [];
    for (let i = 1; i < times.length; i++) {
        d.push(times[i] - times[i - 1]);
    }
    d.sort((a, b) => a - b);
    return d[d.length >> 1];
};
