import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import DrawingChart from "./DrawingChart";

const meta: Meta = {
    title: "Tools/Drawing",
    component: DrawingChart,
    argTypes: {
        enabled: {
            control: "boolean",
            description: "Enable or disable the drawing tool.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        currentPositionStroke: {
            control: "color",
            description: "Color of the current position indicator shown while enabled is true.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#000000" },
            },
        },
        currentPositionStrokeWidth: {
            control: "number",
            description: "Width of the current position indicator shown while enabled is true.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "3" },
            },
        },
        currentPositionOpacity: {
            control: "number",
            description: "Opacity of the current position indicator shown while enabled is true.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
        currentPositionRadius: {
            control: "number",
            description: "Radius of the current position indicator shown while enabled is true.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "4" },
            },
        },
        appearance: {
            control: "object",
            description: "Styling configuration for the drawing.",
            table: {
                type: {
                    summary:
                        "{ stroke: string; strokeWidth: number; selectedStroke: string; selectedStrokeWidth: number; tolerance: number; }",
                },
                defaultValue: {
                    summary:
                        '{ stroke: "black", strokeWidth: 2, selectedStroke: "red", selectedStrokeWidth: 4, tolerance: 10 }',
                },
            },
        },
        hoverText: {
            control: "object",
            description: "Configuration for text to display while a drawing is hovered over.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ enable: true, fontFamily: "-apple-system, system-ui, Roboto, \'Helvetica Neue\', Ubuntu, sans-serif", fontSize: 12, fill: "#000000", text: "Click to select drawing", bgFill: "rgba(250, 147, 37, .5)", bgWidth: "auto", bgHeight: "auto" }',
                },
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Drawing: Story = {
    args: {
        enabled: true,
        currentPositionStroke: "#000000",
        currentPositionStrokeWidth: 3,
        currentPositionRadius: 4,
        currentPositionOpacity: 1,
        appearance: {
            stroke: "black",
            strokeWidth: 2,
            selectedStroke: "red",
            selectedStrokeWidth: 4,
            tolerance: 10,
        },
        hoverText: {
            enable: true,
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 12,
            fill: "#000000",
            text: "Click to select drawing",
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

        return <DrawingChart {...args} enabled={args.enabled} disableInStory={onChange} />;
    },
    parameters: {
        controls: {
            include: [
                "enabled",
                "currentPositionStroke",
                "currentPositionStrokeWidth",
                "currentPositionOpacity",
                "currentPositionRadius",
                "appearance",
                "hoverText",
            ],
        },
    },
};
