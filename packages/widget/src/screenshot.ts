import type { ChartEngine } from "@reincharts/core";

export interface ScreenshotCell {
    /** Cell element (contains the chart canvases). */
    readonly el: HTMLElement;
    readonly engine: ChartEngine | null;
    readonly title: { symbol: string; exchange?: string };
}

/**
 * Composites every chart of the layout into one PNG data URL, with the pane legends drawn as text
 * (legends are DOM, so `engine.screenshot()` alone would miss them).
 */
export function captureScreenshot(
    cells: readonly ScreenshotCell[],
    {
        interval,
        legend = true,
        hidden,
    }: {
        /** Interval label of the title rows. */
        readonly interval: string;
        /** Draw the legends. Default true. */
        readonly legend?: boolean;
        /** Legend ids left out (indicators hidden with the eye button). */
        readonly hidden?: ReadonlySet<string>;
    },
): string {
    const live = cells.filter((c) => c.engine && c.engine.width > 0);
    if (!live.length) {
        return "";
    }
    const origin = live[0].el.parentElement?.getBoundingClientRect() ?? live[0].el.getBoundingClientRect();
    const ratio = live[0].engine!.ratio;
    let width = 0;
    let height = 0;
    const boxes = live.map((c) => {
        const r = c.el.getBoundingClientRect();
        const box = { x: Math.round(r.left - origin.left), y: Math.round(r.top - origin.top) };
        width = Math.max(width, box.x + c.engine!.width);
        height = Math.max(height, box.y + c.engine!.height);
        return box;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return "";
    }
    ctx.fillStyle = live[0].engine!.theme.paneSeparator;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    live.forEach((c, k) => {
        const engine = c.engine!;
        const { x, y } = boxes[k];
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        for (const layer of c.el.querySelectorAll("canvas")) {
            ctx.drawImage(layer, Math.round(x * ratio), Math.round(y * ratio));
        }
        if (!legend) {
            return;
        }
        // legends
        ctx.setTransform(ratio, 0, 0, ratio, x * ratio, y * ratio);
        const theme = engine.theme;
        const index = engine.data.length - 1;
        ctx.textBaseline = "middle";
        for (const pane of engine.layout.panes) {
            if (pane.height <= 0) {
                continue;
            }
            let row = 0;
            const items = engine.legendItems(pane.id, index).filter((i) => !i.hidden && !hidden?.has(i.id));
            if (pane.id === "price") {
                const title = [c.title.symbol, interval, c.title.exchange].filter(Boolean).join(" · ");
                ctx.font = `600 ${theme.fontSize + 3}px ${theme.fontFamily}`;
                ctx.fillStyle = theme.text;
                ctx.fillText(title, pane.left + 8, pane.top + 14);
                row++;
            }
            ctx.font = `${theme.fontSize + 1}px ${theme.fontFamily}`;
            for (const item of items) {
                const ty = pane.top + 14 + row * 18;
                let tx = pane.left + 8;
                // the main series is already named by the title row
                const name = pane.id === "price" && item.name === c.title.symbol ? "" : item.name;
                if (name) {
                    ctx.fillStyle = theme.text;
                    ctx.fillText(name, tx, ty);
                    tx += ctx.measureText(name).width + 8;
                }
                for (const v of item.values) {
                    const text = v.label ? `${v.label} ${v.value}` : v.value;
                    ctx.fillStyle = v.color ?? item.color ?? theme.text;
                    ctx.fillText(text, tx, ty);
                    tx += ctx.measureText(text).width + 8;
                }
                row++;
            }
        }
    });
    return canvas.toDataURL("image/png");
}

/** Starts a browser download of a data URL. */
export function downloadDataUrl(url: string, filename: string) {
    if (!url) {
        return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}
