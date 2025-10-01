import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Reincharts - Interactive React Charting Library",
        short_name: "Reincharts",
        description: "Build performant interactive charts with this open source React library.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        orientation: "portrait-primary",
        scope: "/",
        categories: ["productivity", "developer", "charts", "finance", "data"],
        lang: "en-US",
        dir: "ltr",
        display_override: ["window-controls-overlay", "standalone"],
        launch_handler: {
            client_mode: "navigate-existing",
        },
        icons: [
            {
                src: "/favicon.ico",
                sizes: "16x16 32x32",
                type: "image/x-icon",
            },
            {
                src: "/favicon-16x16.png",
                sizes: "16x16",
                type: "image/png",
            },
            {
                src: "/chart.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
        screenshots: [
            {
                src: "/chart.png",
                sizes: "1200x630",
                type: "image/png",
                form_factor: "wide",
                label: "Interactive candlestick chart example",
            },
        ],
        shortcuts: [
            {
                name: "Getting Started",
                short_name: "Guides",
                description: "Learn how to use Reincharts",
                url: "/guides",
                icons: [{ src: "/favicon-16x16.png", sizes: "16x16" }],
            },
            {
                name: "API Reference",
                short_name: "API",
                description: "Browse the API documentation",
                url: "/api",
                icons: [{ src: "/favicon-16x16.png", sizes: "16x16" }],
            },
            {
                name: "Examples",
                short_name: "Storybook",
                description: "Interactive component examples",
                url: "/storybook",
                icons: [{ src: "/favicon-16x16.png", sizes: "16x16" }],
            },
        ],
        related_applications: [
            {
                platform: "web",
                url: "https://github.com/reincharts/reincharts",
            },
        ],
        prefer_related_applications: false,
    };
}
