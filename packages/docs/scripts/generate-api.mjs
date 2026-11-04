// Generates the API reference (content/api/**) from the public exports of every @reincharts/* package.
//
// For each package it opens src/index.ts with the TypeScript compiler API, enumerates every export and
// sorts it into components, hooks, classes, functions, constants and types. It then writes:
//   content/api/index.mdx                      overview of all packages
//   content/api/<pkg>/index.mdx                package overview: install, import, every export with a link
//   content/api/<pkg>/<component>.mdx          one page per component / hook / class (props via <AutoTypeTable>)
//   content/api/<pkg>/{functions,constants,types}.mdx   one section (anchor) per item
//   content/api/**/meta.json                   sidebar order
// Output is deterministic (sorted, no timestamps) and files are only written when their content changes;
// stale files are removed. Run with `node scripts/generate-api.mjs` (also part of scripts/generate.mjs).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ts = createRequire(join(root, "package.json"))("typescript");

/** Packages in sidebar order, with a short label for the overview. */
const packages = [
    { id: "core", label: "Chart engine, ChartCanvas, panes, scales, hooks and themes" },
    { id: "series", label: "Chart types: line, area, bars, scatter, candlesticks and more" },
    { id: "axes", label: "XAxis, YAxis and Grid" },
    { id: "coordinates", label: "Crosshair, last-value labels and price lines" },
    { id: "tooltip", label: "Legends and tooltips" },
    { id: "annotations", label: "Reference lines and areas, markers, labels, watermarks" },
    { id: "interactive", label: "Drawing tools, brush and zoom controls" },
    { id: "indicators", label: "Indicator calculators, bar transforms and indicator components" },
    { id: "datafeed", label: "Datafeed adapters, realtime updates, aggregation and replay" },
    { id: "widget", label: "The batteries-included <TradingChart> component" },
];

const outDir = join(root, "content/api");
const F = ts.TypeFormatFlags;

// ------------------------------------------------------------------ helpers
const kebab = (name) =>
    name
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
        .toLowerCase();

