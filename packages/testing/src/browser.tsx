import type * as React from "react";
import { createRoot } from "react-dom/client";

/** Mounts a chart into the browser test page and waits for its first frames. */
export const mountChart = async (ui: React.ReactElement, { width = 640, height = 360 } = {}) => {
    const host = document.createElement("div");
    host.style.cssText = `width:${width}px;height:${height}px;`;
    document.body.style.margin = "0";
    if (!document.getElementById("rc-test-no-motion")) {
        // screenshots must not catch CSS transitions mid-way
        const style = document.createElement("style");
        style.id = "rc-test-no-motion";
        style.textContent = "*, *::before, *::after { transition: none !important; animation: none !important; }";
        document.head.appendChild(style);
    }
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(ui);
    // fonts change text metrics (axis widths): wait for them before the first frames we screenshot
    await document.fonts?.ready;
    for (let i = 0; i < 4; i++) {
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    }
    return {
        host,
        unmount: () => {
            root.unmount();
            host.remove();
        },
    };
};
