import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import InteractiveTextChart from "./InteractiveTextChart";

const meta: Meta = {
    title: "Tools/Interactive Text",
    component: InteractiveTextChart,
    argTypes: {
        enabled: {
            control: "boolean",
            description: "Enable or disable the interactive text tool.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        currentPositionStroke: {
            control: "color",
            description: "Color of the current position indicator.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "black" },
            },
        },
        currentPositionStrokeWidth: {
            control: "number",
            description: "Width of the current position indicator.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "3" },
            },
        },
        currentPositionOpacity: {
            control: "number",
            description: "Opacity of the current position indicator.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
        currentPositionRadius: {
            control: "number",
            description: "Radius of the current position indicator.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "4" },
            },
        },
        defaultText: {
            control: "object",
            description: "Default text configuration.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ bgFill: "#D3D3D3", bgStrokeWidth: 1, textFill: "#F10040", fontFamily: "-apple-system, system-ui, Roboto, \'Helvetica Neue\', Ubuntu, sans-serif", fontSize: 12, fontStyle: "normal", fontWeight: "normal", text: "Enter Text..." }',
                },
            },
        },
        hoverText: {
            control: "object",
            description: "Configuration for text to display while an interactive text is hovered over.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ enable: true, fontFamily: "-apple-system, system-ui, Roboto, \'Helvetica Neue\', Ubuntu, sans-serif", fontSize: 12, fill: "#000000", text: "Click to select object", bgFill: "rgba(250, 147, 37, .5)", bgWidth: "auto", bgHeight: "auto" }',
                },
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const InteractiveText: Story = {
    args: {
        enabled: true,
        currentPositionStroke: "black",
        currentPositionStrokeWidth: 3,
        currentPositionOpacity: 1,
        currentPositionRadius: 4,
        defaultText: {
            bgFill: "#D3D3D3",
            bgStrokeWidth: 1,
            textFill: "#F10040",
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 12,
            fontStyle: "normal",
            fontWeight: "normal",
            text: "Enter Text...",
        },
        hoverText: {
            enable: true,
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 12,
            fill: "#000000",
            text: "Click to select object",
            bgFill: "rgba(250, 147, 37, .5)",
            bgWidth: "auto",
            bgHeight: "auto",
        },
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();

        function onChange() {
            updateArgs({ enabled: false });
        }

        return <InteractiveTextChart {...args} enabled={args.enabled} disableInStory={onChange} />;
    },
    parameters: {
        controls: {
            include: [
                "enabled",
                "currentPositionStroke",
                "currentPositionStrokeWidth",
                "currentPositionOpacity",
                "currentPositionRadius",
                "defaultText",
                "hoverText",
            ],
        },
    },
};