/** Escapes JSDoc text for MDX (outside of `code spans`). */
const mdText = (s) =>
    s
        .replace(/\{@link(?:code|plain)?\s+([^}\s|]+)(?:[\s|]+([^}]*))?\}/g, (_, a, b) => "`" + (b?.trim() || a) + "`")
        .split(/(`[^`]*`)/g)
        .map((part, i) =>
            i % 2
                ? part
                : part
                      .replace(/[{}]/g, (c) => "\\" + c)
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;"),
        )
        .join("");

/** First sentence, without markdown, for frontmatter descriptions and summary tables. */
const summary = (doc) => {
    const text = doc
        .replace(/\{@link\s+([^}\s|]+)[^}]*\}/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
    const m = /^(.+?[.!?])(\s|$)/.exec(text);
    return (m ? m[1] : text).trim();
};
const plain = (s) => s.replace(/`/g, "");
const yaml = (s) => JSON.stringify(s);
const cell = (s) => mdText(s).replace(/\|/g, "\\|").replace(/\n+/g, " ");
const codeCell = (s) => "`" + s.replace(/\|/g, "\\|").replace(/`/g, "'").replace(/\s+/g, " ") + "`";

/** Splits a long `name(params): ret` signature onto several lines. */
const formatSignature = (head, sig) => {
    const one = head + sig;
    if (one.length <= 100) {
        return one;
    }
    // find the parameter list: first "(" at depth 0 (after type parameters)
    let depth = 0;
    let open = -1;
    for (let i = 0; i < sig.length; i++) {
        const c = sig[i];
        if (c === "<") depth++;
        else if (c === ">" && sig[i - 1] !== "=") depth--;
        else if (c === "(" && depth === 0) {
            open = i;
            break;
        }
    }
    if (open < 0) {
        return one;
    }
    depth = 0;
    let close = -1;
    const parts = [];
    let start = open + 1;
    for (let i = open; i < sig.length; i++) {
        const c = sig[i];
        if ("([{<".includes(c)) depth++;
        else if (")]}".includes(c) || (c === ">" && sig[i - 1] !== "=")) {
            depth--;
            if (depth === 0) {
                close = i;
                break;
            }
        } else if (c === "," && depth === 1) {
            parts.push(sig.slice(start, i).trim());
            start = i + 1;
        }
    }
    if (close < 0) {
        return one;
    }
    parts.push(sig.slice(start, close).trim());
    const params = parts.filter(Boolean);
    if (!params.length) {
        return one;
    }
    return `${head}${sig.slice(0, open)}(\n${params.map((p) => `    ${p},`).join("\n")}\n)${sig.slice(close + 1)}`;
};

// ------------------------------------------------------------------ program
const cfg = ts.getParsedCommandLineOfConfigFile(
    join(root, "tsconfig.json"),
    {},
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
);
const indexFiles = packages.map((p) => join(root, "..", p.id, "src/index.ts"));
const program = ts.createProgram(indexFiles, { ...cfg.options, noEmit: true, incremental: false });
const checker = program.getTypeChecker();

const docOf = (sym) => ts.displayPartsToString(sym.getDocumentationComment(checker)).trim();
const tagsOf = (sym) =>
    sym.getJsDocTags(checker).map((t) => ({ name: t.name, text: ts.displayPartsToString(t.text ?? []).trim() }));
const rel = (file) => relative(root, file).split("\\").join("/");

/** Whether `name` is exported from the module of `file` (AutoTypeTable resolves names per file). */
const fileExports = new Map();
const exportedFrom = (file, name) => {
    if (!fileExports.has(file)) {
        const sf = program.getSourceFile(file);
        const mod = sf && checker.getSymbolAtLocation(sf);
        fileExports.set(file, new Set(mod ? checker.getExportsOfModule(mod).map((s) => s.name) : []));
    }
    return fileExports.get(file).has(name);
};

/** `path` + `name` for <AutoTypeTable>: the declaring file when possible (precise cache keys). */
const tableRef = (item) => {
    const file = item.decl.getSourceFile().fileName;
    if (exportedFrom(file, item.localName)) {
        return { path: rel(file), name: item.localName };
    }
    return { path: rel(item.indexFile), name: item.name };
};

const isObjectType = (t) => {
    if (t.getCallSignatures().length || t.getConstructSignatures().length) {
        return false;
    }
    if (t.flags & ts.TypeFlags.Intersection) {
        return t.types.every(isObjectType);
    }
    return !!(t.flags & ts.TypeFlags.Object) && checker.getPropertiesOfType(t).length > 0;
};

const declText = (decl) =>
    decl
        .getText()
        .replace(/^export\s+(declare\s+)?/, "")
        .replace(/^(\s*)readonly /gm, "$1readonly ");

// ------------------------------------------------------------------ derived descriptions
// Families of constants built by factories (drawing tools, indicator definitions) have no JSDoc of their own, but
// their initializers say what they are: read the string literals passed to the factory.
const humanize = (name) => {
    const words = kebab(name).split("-");
    return [words[0][0].toUpperCase() + words[0].slice(1), ...words.slice(1)].join(" ");
};
const literals = (init) => {
    const out = { strings: [] };
    while (
        init &&
        (ts.isAsExpression(init) || ts.isParenthesizedExpression(init) || ts.isSatisfiesExpression?.(init))
    ) {
        init = init.expression;
    }
    if (!init || !ts.isCallExpression(init)) {
        return out;
    }
    for (const arg of init.arguments) {
        if (ts.isStringLiteralLike(arg)) {
            out.strings.push(arg.text);
        } else if (ts.isObjectLiteralExpression(arg)) {
            for (const p of arg.properties) {
                if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && ts.isStringLiteralLike(p.initializer)) {
                    out[p.name.text] = p.initializer.text;
                }
            }
        }
    }
    return out;
};
/** A description for an undocumented constant of a known family, or "". */
const derivedDoc = (name, decl, type) => {
    if (!ts.isVariableDeclaration(decl)) {
        return "";
    }
    const init = decl.initializer;
    if (type === "ToolDefinition") {
        const l = literals(init);
        const toolType = l.type ?? l.strings[0] ?? name;
        const label = l.label ?? l.strings[1] ?? humanize(name);
        return `The ${label} drawing tool (\`type: "${toolType}"\`).`;
    }
    if (/^IndicatorDefinition\b/.test(type)) {
        const l = literals(init);
        const id = l.id ?? l.strings[0];
        const title = l.name ?? l.strings[1] ?? humanize(name);
        const description = l.description ?? l.strings.filter((x) => /\.$/.test(x)).pop();
        return `${title} indicator definition${id ? ` (\`indicators.${id}\`)` : ""}.${description ? ` ${description}` : ""}`;
    }
    if (/^(readonly )?ToolDefinition\[\]$/.test(type) && init && ts.isArrayLiteralExpression(init)) {
        const names = init.elements.filter(ts.isIdentifier).map((e) => "`" + e.text + "`");
        return names.length ? `Drawing tools of one toolbar group: ${names.join(", ")}.` : "";
    }
    if (type === "Theme") {
        return `The built-in ${name.replace(/Theme$/, "")} theme.`;
    }
    return "";
};

// ------------------------------------------------------------------ collect
const all = new Map(); // name -> item (first package wins)
const byPackage = new Map();

for (const [i, pkg] of packages.entries()) {
    const sf = program.getSourceFile(indexFiles[i]);
    const mod = checker.getSymbolAtLocation(sf);
    const items = [];
    for (const exp of checker.getExportsOfModule(mod)) {
        const sym = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
        const decl = sym.declarations?.[0];
        if (!decl) {
            continue;
        }
        const name = exp.name;
        const item = {
            name,
            localName: sym.name,
            pkg: pkg.id,
            sym,
            decl,
            indexFile: indexFiles[i],
            doc: docOf(sym) || docOf(exp),
            tags: tagsOf(sym),
        };
        if (ts.isClassDeclaration(decl)) {
            item.kind = "class";
        } else if (ts.isInterfaceDeclaration(decl) || ts.isTypeAliasDeclaration(decl)) {
            item.kind = "type";
            const t = checker.getDeclaredTypeOfSymbol(sym);
            item.table =
                (ts.isInterfaceDeclaration(decl) || isObjectType(t)) && checker.getPropertiesOfType(t).length > 0;
        } else if (ts.isEnumDeclaration(decl)) {
            item.kind = "type";
            item.table = false;
        } else {
            const t = checker.getTypeOfSymbolAtLocation(sym, decl);
            item.signatures = t.getCallSignatures();
            if (!item.signatures.length) {
                item.kind = "constant";
                item.type = checker.typeToString(t, decl);
                item.doc ||= derivedDoc(name, decl, item.type);
            } else if (/^use[A-Z]/.test(name)) {
                item.kind = "hook";
            } else if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
                item.kind = "maybe-component"; // ALLCAPS: a component only when <Name>Props exists (RSI, MACD...)
            } else if (/^[A-Z]/.test(name)) {
                item.kind = "component";
            } else {
                item.kind = "function";
            }
        }
        items.push(item);
        if (!all.has(name)) {
            all.set(name, item);
        }
    }
    const names = new Set(items.map((x) => x.name));
    for (const item of items) {
        // undocumented `<Name>Props` of a component
        const component = item.kind === "type" && !item.doc && /^(.+)Props$/.exec(item.name)?.[1];
        if (component && names.has(component)) {
            item.doc = `Props of the \`${component}\` component.`;
        }
        if (item.kind === "maybe-component") {
            item.kind = names.has(`${item.name}Props`) ? "component" : "function";
        }
    }
    byPackage.set(pkg.id, items);
}

