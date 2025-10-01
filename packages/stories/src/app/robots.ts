import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: "/_next/",
            crawlDelay: 1,
        },
        sitemap: "https://reincharts.com/sitemap.xml",
    };
}
