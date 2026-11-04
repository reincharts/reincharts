import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
    title: "Page not found",
    description: "This page doesn't exist. Find your way back to the Reincharts docs, examples or API reference.",
};

const links = [
    { href: "/docs", title: "Docs", description: "Guides and concepts" },
    { href: "/examples", title: "Examples", description: "Live charts with source code" },
    { href: "/api", title: "API reference", description: "Every component, hook and type" },
];

/** 404 page (out/404.html in the static export), with the same navbar as every other page. */
export default function NotFound() {
    return (
        <>
            <SiteHeader />
            <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-24 text-center sm:px-6">
                <p className="font-mono text-sm text-fd-muted-foreground">404</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fd-foreground sm:text-4xl">
                    Page not found
                </h1>
                <p className="mt-4 max-w-md text-fd-muted-foreground">
                    The page you are looking for doesn&apos;t exist or has moved. Press{" "}
                    <kbd className="rounded border border-fd-border px-1 font-mono text-xs">⌘ K</kbd> to search, or
                    start from one of these:
                </p>
                <div className="mt-10 grid w-full gap-3 sm:grid-cols-3">
                    {links.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="rounded-xl border border-fd-border bg-fd-card p-4 text-left transition-colors hover:bg-fd-accent"
                        >
                            <span className="block font-medium text-fd-foreground">{l.title}</span>
                            <span className="mt-1 block text-sm text-fd-muted-foreground">{l.description}</span>
                        </Link>
                    ))}
                </div>
                <Link href="/" className="mt-10 text-sm font-medium text-fd-foreground hover:underline">
                    Back to the home page
                </Link>
            </main>
            <SiteFooter />
        </>
    );
}