/** The props type of a component: `<Name>Props`, else the named type of its first parameter. */
const propsOf = (item, items) => {
    const own = items.find((x) => x.name === `${item.name}Props` && x.kind === "type");
    if (own) {
        return own;
    }
    const sig = item.signatures?.[0];
    const param = sig?.parameters[0];
    if (!param) {
        return undefined;
    }
    const t = checker.getTypeOfSymbolAtLocation(param, item.decl);
    const named = t.aliasSymbol?.name ?? t.symbol?.name;
    const found = named && all.get(named);
    return found && found.kind === "type" ? found : undefined;
};

/** Exported type aliases by type identity, e.g. `DrawingController = ReturnType<typeof createDrawingController>`. */
const aliasByType = new Map();
for (const item of all.values()) {
    if (item.kind === "type" && ts.isTypeAliasDeclaration(item.decl)) {
        const t = checker.getDeclaredTypeOfSymbol(item.sym);
        if (!aliasByType.has(t)) aliasByType.set(t, item.name);
    }
}

const signatureText = (item) =>
    item.signatures
        .map((sig) => {
            let text = checker.signatureToString(sig, item.decl, F.NoTruncation | F.WriteTypeArgumentsOfSignature);
            // print an inferred return type by the exported alias naming it instead of the expanded object
            const ret = sig.getReturnType();
            const alias = aliasByType.get(ret);
            const retText = checker.typeToString(ret, item.decl, F.NoTruncation);
            if (alias && text.endsWith(retText)) {
                text = text.slice(0, -retText.length) + alias;
            }
            return formatSignature(`function ${item.name}`, text);
        })
        .join("\n");

