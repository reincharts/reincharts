import { createFileSystemGeneratorCache, createGenerator } from "fumadocs-typescript";

/**
 * TypeScript doc generator for `<AutoTypeTable>`. Results are cached on disk so static
 * builds only re-run the TypeScript compiler for files that changed.
 */
export const generator = createGenerator({
    tsconfigPath: "./tsconfig.json",
    cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});
