import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import TrendLineChart from "./TrendLineChart";

const meta: Meta = {
    title: "Tools/TrendLine",
    component: TrendLineChart,
    argTypes: {
        enabled: {
            control: "boolean",
            description: "Enable or disable the interactive trendline tool.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        snap: {
            control: "boolean",
            description: "Enable snapping to data points.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        type: {
            control: "select",
            options: ["XLINE", "RAY", "LINE"],
            description: "Type of trendline drawing.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "XLINE" },
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
            description: "Styling configuration for the trendline appearance.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ strokeStyle: "#000000", strokeWidth: 1, strokeDasharray: "Solid", edgeStrokeWidth: 1, edgeFill: "#FFFFFF", edgeStroke: "#000000", r: 6 }',
                },
            },
        },
        hoverText: {
            control: "object",
            description: "Configuration for text to display while a trendline is hovered over.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ enable: true, fontFamily: "-apple-system, system-ui, Roboto, \'Helvetica Neue\', Ubuntu, sans-serif", fontSize: 12, fill: "#000000", bgFill: "rgba(250, 147, 37, .5)", bgWidth: "auto", bgHeight: "auto", text: "Click to select object", selectedText: "" }',
                },
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const TrendLine: Story = {
    args: {
        enabled: true,
        snap: true,
        type: "XLINE",
        currentPositionStroke: "black",
        currentPositionStrokeWidth: 3,
        currentPositionOpacity: 1,
        currentPositionRadius: 4,
        appearance: {
            strokeStyle: "#000000",
            strokeWidth: 1,
            strokeDasharray: "Solid",
            edgeStrokeWidth: 1,
            edgeFill: "#FFFFFF",
            edgeStroke: "#000000",
            r: 6,
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
            selectedText: "",
        },
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();

        function onChange() {
            updateArgs({ enabled: false });
        }

        return <TrendLineChart {...args} enabled={args.enabled} disableInStory={onChange} />;
    },
    parameters: {
        controls: {
            include: [
                "enabled",
                "snap",
                "type",
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
