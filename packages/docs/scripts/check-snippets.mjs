// Typechecks the ```tsx / ```ts code blocks of content/docs and content/examples against the real package types.
//
// Every block becomes a file in .snippets/ (gitignored):
//   - blocks with their own `import` lines are checked as modules, as written;
//   - other blocks get an import of every export of every @reincharts/* package (and the React hooks) prepended;
//   - blocks made only of JSX elements (`<LineSeries ... />` lines) are wrapped in a fragment first.
// Free variables used by the snippets (`data`, `bars`, `feed`...) are declared in SNIPPET_GLOBALS below.
// A block whose info string contains `nocheck` (```tsx nocheck) is skipped.
// Run with `node scripts/check-snippets.mjs` (part of `pnpm typecheck`). Exits with 1 on type errors.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const ts = require("typescript");
const outDir = join(root, ".snippets");
const packages = [
    "core",
    "series",
    "axes",
    "coordinates",
    "tooltip",
    "annotations",
    "interactive",
    "indicators",
    "datafeed",
    "widget",
];

/** Names the snippets use without defining them. */
const SNIPPET_GLOBALS = `
type DemoBar = { date: Date; open: number; high: number; low: number; close: number; volume: number };
declare const data: any[];
declare const bars: DemoBar[];
declare const points: import("@reincharts/interactive").DrawingPoint[];
declare const traffic: { date: Date; sessions: number; signups: number }[];
declare const readings: { date: Date; value: number }[];
declare const mode: "index" | "linear";
declare const breadth: { date: Date; value: number }[];
declare const symbol: string;
declare const resolution: string;
declare const feed: import("@reincharts/datafeed").Datafeed;
declare const drawings: import("@reincharts/interactive").DrawingController;
declare const saved: import("@reincharts/widget").TradingChartState;
declare const initial: readonly import("@reincharts/interactive").Drawing[];
declare const percentB: import("@reincharts/indicators").IndicatorDefinition;
declare const myTheme: import("@reincharts/core").Theme;
declare const launchStart: Date;
declare const launchEnd: Date;
declare const peak: { date: Date; value: number };
declare const shapes: ("circle" | "square" | "triangle")[];
declare const a: import("@reincharts/interactive").DrawingPoint;
declare const b: import("@reincharts/interactive").DrawingPoint;
declare const id: string;
declare const chart: { current: import("@reincharts/core").ChartEngine | null };
declare const api: { saveLayout(json: string): Promise<void>; loadLayout(): Promise<string> };
declare function setBars(bars: DemoBar[]): void;
declare function fetchBefore(time: number): Promise<DemoBar[]>;
declare function notify(message: string): void;
declare function useColorScheme(): "light" | "dark";
type Point = { x: number; y: number; group: number };
type Quote = { date: Date; o: number; h: number; l: number; last: number };
type Bar = DemoBar;
declare module "@/components/price-chart" {
    const PriceChart: import("react").ComponentType;
    export default PriceChart;
}
`;

// ------------------------------------------------------------------ exports of every package
const indexFiles = packages.map((p) => join(root, "..", p, "src/index.ts"));
const program = ts.createProgram(indexFiles, {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    allowImportingTsExtensions: true,
    noEmit: true,
    skipLibCheck: true,
});
const checker = program.getTypeChecker();
const exportsOf = new Map(); // package -> { values: string[], types: string[] }
for (const [i, pkg] of packages.entries()) {
    const mod = checker.getSymbolAtLocation(program.getSourceFile(indexFiles[i]));
    const values = [];
    const types = [];
    for (const exp of checker.getExportsOfModule(mod)) {
        const sym = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
        (sym.flags & ts.SymbolFlags.Value ? values : types).push(exp.name);
    }
    exportsOf.set(pkg, { values, types });
}
const reactValues = ["useCallback", "useEffect", "useMemo", "useRef", "useState"];

// ------------------------------------------------------------------ collect code blocks
const walk = (dir) =>
    readdirSync(dir)
        .sort()
        .flatMap((f) => {
            const p = join(dir, f);
            return statSync(p).isDirectory() ? walk(p) : p.endsWith(".mdx") ? [p] : [];
        });

const blocks = [];
for (const section of ["docs", "examples"]) {
    for (const file of walk(join(root, "content", section))) {
        const lines = readFileSync(file, "utf8").split("\n");
        for (let i = 0; i < lines.length; i++) {
            const open = /^```(tsx|ts)\b(.*)$/.exec(lines[i]);
            if (!open) continue;
            const start = i + 1;
            let end = start;
            while (end < lines.length && !lines[end].startsWith("```")) end++;
            if (!open[2].includes("nocheck")) {
                blocks.push({ file: relative(root, file), line: start + 1, code: lines.slice(start, end).join("\n") });
            }
            i = end;
        }
    }
}

