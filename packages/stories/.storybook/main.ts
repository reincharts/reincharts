import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
    stories: ["../src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    addons: ["@chromatic-com/storybook", "@storybook/addon-vitest", "@storybook/addon-docs"],
    framework: {
        name: "@storybook/nextjs-vite",
        options: {},
    },
    staticDirs: ["../public"],
    managerHead: (head, { configType }) => {
        if (configType === "PRODUCTION") {
            return `
        ${head}
        <base href="/docs/">
      `;
        }
    },
};
export default config;
