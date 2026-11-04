import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/**
 * Shared Vitest config for every package.
 * - `unit`: *.test.ts(x) in happy-dom with a mocked 2D canvas (fast, asserts draw calls).
 * - `browser`: *.browser.test.tsx in real Chromium with screenshot comparisons.
 */
export const createVitestConfig = () =>
    defineConfig({
        plugins: [react()],
        optimizeDeps: { include: ["react", "react-dom", "react-dom/client", "react/jsx-dev-runtime", "react/jsx-runtime"] },
        test: {
            projects: [
                {
                    extends: true,
                    test: {
                        name: "unit",
                        globals: true,
                        environment: "happy-dom",
                        include: ["{src,test}/**/*.test.{ts,tsx}"],
                        exclude: ["**/*.browser.test.{ts,tsx}"],
                        setupFiles: ["@reincharts/testing/setup"],
                    },
                },
                {
                    extends: true,
                    test: {
                        name: "browser",
                        globals: true,
                        include: ["{src,test}/**/*.browser.test.{ts,tsx}"],
                        browser: {
                            enabled: true,
                            headless: true,
                            provider: playwright(),
                            instances: [{ browser: "chromium", viewport: { width: 1280, height: 800 } }],
                            expect: {
                                toMatchScreenshot: {
                                    comparatorName: "pixelmatch",
                                    comparatorOptions: { threshold: 0.2, allowedMismatchedPixelRatio: 0.01 },
                                },
                            },
                        },
                    },
                },
            ],
        },
    });
