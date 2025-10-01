import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import GannChart from "./GannChart";

const meta: Meta = {
    title: "Tools/Gann Fan",
    component: GannChart,
    argTypes: {
        enabled: {
            control: "boolean",
            description: "Enable or disable the interactive Gann fan tool.",
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
            description: "Styling configuration for the Gann fan appearance.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ stroke: "#000000", strokeWidth: 1, edgeStroke: "#000000", edgeFill: "#FFFFFF", edgeStrokeWidth: 1, r: 5, fill: ["rgba(31, 119, 180, 0.2)", "rgba(255, 126, 14, 0.2)", "rgba(44, 160, 44, 0.2)", "rgba(214, 39, 39, 0.2)", "rgba(148, 103, 189, 0.2)", "rgba(140, 86, 75, 0.2)", "rgba(227, 119, 194, 0.2)", "rgba(127, 127, 127, 0.2)"], fontFamily: "-apple-system, system-ui, Roboto, "Helvetica Neue", Ubuntu, sans-serif", fontSize: 12, fontFill: "#000000" }',
                },
            },
        },
        hoverText: {
            control: "object",
            description: "Configuration for text to display while a Gann fan is hovered over.",
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

export const GannFan: Story = {
    args: {
        enabled: true,
        currentPositionStroke: "#000000",
        currentPositionStrokeWidth: 3,
        currentPositionOpacity: 1,
        currentPositionRadius: 4,
        appearance: {
            stroke: "#000000",
            strokeWidth: 1,
            edgeStroke: "#000000",
            edgeFill: "#FFFFFF",
            edgeStrokeWidth: 1,
            r: 5,
            fill: [
                "rgba(31, 119, 180, 0.2)",
                "rgba(255, 126, 14, 0.2)",
                "rgba(44, 160, 44, 0.2)",
                "rgba(214, 39, 39, 0.2)",
                "rgba(148, 103, 189, 0.2)",
                "rgba(140, 86, 75, 0.2)",
                "rgba(227, 119, 194, 0.2)",
                "rgba(127, 127, 127, 0.2)",
            ],
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 12,
            fontFill: "#000000",
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

        return <GannChart {...args} enabled={args.enabled} disableInStory={onChange} />;
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