// ------------------------------------------------------------------ cross links (examples + docs pages)
const exampleUsage = new Map(); // export name -> Set(example file)
for (const file of readdirSync(join(root, "examples")).sort()) {
    if (!file.endsWith(".tsx")) continue;
    const src = readFileSync(join(root, "examples", file), "utf8");
    for (const m of src.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"@reincharts\/[a-z]+"/g)) {
        for (const spec of m[1].split(",")) {
            const n = spec
                .replace(/^\s*type\s+/, "")
                .split(/\s+as\s+/)[0]
                .trim();
            if (!n) continue;
            if (!exampleUsage.has(n)) exampleUsage.set(n, new Set());
            exampleUsage.get(n).add(file.slice(0, -4));
        }
    }
}

const walk = (dir) =>
    existsSync(dir)
        ? readdirSync(dir)
              .sort()
              .flatMap((f) => {
                  const p = join(dir, f);
                  return statSync(p).isDirectory() ? walk(p) : p.endsWith(".mdx") ? [p] : [];
              })
        : [];
const frontmatter = (src) => {
    const m = /^---\n([\s\S]*?)\n---/.exec(src);
    const out = {};
    for (const line of m ? m[1].split("\n") : []) {
        const kv = /^(\w+):\s*(.*)$/.exec(line);
        if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
    }
    return out;
};
const pageUrl = (base, dir, file) => {
    const slug = relative(dir, file)
        .replace(/\.mdx$/, "")
        .replace(/(^|\/)index$/, "");
    return slug ? `${base}/${slug}` : base;
};

const examplePages = new Map(); // example file -> [{title, url}]
const exampleDir = join(root, "content/examples");
for (const file of walk(exampleDir)) {
    const src = readFileSync(file, "utf8");
    const { title } = frontmatter(src);
    for (const m of src.matchAll(/<ComponentPreview[^>]*name="([^"]+)"/g)) {
        if (!examplePages.has(m[1])) examplePages.set(m[1], []);
        examplePages.get(m[1]).push({ title, url: pageUrl("/examples", exampleDir, file) });
    }
}
const docsPages = new Map(); // api url -> [{title, url}]
const docsDir = join(root, "content/docs");
for (const file of walk(docsDir)) {
    const fm = frontmatter(readFileSync(file, "utf8"));
    if (fm.api) {
        if (!docsPages.has(fm.api)) docsPages.set(fm.api, []);
        docsPages.get(fm.api).push({ title: fm.title, url: pageUrl("/docs", docsDir, file) });
    }
}