// ------------------------------------------------------------------ write files
/** Names a block (or SNIPPET_GLOBALS) declares or imports itself: left out of the generated imports. */
const declared = (code) => {
    const names = [...code.matchAll(/\b(?:interface|type|const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)].map(
        (m) => m[1],
    );
    for (const m of code.matchAll(/^import\s+(?:type\s+)?(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?/gm)) {
        if (m[1]) names.push(m[1]);
        for (const spec of (m[2] ?? "").split(",")) {
            const n = spec
                .replace(/^\s*type\s+/, "")
                .split(/\s+as\s+/)
                .pop()
                .trim();
            if (n) names.push(n);
        }
    }
    return new Set(names);
};
const globalNames = declared(SNIPPET_GLOBALS);

/** Blocks of sibling JSX elements: turn `// comments` into JSX comments and wrap them in a fragment. */
const wrapJsx = (code) =>
    "export const __snippet = (\n<>\n" +
    code
        .replace(/;\s*$/, "")
        .split("\n")
        .map((l) =>
            l.replace(/^(\s*<.*?>)\s*\/\/\s*(.*)$/, "$1{/* $2 */}").replace(/^(\s*)\/\/\s*(.*)$/, "$1{/* $2 */}"),
        )
        .join("\n") +
    "\n</>\n);\n";

const preamble = (code) => {
    const own = new Set([...declared(code), ...globalNames]);
    const lines = [];
    for (const pkg of packages) {
        const { values, types } = exportsOf.get(pkg);
        const v = values.filter((n) => !own.has(n));
        const t = types.filter((n) => !own.has(n));
        if (v.length) lines.push(`import { ${v.join(", ")} } from "@reincharts/${pkg}";`);
        if (t.length) lines.push(`import type { ${t.join(", ")} } from "@reincharts/${pkg}";`);
    }
    lines.push(`import { ${reactValues.filter((n) => !own.has(n)).join(", ")} } from "react";`);
    return lines.join("\n") + "\n";
};

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const sources = new Map(); // snippet file -> { file, line, offset }
for (const [n, block] of blocks.entries()) {
    const name = `snippet-${String(n).padStart(3, "0")}.tsx`;
    let code = block.code;
    let header = "";
    if (!/^import\s/m.test(code)) {
        if (/^\s*</.test(code.replace(/^\s*\/\/.*\n/gm, ""))) {
            code = wrapJsx(code);
            header = preamble(block.code) + "export {};\n";
        } else {
            header = preamble(code) + "export {};\n";
        }
    } else {
        // the imports a block shows are often partial (ChartCanvas, Pane... are assumed): add the others
        header = preamble(code) + "export {};\n";
    }
    const offset = header.split("\n").length - 1 + (code === block.code ? 0 : 2);
    writeFileSync(join(outDir, name), header + code + "\n");
    sources.set(name, { ...block, offset });
}
writeFileSync(join(outDir, "globals.d.ts"), SNIPPET_GLOBALS);
writeFileSync(
    join(outDir, "tsconfig.json"),
    JSON.stringify(
        {
            extends: "../tsconfig.json",
            compilerOptions: { incremental: false, plugins: [], noUnusedLocals: false, noUnusedParameters: false },
            include: ["*.tsx", "globals.d.ts", "../next-env.d.ts"],
            // the docs tsconfig excludes .snippets (so the site typecheck skips it); don't inherit that here
            exclude: [],
        },
        null,
        2,
    ),
);

// ------------------------------------------------------------------ typecheck
let output = "";
try {
    execFileSync(process.execPath, [require.resolve("typescript/bin/tsc"), "-p", outDir, "--pretty", "false"], {
        cwd: root,
        encoding: "utf8",
    });
} catch (e) {
    output = `${e.stdout ?? ""}${e.stderr ?? ""}`;
}
const errors = output
    .split("\n")
    .filter(Boolean)
    .map((l) => {
        const m = /\.snippets\/(snippet-\d+\.tsx)\((\d+),(\d+)\): (.*)$/.exec(l);
        if (!m) return l;
        const s = sources.get(m[1]);
        return `${s.file}:${s.line + Number(m[2]) - 1 - s.offset}  ${m[4]}  [${m[1]}]`;
    });
if (errors.length) {
    console.error(
        `[check-snippets] ${errors.length} error line(s) in ${blocks.length} code blocks:\n${errors.join("\n")}`,
    );
    process.exitCode = 1;
} else {
    console.log(`[check-snippets] ${blocks.length} code blocks typecheck`);
    if (!process.argv.includes("--keep")) rmSync(outDir, { recursive: true, force: true });
}
