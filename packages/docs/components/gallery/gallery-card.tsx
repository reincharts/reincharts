import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ExampleView } from "@/components/preview/example-view";
import { readExample } from "@/components/preview/read-example";
import { CodeDialog } from "./code-dialog";

export interface GalleryItem {
    /** Example file name in examples/. */
    name: string;
    title: string;
    description: string;
    /** Example page with the full write-up. */
    href: string;
}

/** A live chart card with a title, a docs link and a "View code" dialog (shadcn /charts style). */
export function GalleryCard({ item, height = 280 }: { item: GalleryItem; height?: number }) {
    const code = readExample(item.name, "GalleryCard");
    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-background shadow-xs">
            <div className="flex flex-col gap-0.5 px-4 pt-4 pb-3">
                <h3 className="text-sm font-medium text-fd-foreground">{item.title}</h3>
                <p className="text-xs text-fd-muted-foreground">{item.description}</p>
            </div>
            <ExampleView name={item.name} height={height} />
            <div className="mt-auto flex items-center justify-between border-t border-fd-border px-2 py-1.5">
                <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
                >
                    Open example
                    <ArrowUpRight className="size-3.5" />
                </Link>
                <CodeDialog title={`${item.name}.tsx`}>
                    <ServerCodeBlock code={code} lang="tsx" themes={{ light: "github-light", dark: "github-dark" }} />
                </CodeDialog>
            </div>
        </div>
    );
}
