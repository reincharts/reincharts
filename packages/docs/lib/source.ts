import { api, docs, examples } from "fumadocs-mdx:collections/server";
import { loader } from "fumadocs-core/source";

/** /docs: high-level guides. */
export const source = loader({ baseUrl: "/docs", source: docs.toFumadocsSource() });

/** /examples: live examples. */
export const examplesSource = loader({ baseUrl: "/examples", source: examples.toFumadocsSource() });

/** /api: the generated API reference. */
export const apiSource = loader({ baseUrl: "/api", source: api.toFumadocsSource() });

export type Section = typeof source | typeof examplesSource | typeof apiSource;
