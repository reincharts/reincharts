import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import("next").NextConfig} */
const config = {
    output: "export",
    reactStrictMode: true,
    trailingSlash: false,
    images: { unoptimized: true },
    // don't write an AGENTS.md into the package on `next dev`
    agentRules: false,
    // the @reincharts/* workspace packages export TypeScript source
    transpilePackages: [
        "reincharts",
        "@reincharts/core",
        "@reincharts/series",
        "@reincharts/indicators",
        "@reincharts/axes",
        "@reincharts/coordinates",
        "@reincharts/tooltip",
        "@reincharts/annotations",
        "@reincharts/interactive",
        "@reincharts/datafeed",
        "@reincharts/widget",
    ],
};

export default withMDX(config);
