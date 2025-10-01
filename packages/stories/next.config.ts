import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "export",
    distDir: "../../web",
    trailingSlash: true,
    webpack(config) {
        config.module.rules.push({
            test: /\.tsv$/i,
            resourceQuery: /raw/,
            type: "asset/source",
        });
        return config;
    },
    turbopack: {
        rules: {
            "*.tsv": {
                loaders: ["raw-loader"],
                as: "*.js",
            },
        },
    },
};

export default nextConfig;
