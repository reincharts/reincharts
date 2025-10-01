import Link from "next/link";

import "./globals.css";
import { buttonVariants } from "@/app/components/ui/button";
import { siteConfig } from "@/app/config/site";
import { Icons } from "@/app/components/icons";
import { MainNav } from "@/app/components/main-nav";
import { AdditionalMetaTags } from "@/app/components/additional-meta-tags";

interface RootLayoutProps {
    children: React.ReactNode;
}

export const metadata = {
    metadataBase: new URL(siteConfig.url),
    title: {
        default: siteConfig.name,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    authors: [
        {
            name: "reincharts",
            url: "https://reincharts.com",
        },
    ],
    creator: "reincharts",
    publisher: "reincharts",
    category: "technology",
    classification: "Interactive React charting library for dynamic data visualization",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: siteConfig.url,
        title: siteConfig.name,
        description: siteConfig.description,
        siteName: siteConfig.name,
        images: [
            {
                url: "/chart.png",
                width: 1200,
                height: 630,
                alt: "Reincharts - Interactive React Charting Library",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: siteConfig.name,
        description: siteConfig.description,
        images: ["/chart.png"],
    },
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
        apple: "/favicon-16x16.png",
    },
    alternates: {
        canonical: siteConfig.url,
    },
};

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en">
            <head>
                <AdditionalMetaTags />
            </head>
            <body className="min-h-screen bg-background font-sans antialiased">
                <div className="flex min-h-screen flex-col">
                    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex h-16 items-center justify-between">
                                <MainNav items={siteConfig.mainNav} />
                                <nav>
                                    <Link href={siteConfig.links.github} target="_blank" rel="noreferrer">
                                        <div
                                            className={buttonVariants({
                                                size: "icon",
                                                variant: "ghost",
                                            })}
                                        >
                                            <Icons.gitHub className="h-5 w-5" />
                                            <span className="sr-only">GitHub</span>
                                        </div>
                                    </Link>
                                </nav>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 pt-0">{children}</main>
                </div>
            </body>
        </html>
    );
}
