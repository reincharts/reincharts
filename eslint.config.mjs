import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["**/dist", "**/.next", "**/out", "**/.source", "**/coverage", "**/next-env.d.ts", "**/.turbo"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        plugins: { react, "react-hooks": reactHooks },
        languageOptions: { globals: { ...globals.browser, ...globals.node } },
        settings: { react: { version: "detect" } },
        rules: {
            ...react.configs.recommended.rules,
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "react/display-name": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true, argsIgnorePattern: "^_" }],
            "@typescript-eslint/consistent-type-imports": "error",
            curly: "error",
            "no-var": "error",
        },
    },
    prettier,
);
