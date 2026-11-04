// Minimal static server for the exported site (out/), resolving clean URLs like GitHub Pages:
// /docs/quick-start -> out/docs/quick-start.html. Usage: node scripts/serve.mjs [port]
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".txt": "text/plain; charset=utf-8",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
};

const resolve = (pathname) => {
    const base = normalize(join(root, decodeURIComponent(pathname)));
    if (!base.startsWith(root)) {
        return undefined;
    }
    for (const candidate of [base, `${base}.html`, join(base, "index.html")]) {
        if (existsSync(candidate) && statSync(candidate).isFile()) {
            return candidate;
        }
    }
    return undefined;
};

/** Starts the server and resolves with it once listening. */
export function serve(port = 4321) {
    const server = createServer((req, res) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const file = resolve(url.pathname) ?? join(root, "404.html");
        res.writeHead(file.endsWith("404.html") && url.pathname !== "/404" ? 404 : 200, {
            "content-type": types[extname(file)] ?? "application/octet-stream",
        });
        createReadStream(file).pipe(res);
    });
    return new Promise((done) => server.listen(port, () => done(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const port = Number(process.argv[2] ?? 4321);
    await serve(port);
    console.log(`serving out/ at http://localhost:${port}`);
}
