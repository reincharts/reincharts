import { defineConfig, type UserConfig } from "tsdown";

/** Shared tsdown config: ESM-only, type declarations, externalized deps, no bundling of workspace packages. */
export const createTsdownConfig = (overrides: UserConfig = {}) =>
    defineConfig({
        entry: ["src/index.ts"],
        format: "esm",
        dts: true,
        sourcemap: true,
        clean: true,
        platform: "browser",
        target: "es2022",
        ...overrides,
    });
