import { sortBars } from "./bars";
import type { Bar } from "./types";

/** A parsed CSV / TSV row: OHLCV plus any extra column (numbers when numeric, strings otherwise). */
export type CsvBar = Bar & { [column: string]: number | string | undefined };

/** Options of `parseCsv`. */
export interface ParseCsvOptions {
    /** Field delimiter. Auto-detected from the header (tab, comma or semicolon) when omitted. */
    readonly delimiter?: string;
    /** Time column. Default: the first of "time", "date", "datetime", "timestamp" (case-insensitive). */
    readonly timeColumn?: string;
    /**
     * Converts a time cell to ms epoch. Default: numbers are epoch seconds (< 1e11) or milliseconds;
     * ISO dates / date-times without a zone are read as UTC; anything else goes through `Date.parse`.
     */
    readonly parseTime?: (value: string) => number;
    /** Renames columns to OHLCV fields, e.g. `{ close: "Adj Close", volume: "Vol" }`. */
    readonly columns?: Partial<Record<"open" | "high" | "low" | "close" | "volume", string>>;
    /** Sort by time and drop duplicates. Default true. */
    readonly sort?: boolean;
}

const NUMERIC = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
const ISO_LOCAL = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;

/** Default time cell parser (see `ParseCsvOptions.parseTime`). */
export function parseTimeValue(value: string): number {
    const v = value.trim();
    if (NUMERIC.test(v)) {
        const n = Number(v);
        return Math.abs(n) < 1e11 ? n * 1000 : n;
    }
    const m = ISO_LOCAL.exec(v);
    if (m) {
        const [, y, mo, d, h = "0", mi = "0", s = "0", ms = "0"] = m;
        return Date.UTC(+y, +mo - 1, +d, +h, +mi, +s, +ms.padEnd(3, "0"));
    }
    return Date.parse(v);
}

const splitLine = (line: string, delimiter: string): string[] => {
    if (!line.includes('"')) {
        return line.split(delimiter);
    }
    const out: string[] = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quoted) {
            if (ch === '"' && line[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (ch === '"') {
                quoted = false;
            } else {
                cell += ch;
            }
        } else if (ch === '"') {
            quoted = true;
        } else if (line.startsWith(delimiter, i)) {
            out.push(cell);
            cell = "";
            i += delimiter.length - 1;
        } else {
            cell += ch;
        }
    }
    out.push(cell);
    return out;
};

const TIME_COLUMNS = ["time", "date", "datetime", "timestamp"];
const FIELDS = ["open", "high", "low", "close", "volume"] as const;

/**
 * Parses CSV / TSV OHLC text (with a header row) into bars sorted by time.
 * Rows with an invalid time or no price are skipped; missing open/high/low default to close.
 */
export function parseCsv(text: string, options: ParseCsvOptions = {}): CsvBar[] {
    const lines = text.split(/\r?\n/);
    let start = 0;
    while (start < lines.length && lines[start].trim() === "") {
        start++;
    }
    if (start >= lines.length) {
        return [];
    }
    const head = lines[start].replace(/^\uFEFF/, "");
    const delimiter =
        options.delimiter ?? (head.includes("\t") ? "\t" : head.includes(",") ? "," : head.includes(";") ? ";" : "\t");
    const header = splitLine(head, delimiter).map((h) => h.trim());
    const lower = header.map((h) => h.toLowerCase());
    const find = (name: string) => lower.indexOf(name.toLowerCase());
    const timeIndex = options.timeColumn
        ? find(options.timeColumn)
        : (TIME_COLUMNS.map(find).find((i) => i >= 0) ?? -1);
    if (timeIndex < 0) {
        throw new Error(`parseCsv: no time column found in "${header.join(", ")}"`);
    }
    // output key per column: OHLCV fields are normalized to lowercase names
    const keys = header.map((h, i) => (i === timeIndex ? "time" : h));
    for (const field of FIELDS) {
        const i = find(options.columns?.[field] ?? field);
        if (i >= 0 && i !== timeIndex) {
            keys[i] = field;
        }
    }
    const parseTime = options.parseTime ?? parseTimeValue;
    const out: CsvBar[] = [];
    for (let r = start + 1; r < lines.length; r++) {
        const line = lines[r];
        if (line.trim() === "") {
            continue;
        }
        const cells = splitLine(line, delimiter);
        const time = parseTime(cells[timeIndex] ?? "");
        if (!Number.isFinite(time)) {
            continue;
        }
        const row: Record<string, number | string | undefined> = { time };
        for (let c = 0; c < keys.length; c++) {
            if (c === timeIndex) {
                continue;
            }
            const cell = (cells[c] ?? "").trim();
            if (cell !== "") {
                row[keys[c]] = NUMERIC.test(cell) ? Number(cell) : cell;
            }
        }
        const close = typeof row.close === "number" ? row.close : undefined;
        if (close === undefined) {
            continue;
        }
        for (const field of ["open", "high", "low"] as const) {
            if (typeof row[field] !== "number") {
                row[field] = close;
            }
        }
        if (typeof row.volume !== "number") {
            delete row.volume;
        }
        out.push(row as CsvBar);
    }
    return options.sort === false ? out : sortBars(out);
}
