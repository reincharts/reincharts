import { createSearchAPI } from "fumadocs-core/search/server";
import { apiSource, examplesSource, source } from "@/lib/source";

// Exported as a static JSON file (out/search.json) and searched in the browser with Orama.
export const dynamic = "force-static";
export const revalidate = false;

const sections = [
    { name: "Docs", source, full: true },
    { name: "Examples", source: examplesSource, full: true },
    // API pages are found by title and headings (one per item); their tables would only bloat the index
    { name: "API", source: apiSource, full: false },
];

export const { staticGET: GET } = createSearchAPI("advanced", {
    indexes: sections.flatMap(({ name, source, full }) =>
        source.getPages().map((page) => ({
            id: page.url,
            url: page.url,
            title: page.data.title,
            description: page.data.description,
            breadcrumbs: [name],
            structuredData: full ? page.data.structuredData : { ...page.data.structuredData, contents: [] },
        })),
    ),
});
