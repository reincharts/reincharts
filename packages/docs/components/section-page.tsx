import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/notebook/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import type { Section } from "@/lib/source";

type Page = NonNullable<ReturnType<Section["getPage"]>>;

/** "See examples →" / "API reference →" / "Docs →" buttons under the page description. */
function PageLinks({ examples, api, docs }: { examples?: string; api?: string; docs?: string }) {
    const links = [
        docs && { href: docs, text: "Docs" },
        examples && { href: examples, text: "See examples" },
        api && { href: api, text: "API reference" },
    ].filter((l): l is { href: string; text: string } => !!l);
    if (!links.length) {
        return null;
    }
    return (
        <div className="not-prose -mt-1 flex flex-wrap gap-2">
            {links.map((l) => (
                <Link
                    key={l.href + l.text}
                    href={l.href}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-fd-border bg-fd-background px-2.5 text-xs font-medium text-fd-foreground shadow-xs transition-colors hover:bg-fd-accent"
                >
                    {l.text}
                    <ArrowRight className="size-3" />
                </Link>
            ))}
        </div>
    );
}

/** Shared page template of the /docs, /examples and /api sections. */
export function SectionPage({ source, page }: { source: Section; page: Page | undefined }) {
    if (!page) {
        notFound();
    }
    const MDX = page.data.body;
    const { examples, api, docs } = page.data as { examples?: string; api?: string; docs?: string };
    return (
        <DocsPage toc={page.data.toc} full={page.data.full}>
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
            <PageLinks examples={examples} api={api} docs={docs} />
            <DocsBody>
                <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
            </DocsBody>
        </DocsPage>
    );
}

export function sectionMetadata(page: Page | undefined, section: string): Metadata {
    if (!page) {
        notFound();
    }
    const description = page.data.description ?? section;
    return {
        title: page.data.title,
        description,
        alternates: { canonical: page.url },
        // child metadata replaces the root openGraph object, so repeat the site fields
        openGraph: {
            title: `${page.data.title} — Reincharts`,
            description,
            url: page.url,
            siteName: "Reincharts",
            type: "article",
        },
    };
}
