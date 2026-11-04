import "vitest-canvas-mock";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// happy-dom has no layout: give ResizeObserver a deterministic size from the element's style.
class ResizeObserverMock {
    private readonly callback: ResizeObserverCallback;
    public constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
    }
    public observe(target: Element) {
        const el = target as HTMLElement;
        const width = parseFloat(el.style.width) || 800;
        const height = parseFloat(el.style.height) || 400;
        this.callback([{ target, contentRect: { width, height } } as unknown as ResizeObserverEntry], this as any);
    }
    public unobserve() {}
    public disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

afterEach(() => cleanup());