const seeAlso = (item, url) => {
    const examples = new Map();
    for (const ex of [...(exampleUsage.get(item.name) ?? [])].sort()) {
        for (const page of examplePages.get(ex) ?? []) {
            examples.set(page.url, page.title);
        }
    }
    const guides = docsPages.get(url) ?? [];
    if (!examples.size && !guides.length) {
        return "";
    }
    const lines = ["## See also", ""];
    for (const g of guides) lines.push(`- [${g.title}](${g.url}) (guide)`);
    for (const [u, t] of [...examples].slice(0, 8)) lines.push(`- [${t}](${u}) (example)`);
    return lines.join("\n") + "\n";
};

// ------------------------------------------------------------------ render
const files = new Map(); // relative path in content/api -> content
const header = (title, description) =>
    `---\ntitle: ${yaml(title)}\ndescription: ${yaml(description)}\n---\n\n{/* Generated by scripts/generate-api.mjs. Do not edit by hand. */}\n\n`;
const importLine = (item, type = false) =>
    "```tsx\nimport " + (type ? "type " : "") + `{ ${item.name} } from "@reincharts/${item.pkg}";\n` + "```\n";
const normalize = (s) => plain(s).replace(/\s+/g, " ").trim();
const docBlock = (item, { skipSummary = false } = {}) => {
    const parts = [];
    // pages already show the first sentence as their description
    if (item.doc && !(skipSummary && normalize(item.doc) === normalize(summary(item.doc))))
        parts.push(mdText(item.doc));
    const deprecated = item.tags.find((t) => t.name === "deprecated");
    if (deprecated) parts.push(`<Callout type="warn">Deprecated. ${mdText(deprecated.text)}</Callout>`);
    return parts.length ? parts.join("\n\n") + "\n\n" : "";
};
const autoTable = (item) => {
    const ref = tableRef(item);
    return `<AutoTypeTable path="${ref.path}" name="${ref.name}" />\n`;
};
const paramsTable = (item) => {
    const sig = item.signatures?.[0];
    const params = sig?.parameters ?? [];
    if (!params.length) return "";
    const docs = new Map(
        item.tags
            .filter((t) => t.name === "param")
            .map((t) => {
                const m = /^(\S+)\s*-?\s*([\s\S]*)$/.exec(t.text);
                return m ? [m[1], m[2]] : [t.text, ""];
            }),
    );
    const described = params.map((p) => [p, docs.get(p.name) || docOf(p)]);
    const ret = item.tags.find((t) => t.name === "returns" || t.name === "return");
    if (!ret && described.every(([, d]) => !d)) return "";
    const rows = described.map(([p, desc]) => {
        const decl = p.valueDeclaration;
        const optional = decl && (decl.questionToken || decl.initializer) ? "?" : "";
        const type = checker.typeToString(checker.getTypeOfSymbolAtLocation(p, item.decl), item.decl);
        return `| \`${p.name}${optional}\` | ${codeCell(type)} | ${cell(desc)} |`;
    });
    const out = ["| Parameter | Type | Description |", "| --- | --- | --- |", ...rows].join("\n") + "\n";
    return out + (ret ? `\n**Returns** ${mdText(ret.text)}\n` : "");
};
const signatureBlock = (item) => "```ts\n" + signatureText(item) + "\n```\n";

