import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { SearchDialog } from "@/components/search-dialog";
import { site } from "@/lib/site";
// widget UI + drawing toolbars (the widget stylesheet imports @reincharts/interactive/styles.css)
import "@reincharts/widget/styles.css";
import "./global.css";

// Geist (SIL OFL 1.1), bundled locally so the static build works offline.
const sans = localFont({
    src: "./fonts/geist-latin.woff2",
    variable: "--font-geist-sans",
    weight: "100 900",
    display: "swap",
});
const mono = localFont({
    src: "./fonts/geist-mono-latin.woff2",
    variable: "--font-geist-mono",
    weight: "100 900",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL(site.url),
    title: { default: site.title, template: "%s — Reincharts" },
    description: site.description,
    icons: {
        // the SVG follows the browser's light / dark theme; the PNG / ICO fallbacks use the dark tile
        icon: [
            { url: "/favicon.svg", type: "image/svg+xml" },
            { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    openGraph: {
        title: site.title,
        description: site.description,
        url: site.url,
        siteName: "Reincharts",
        type: "website",
        images: [{ url: "/logo-light.png", width: 1024, height: 1024, alt: "Reincharts" }],
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
            <body className="flex min-h-screen flex-col">
                {/* search match highlighting (see global.css: kept out of the optimized CSS bundle) */}
                <style>{"::highlight(fd-search){color:var(--color-fd-primary);text-decoration-line:underline}"}</style>
                <RootProvider search={{ SearchDialog }}>{children}</RootProvider>
            </body>
        </html>
    );
}
