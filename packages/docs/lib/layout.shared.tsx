import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import type * as PageTree from "fumadocs-core/page-tree";
import type { CSSProperties, ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { navLinks } from "./site";

/** Section links, used by the sidebar drawer on mobile (the desktop navbar is `<SiteHeader>`). */
export function baseOptions(): BaseLayoutProps {
    return {
        links: navLinks.map((l) => ({ text: l.text, url: l.href, active: "nested-url" as const })),
        themeSwitch: { enabled: false },
    };
}

/**
 * Layout of the three sidebar sections (/docs, /examples, /api): the shared `<SiteHeader>` on top and
 * the section's own page tree in the left sidebar.
 */
export function SectionLayout({ tree, children }: { tree: PageTree.Root; children: ReactNode }) {
    return (
        <DocsLayout
            {...baseOptions()}
            tree={tree}
            nav={{ mode: "top", component: <SiteHeader sidebar /> }}
            sidebar={{ collapsible: false }}
            searchToggle={{ enabled: false }}
            tabs={false}
            containerProps={{ style: { "--fd-header-height": "3.5rem" } as CSSProperties }}
        >
            {children}
        </DocsLayout>
    );
}
