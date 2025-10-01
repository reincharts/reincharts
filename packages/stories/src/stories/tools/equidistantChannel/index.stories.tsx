import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import EquidistantChannelChart from "./EquidistantChannelChart";

const meta: Meta = {
    title: "Tools/Equidistant Channel",
    component: EquidistantChannelChart,
    argTypes: {
        enabled: {
            control: "boolean",
            description: "Enable or disable the equidistant channel tool.",
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
                defaultValue: { summary: "#000000" },
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
            description: "Styling configuration for the equidistant channel appearance.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ stroke: "#000000", strokeWidth: 1, fill: "rgba(138, 175, 226, 0.7)", edgeStroke: "#000000", edgeFill: "#FFFFFF", edgeFill2: "#250B98", edgeStrokeWidth: 1, r: 5 }',
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
                        '{ enable: true, fontFamily: "-apple-system, system-ui, Roboto, \'Helvetica Neue\', Ubuntu, sans-serif", fontSize: 12, fill: "#000000", text: "Click to select object", bgFill: "rgba(250, 147, 37, .5)", bgWidth: "auto", bgHeight: "auto" }',
                },
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const EquidistantChannel: Story = {
    args: {
        enabled: true,
        currentPositionStroke: "#000000",
        currentPositionStrokeWidth: 3,
        currentPositionOpacity: 1,
        currentPositionRadius: 4,
        appearance: {
            stroke: "#000000",
            strokeWidth: 1,
            fill: "rgba(138, 175, 226, 0.7)",
            edgeStroke: "#000000",
            edgeFill: "#FFFFFF",
            edgeFill2: "#250B98",
            edgeStrokeWidth: 1,
            r: 5,
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

        return <EquidistantChannelChart {...args} enabled={args.enabled} disableInStory={onChange} />;
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