const pkgStats = [];
for (const pkg of packages) {
    const items = byPackage
        .get(pkg.id)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "en"));
    const components = items.filter((x) => x.kind === "component");
    const hooks = items.filter((x) => x.kind === "hook");
    const classes = items.filter((x) => x.kind === "class");
    const functions = items.filter((x) => x.kind === "function");
    const constants = items.filter((x) => x.kind === "constant");
    const used = new Set();

    const pageOf = new Map(); // name -> url (+ anchor)
    const base = `/api/${pkg.id}`;
    for (const x of [...components, ...hooks, ...classes]) pageOf.set(x.name, `${base}/${kebab(x.name)}`);

    // component pages
    for (const c of components) {
        const props = propsOf(c, items);
        const url = pageOf.get(c.name);
        let body = header(c.name, plain(summary(c.doc)) || `The ${c.name} component.`);
        body += importLine(c) + "\n" + docBlock(c, { skipSummary: true });
        if (props) {
            used.add(props.name);
            pageOf.set(props.name, `${url}#props`);
            body += `## Props\n\n${autoTable(props)}\n`;
        } else {
            body += `## Signature\n\n${signatureBlock(c)}\n${paramsTable(c)}\n`;
        }
        body += seeAlso(c, url);
        files.set(`${pkg.id}/${kebab(c.name)}.mdx`, body);
    }

    // hook pages (with their Use<Hook>Options / Result types)
    for (const h of hooks) {
        const url = pageOf.get(h.name);
        const prefix = h.name[0].toUpperCase() + h.name.slice(1);
        const related = items.filter((x) => x.kind === "type" && x.name.startsWith(prefix));
        let body = header(h.name, plain(summary(h.doc)) || `The ${h.name} hook.`);
        body += importLine(h) + "\n" + docBlock(h, { skipSummary: true });
        body += `## Signature\n\n${signatureBlock(h)}\n${paramsTable(h)}\n`;
        for (const r of related) {
            used.add(r.name);
            pageOf.set(r.name, `${url}#${r.name.toLowerCase()}`);
            body += `## ${r.name}\n\n${docBlock(r)}${r.table ? autoTable(r) : "```ts\n" + declText(r.decl) + "\n```\n"}\n`;
        }
        body += seeAlso(h, url);
        files.set(`${pkg.id}/${kebab(h.name)}.mdx`, body);
    }

    // class pages
    for (const c of classes) {
        let body = header(c.name, plain(summary(c.doc)) || `The ${c.name} class.`);
        body += importLine(c) + "\n" + docBlock(c, { skipSummary: true });
        const ctor = checker.getTypeOfSymbolAtLocation(c.sym, c.decl).getConstructSignatures()[0];
        if (ctor) {
            const text = checker.signatureToString(ctor, c.decl, F.NoTruncation);
            body +=
                "## Constructor\n\n```ts\n" +
                formatSignature(`new ${c.name}`, text.replace(/:\s*[^:]+$/, "")) +
                "\n```\n\n";
        }
        body += `## Members\n\n${autoTable(c)}\n`;
        body += seeAlso(c, pageOf.get(c.name));
        files.set(`${pkg.id}/${kebab(c.name)}.mdx`, body);
    }

    // functions page
    if (functions.length) {
        let body = header("Functions", `Functions exported by @reincharts/${pkg.id}.`);
        body +=
            "```tsx\nimport { " +
            functions
                .slice(0, 3)
                .map((f) => f.name)
                .join(", ") +
            `${functions.length > 3 ? ", ..." : ""} } from "@reincharts/${pkg.id}";\n` +
            "```\n\n";
        for (const f of functions) {
            pageOf.set(f.name, `${base}/functions#${f.name.toLowerCase()}`);
            body += `## ${f.name}\n\n${docBlock(f)}${signatureBlock(f)}\n${paramsTable(f)}\n`;
        }
        files.set(`${pkg.id}/functions.mdx`, body);
    }

    // constants page
    if (constants.length) {
        let body = header("Constants", `Constants and presets exported by @reincharts/${pkg.id}.`);
        for (const c of constants) {
            pageOf.set(c.name, `${base}/constants#${c.name.toLowerCase()}`);
            body += `## ${c.name}\n\n${docBlock(c)}` + "```ts\nconst " + `${c.name}: ${c.type}` + "\n```\n\n";
        }
        files.set(`${pkg.id}/constants.mdx`, body);
    }

    // types page
    const types = items.filter((x) => x.kind === "type" && !used.has(x.name));
    if (types.length) {
        let body = header("Types", `Interfaces and type aliases exported by @reincharts/${pkg.id}.`);
        body +=
            "```tsx\nimport type { " +
            types
                .slice(0, 3)
                .map((t) => t.name)
                .join(", ") +
            `${types.length > 3 ? ", ..." : ""} } from "@reincharts/${pkg.id}";\n` +
            "```\n\n";
        for (const t of types) {
            pageOf.set(t.name, `${base}/types#${t.name.toLowerCase()}`);
            body += `## ${t.name}\n\n${docBlock(t)}${t.table ? autoTable(t) : "```ts\n" + declText(t.decl) + "\n```\n"}\n`;
        }
        files.set(`${pkg.id}/types.mdx`, body);
    }

    // package overview
    const list = (title, xs) =>
        xs.length
            ? `## ${title}\n\n| Name | Description |\n| --- | --- |\n${xs
                  .map((x) => `| [${x.name}](${pageOf.get(x.name)}) | ${cell(summary(x.doc))} |`)
                  .join("\n")}\n\n`
            : "";
    const typesAll = items.filter((x) => x.kind === "type");
    let index = header(`@reincharts/${pkg.id}`, `${pkg.label}.`);
    index += "```npm\nnpm install @reincharts/" + pkg.id + "\n```\n\n";
    index += "Everything here is also re-exported by the umbrella package `reincharts`.\n\n";
    index += list("Components", components) + list("Hooks", hooks) + list("Classes", classes);
    index += list("Functions", functions) + list("Constants", constants) + list("Types", typesAll);
    files.set(`${pkg.id}/index.mdx`, index);

    const sep = (title, xs) => (xs.length ? [`---${title}---`, ...xs.map((x) => kebab(x.name))] : []);
    const reference = [
        functions.length && "functions",
        constants.length && "constants",
        types.length && "types",
    ].filter(Boolean);
    files.set(
        `${pkg.id}/meta.json`,
        JSON.stringify(
            {
                title: `@reincharts/${pkg.id}`,
                pages: [
                    ...sep("Components", components),
                    ...sep("Hooks", hooks),
                    ...sep("Classes", classes),
                    ...(reference.length ? ["---Reference---", ...reference] : []),
                ],
            },
            null,
            2,
        ) + "\n",
    );
    pkgStats.push({
        pkg,
        description: pkg.label,
        counts: {
            components: components.length,
            hooks: hooks.length,
            classes: classes.length,
            functions: functions.length,
            constants: constants.length,
            types: typesAll.length,
        },
        total: items.length,
    });
}

