import type { Metadata } from "next";
import Link from "next/link";
import { GalleryCard } from "@/components/gallery/gallery-card";
import { gallery, type GallerySection } from "@/lib/gallery";

const description =
    "Live, interactive charts built with Reincharts: lines, areas, bars, scatter and financial charts. Copy the code and make it yours.";

export const metadata: Metadata = {
    title: "Chart gallery",
    description,
    alternates: { canonical: "/gallery" },
    openGraph: {
        title: "Chart gallery — Reincharts",
        description,
        url: "/gallery",
        siteName: "Reincharts",
        type: "website",
    },
};

function Section({ section, level }: { section: GallerySection; level: 2 | 3 }) {
    const Heading = level === 2 ? "h2" : "h3";
    return (
        <section id={section.id} className={`${level === 2 ? "mt-14" : "mt-10"} scroll-mt-20`}>
            <div className="mb-6">
                <Heading
                    className={`font-semibold tracking-tight text-fd-foreground ${level === 2 ? "text-xl" : "text-lg"}`}
                >
                    {section.title}
                </Heading>
                <p className="mt-1 text-sm text-fd-muted-foreground">{section.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.items.map((item) => (
                    <GalleryCard key={item.name} item={item} />
                ))}
            </div>
            {section.subsections?.map((sub) => (
                <Section key={sub.id} section={sub} level={3} />
            ))}
        </section>
    );
}

export default function ChartsPage() {
    const chips = gallery.flatMap((s) => [s, ...(s.subsections ?? [])]);
    return (
        <main className="mx-auto flex w-full max-w-[97rem] flex-1 flex-col px-4 pt-12 pb-20 md:px-6 md:pt-16">
            <div className="flex flex-col items-start gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-fd-foreground sm:text-4xl">Chart gallery</h1>
                <p className="max-w-2xl text-fd-muted-foreground">
                    Live, interactive charts built with Reincharts. Drag to pan, scroll to zoom, then copy the code into
                    your app.
                </p>
                <nav className="mt-3 flex flex-wrap gap-2">
                    {chips.map((s) => (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            className="rounded-full border border-fd-border px-3 py-1 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
                        >
                            {s.title}
                        </a>
                    ))}
                    <Link
                        href="/examples"
                        className="rounded-full px-3 py-1 text-sm text-fd-muted-foreground hover:text-fd-foreground"
                    >
                        All examples →
                    </Link>
                </nav>
            </div>
            {gallery.map((section) => (
                <Section key={section.id} section={section} level={2} />
            ))}
        </main>
    );
}
