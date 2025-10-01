import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import StandardDeviationChannelChart from "./StandardDeviationChannelChart";

const meta: Meta = {
    title: "Tools/Standard Deviation Channel",
    component: StandardDeviationChannelChart,
    argTypes: {
        enabled: {
            control: "boolean",
            description: "Enable or disable the interactive standard deviation channel tool.",
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
        appearance: {
            control: "object",
            description: "Styling configuration for the standard deviation channel appearance.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ stroke: "#000000", strokeWidth: 1, fill: "rgba(138, 175, 226, 0.3)", edgeStrokeWidth: 2, edgeStroke: "#000000", edgeFill: "#FFFFFF", r: 5 }',
                },
            },
        },
        hoverText: {
            control: "object",
            description: "Configuration for text to display while a standard deviation channel is hovered over.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ enable: true, fontFamily: "-apple-system, system-ui, Roboto, \'Helvetica Neue\', Ubuntu, sans-serif", fontSize: 12, fill: "#000000", bgFill: "rgba(250, 147, 37, .5)", bgWidth: "auto", bgHeight: "auto", text: "Click and drag the edge circles", selectedText: "" }',
                },
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const StandardDeviationChannel: Story = {
    args: {
        enabled: true,
        currentPositionStroke: "#000000",
        currentPositionStrokeWidth: 3,
        currentPositionOpacity: 1,
        currentPositionRadius: 4,
        appearance: {
            stroke: "#000000",
            strokeWidth: 1,
            fill: "rgba(138, 175, 226, 0.3)",
            edgeStrokeWidth: 2,
            edgeStroke: "#000000",
            edgeFill: "#FFFFFF",
            r: 5,
        },
        hoverText: {
            enable: true,
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 12,
            fill: "#000000",
            bgFill: "rgba(250, 147, 37, .5)",
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click and drag the edge circles",
            selectedText: "",
        },
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();

        function onChange() {
            updateArgs({ enabled: false });
        }

        return <StandardDeviationChannelChart {...args} enabled={args.enabled} disableInStory={onChange} />;
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
