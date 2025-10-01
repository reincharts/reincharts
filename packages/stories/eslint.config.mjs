// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const filename = fileURLToPath(import.meta.url);
const directoryName = dirname(filename);

const compat = new FlatCompat({
    baseDirectory: directoryName,
});

const eslintConfig = [
    {
        ignores: ["**/snippets/**"],
    },
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    ...storybook.configs["flat/recommended"],
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
];

export default eslintConfig;
