import { generateBars } from "@reincharts/testing";
import type { BrickDatum, KagiDatum, KagiType, PointAndFigureDatum } from "../src";

/** Hand-made transforms producing the documented datum shapes (the real ones live in @reincharts/indicators). */

const closes = (n: number, seed: number) => generateBars(n, { seed }).map((b) => ({ date: b.date, close: b.close }));

export const renkoBricks = (n = 300, seed = 3, size = 1): BrickDatum[] => {
    const out: (BrickDatum & { date: Date })[] = [];
    const src = closes(n, seed);
    let last = Math.round(src[0].close / size) * size;
    let dir = 0;
    for (const { date, close } of src) {
        while (close >= last + size * (dir < 0 ? 2 : 1)) {
            const open = dir < 0 ? last + size : last;
            out.push({ date, open, close: open + size });
            last = open + size;
            dir = 1;
        }
        while (close <= last - size * (dir > 0 ? 2 : 1)) {
            const open = dir > 0 ? last - size : last;
            out.push({ date, open, close: open - size });
            last = open - size;
            dir = -1;
        }
    }
    const tail = src[src.length - 1];
    out.push({ date: tail.date, open: last, close: tail.close, fullyFormed: false });
    return out;
};

export const lineBreakBoxes = (n = 200, seed = 5, lines = 3): BrickDatum[] => {
    const out: (BrickDatum & { date: Date })[] = [];
    const src = closes(n, seed);
    let prev = src[0].close;
    for (const { date, close } of src.slice(1)) {
        if (out.length === 0) {
            if (close !== prev) {
                out.push({ date, open: prev, close });
            }
            continue;
        }
        const last = out[out.length - 1];
        const up = last.close > last.open;
        const recent = out.slice(-lines);
        const hi = Math.max(...recent.map((b) => Math.max(b.open, b.close)));
        const lo = Math.min(...recent.map((b) => Math.min(b.open, b.close)));
        if ((up && close > last.close) || (!up && close < last.close)) {
            out.push({ date, open: last.close, close });
        } else if (up && close < lo) {
            out.push({ date, open: last.open, close });
        } else if (!up && close > hi) {
            out.push({ date, open: last.open, close });
        }
        prev = close;
    }
    return out;
};

export const kagiLines = (n = 300, seed = 11, reversal = 2): KagiDatum[] => {
    const out: (KagiDatum & { date: Date })[] = [];
    const src = closes(n, seed);
    let cur: { date: Date; open: number; close: number; startAs: KagiType; changeTo?: KagiType; changePoint?: number } =
        {
            date: src[0].date,
            open: src[0].close,
            close: src[0].close,
            startAs: "yang",
        };
    let dir = 0;
    let peak: number | undefined;
    let trough: number | undefined;
    const typeOf = () => cur.changeTo ?? cur.startAs;
    const checkBreak = () => {
        if (dir > 0 && peak !== undefined && cur.close > peak && typeOf() === "yin") {
            cur.changeTo = "yang";
            cur.changePoint = peak;
        } else if (dir < 0 && trough !== undefined && cur.close < trough && typeOf() === "yang") {
            cur.changeTo = "yin";
            cur.changePoint = trough;
        }
    };
    for (const { date, close } of src.slice(1)) {
        if (dir === 0) {
            if (Math.abs(close - cur.open) >= reversal) {
                dir = Math.sign(close - cur.open);
                cur.close = close;
                cur.startAs = dir > 0 ? "yang" : "yin";
            }
        } else if ((close - cur.close) * dir > 0) {
            cur.close = close;
            checkBreak();
        } else if (Math.abs(close - cur.close) >= reversal) {
            out.push(cur);
            if (dir > 0) {
                peak = cur.close;
            } else {
                trough = cur.close;
            }
            cur = { date, open: cur.close, close, startAs: typeOf() };
            dir = -dir;
            checkBreak();
        }
    }
    out.push(cur);
    return out;
};

export const pointAndFigure = (n = 400, seed = 21, box = 1, reversal = 3): PointAndFigureDatum[] => {
    const out: (PointAndFigureDatum & { date: Date })[] = [];
    const src = closes(n, seed);
    let top = Math.round(src[0].close / box) * box;
    let dir: 1 | -1 | 0 = 0;
    let boxes: { open: number; close: number }[] = [];
    let date = src[0].date;
    const flush = () => {
        if (boxes.length && dir !== 0) {
            const vals = boxes.flatMap((b) => [b.open, b.close]);
            out.push({
                date,
                direction: dir,
                boxes,
                open: boxes[0].open,
                close: boxes[boxes.length - 1].close,
                high: Math.max(...vals),
                low: Math.min(...vals),
            });
        }
    };
    for (const p of src) {
        if (dir >= 0 && p.close >= top + box) {
            if (dir === 0) {
                dir = 1;
                date = p.date;
            }
            while (p.close >= top + box) {
                boxes.push({ open: top, close: top + box });
                top += box;
            }
        } else if (dir <= 0 && p.close <= top - box) {
            if (dir === 0) {
                dir = -1;
                date = p.date;
            }
            while (p.close <= top - box) {
                boxes.push({ open: top, close: top - box });
                top -= box;
            }
        } else if (dir > 0 && p.close <= top - box * reversal) {
            flush();
            dir = -1;
            date = p.date;
            boxes = [];
            top -= box;
            while (p.close <= top - box) {
                boxes.push({ open: top, close: top - box });
                top -= box;
            }
        } else if (dir < 0 && p.close >= top + box * reversal) {
            flush();
            dir = 1;
            date = p.date;
            boxes = [];
            top += box;
            while (p.close >= top + box) {
                boxes.push({ open: top, close: top + box });
                top += box;
            }
        }
    }
    flush();
    return out;
};
