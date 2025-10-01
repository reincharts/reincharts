import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import FibChart from "./FibChart";

const meta: Meta = {
    title: "Tools/Fibonacci Retracement",
    component: FibChart,
    argTypes: {
        enabled: {
            control: "boolean",
            description: "Enable or disable the interactive Fibonacci retracement tool.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        type: {
            control: "select",
            options: ["EXTEND", "RAY", "BOUND"],
            description: "Type of Fibonacci retracement extension.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "RAY" },
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
            description: "Styling configuration for the Fibonacci retracement appearance.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ strokeStyle: "#000000", strokeWidth: 1, fontFamily: "-apple-system, system-ui, Roboto, \'Helvetica Neue\', Ubuntu, sans-serif", fontSize: 11, fontFill: "#000000", edgeStroke: "#000000", edgeFill: "#FFFFFF", nsEdgeFill: "#000000", edgeStrokeWidth: 1, r: 5 }',
                },
            },
        },
        hoverText: {
            control: "object",
            description: "Configuration for text to display while a fibonacci retracement is hovered over.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ enable: true, fontFamily: "-apple-system, system-ui, Roboto, \'Helvetica Neue\', Ubuntu, sans-serif", fontSize: 12, fill: "#000000", text: "Click to select object", bgFill: "rgba(250, 147, 37, .5)", bgWidth: "auto", bgHeight: "auto", selectedText: "" }',
                },
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const FibonacciRetracement: Story = {
    args: {
        enabled: true,
        type: "RAY",
        currentPositionStroke: "#000000",
        currentPositionStrokeWidth: 3,
        currentPositionOpacity: 1,
        currentPositionRadius: 4,
        appearance: {
            strokeStyle: "#000000",
            strokeWidth: 1,
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 11,
            fontFill: "#000000",
            edgeStroke: "#000000",
            edgeFill: "#FFFFFF",
            nsEdgeFill: "#000000",
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
            selectedText: "",
        },
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();

        function onChange() {
            updateArgs({ enabled: false });
        }

        return <FibChart {...args} enabled={args.enabled} disableInStory={onChange} />;
    },
    parameters: {
        controls: {
            include: [
                "enabled",
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
