import type { Preview } from "@storybook/nextjs-vite";

const preview: Preview = {
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: "100vh", display: "flex" }}>
                <Story />
            </div>
        ),
    ],
    parameters: {
        controls: {
            expanded: true,
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
            hideNoControlsWarning: true,
        },
        options: {
            storySort: {
                order: ["Series", "Features", "Tools", "Indicators"],
            },
        },
        layout: "fullscreen",
    },
};

export default preview;