// root overview + sidebar
{
    let body = header("API reference", "Every public component, hook, function and type of every Reincharts package.");
    body += `This reference is generated from the TypeScript sources and JSDoc comments of each package, so it always
matches the code. Import from the individual packages (recommended, as shown on every page) or from the umbrella
package \`reincharts\`, which re-exports all of them.\n\n`;
    body +=
        "| Package | Contents | Components | Hooks | Functions | Types |\n| --- | --- | ---: | ---: | ---: | ---: |\n";
    for (const s of pkgStats) {
        body += `| [@reincharts/${s.pkg.id}](/api/${s.pkg.id}) | ${cell(s.pkg.label)} | ${s.counts.components} | ${s.counts.hooks} | ${s.counts.functions} | ${s.counts.types} |\n`;
    }
    files.set("index.mdx", body + "\n");
    files.set(
        "meta.json",
        JSON.stringify(
            { title: "API reference", pages: ["index", "---Packages---", ...packages.map((p) => p.id)] },
            null,
            2,
        ) + "\n",
    );
}

// ------------------------------------------------------------------ write
const existing = (dir) =>
    existsSync(dir)
        ? readdirSync(dir).flatMap((f) => {
              const p = join(dir, f);
              return statSync(p).isDirectory() ? existing(p) : [p];
          })
        : [];
let written = 0;
let removed = 0;
for (const [file, content] of files) {
    const path = join(outDir, file);
    if (existsSync(path) && readFileSync(path, "utf8") === content) continue;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    written++;
}
for (const path of existing(outDir)) {
    if (!files.has(relative(outDir, path).split("\\").join("/"))) {
        rmSync(path);
        removed++;
    }
}
const totals = pkgStats.reduce(
    (a, s) => {
        for (const k in s.counts) a[k] = (a[k] ?? 0) + s.counts[k];
        a.total += s.total;
        return a;
    },
    { total: 0 },
);
console.log(
    `[generate-api] ${files.size} files (${written} written, ${removed} removed) for ${totals.total} exports: ` +
        Object.entries(totals)
            .filter(([k]) => k !== "total")
            .map(([k, v]) => `${v} ${k}`)
            .join(", "),
);
