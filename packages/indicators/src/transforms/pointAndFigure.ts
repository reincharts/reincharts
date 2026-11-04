import { read } from "../calculators/core";
import { priceRange, resolveBoxSize, timeFn, type BoxSize, type TransformOptions } from "./shared";

export interface PointAndFigureOptions<T = any> extends TransformOptions<T> {
    /** Box size: a price amount or `"atr"` (default; ATR at the last bar). */
    readonly boxSize?: BoxSize;
    /** ATR length when `boxSize` is "atr". Default 14. */
    readonly atrPeriod?: number;
    /** Boxes needed to start a new column in the other direction. Default 3. */
    readonly reversal?: number;
    /** `"hl"` (default) uses highs for X and lows for O, `"close"` uses closes only. */
    readonly source?: "hl" | "close";
}

/** One box of a column. */
export interface PointAndFigureBox {
    open: number;
    close: number;
    date: any;
    fromDate: any;
    toDate: any;
}

/** A column of X (direction 1) or O (direction −1) boxes. */
export interface PointAndFigureColumn {
    /** Time of the bar that started the column. */
    date: any;
    fromDate: any;
    toDate: any;
    fromIndex: number;
    toIndex: number;
    /** 1 = rising X column, −1 = falling O column. */
    direction: 1 | -1;
    /** First box open / last box close. */
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    boxes: PointAndFigureBox[];
}

/** Point & figure columns. Returns NEW bars (one per column) to use as chart data. */
export function pointAndFigure<T>(data: readonly T[], o: PointAndFigureOptions<T> = {}): PointAndFigureColumn[] {
    const columns: PointAndFigureColumn[] = [];
    const size = resolveBoxSize(data, o.boxSize ?? "atr", o.atrPeriod, o);
    if (!(size > 0) || data.length === 0) {
        return columns;
    }
    const reversal = Math.max(1, o.reversal ?? 3);
    const { up, down, close } = priceRange(data, o, o.source !== "close");
    const vol = read(data, o.volume, "volume");
    const time = timeFn(o);
    let anchor = NaN;
    let next = NaN; // open of the next box (= close of the last box)
    let col: PointAndFigureColumn | undefined;
    let startIndex = 0;

    const newColumn = (dir: 1 | -1, i: number): PointAndFigureColumn => {
        const t = time(data[i], i);
        const c: PointAndFigureColumn = {
            date: t,
            fromDate: t,
            toDate: t,
            fromIndex: i,
            toIndex: i,
            direction: dir,
            open: NaN,
            close: NaN,
            high: NaN,
            low: NaN,
            volume: 0,
            boxes: [],
        };
        columns.push(c);
        return c;
    };
    const addBoxes = (c: PointAndFigureColumn, count: number, i: number) => {
        const t = time(data[i], i);
        for (let k = 0; k < count; k++) {
            const box = { open: next, close: next + c.direction * size, date: t, fromDate: t, toDate: t };
            c.boxes.push(box);
            next = box.close;
        }
        c.open = c.boxes[0].open;
        c.close = next;
        c.high = Math.max(c.open, c.close);
        c.low = Math.min(c.open, c.close);
        c.toDate = t;
        c.toIndex = i;
    };

    for (let i = 0; i < data.length; i++) {
        if (anchor !== anchor) {
            if (close[i] === close[i]) {
                anchor = close[i];
                startIndex = i;
            }
            continue;
        }
        const w = vol[i] === vol[i] ? vol[i] : 0;
        if (!col) {
            const rise = Math.max(up[i] - anchor, 0);
            const fall = Math.max(anchor - down[i], 0);
            if (rise >= size * reversal || fall >= size * reversal) {
                const dir = rise >= fall ? 1 : -1;
                col = newColumn(dir, startIndex);
                next = anchor;
                addBoxes(col, Math.floor((dir > 0 ? rise : fall) / size), i);
            }
            continue;
        }
        col.volume += w;
        const rise = Math.max(up[i] - next, 0);
        const fall = Math.max(next - down[i], 0);
        if (col.direction > 0 ? rise >= size : fall >= size) {
            addBoxes(col, Math.floor((col.direction > 0 ? rise : fall) / size), i);
        } else if (col.direction > 0 ? fall >= size * reversal : rise >= size * reversal) {
            const dir = -col.direction as 1 | -1;
            // the reversal column starts one box away from the last box and gets
            // one box per full box of movement from the previous column's extreme
            next -= col.direction * size;
            col = newColumn(dir, i);
            col.volume = w;
            addBoxes(col, Math.floor((dir > 0 ? rise : fall) / size), i);
        }
    }
    return columns;
}
