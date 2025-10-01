import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import InteractiveYChart from "./InteractiveYChart";

const meta: Meta = {
    title: "Tools/Interactive Y Coordinate",
    component: InteractiveYChart,
    argTypes: {
        enabled: {
            control: "boolean",
            description: "Enable or disable the interactive Y coordinate tool.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        isDraggable: {
            control: "boolean",
            description: "Whether Y coordinates can be dragged.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        defaultPriceCoordinate: {
            control: "object",
            description: "Default configuration for price coordinates.",
            table: {
                type: { summary: "object" },
                defaultValue: {
                    summary:
                        '{ bgFill: "rgba(255, 255, 255, 1)", stroke: "rgba(101, 116, 205, 1)", strokeDasharray: "LongDash", strokeWidth: 1, textFill: "#6574CD", fontFamily: "-apple-system, system-ui, Roboto, \'Helvetica Neue\', Ubuntu, sans-serif", fontSize: 12, fontStyle: "normal", fontWeight: "normal", text: "Alert", textBox: { height: 24, left: 20, padding: { left: 10, right: 5 }, closeIcon: { padding: { left: 5, right: 8 }, width: 8 } }, edge: { stroke: "rgba(101, 116, 205, 1)", strokeWidth: 1, fill: "rgba(255, 255, 255, 1)", orient: "right", at: "right", arrowWidth: 10, dx: 0, rectWidth: 50, rectHeight: 20 } }',
                },
            },
        },
        hoverText: {
            control: "object",
            description: "Configuration for text to display while a Y coordinate is hovered over.",
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

export const InteractiveYCoordinate: Story = {
    args: {
        enabled: true,
        isDraggable: true,
        defaultPriceCoordinate: {
            bgFill: "rgba(255, 255, 255, 1)",
            stroke: "rgba(101, 116, 205, 1)",
            strokeDasharray: "LongDash",
            strokeWidth: 1,
            textFill: "#6574CD",
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 12,
            fontStyle: "normal",
            fontWeight: "normal",
            text: "Alert",
            textBox: {
                height: 24,
                left: 20,
                padding: { left: 10, right: 5 },
                closeIcon: {
                    padding: { left: 5, right: 8 },
                    width: 8,
                },
            },
            edge: {
                stroke: "rgba(101, 116, 205, 1)",
                strokeWidth: 1,
                fill: "rgba(255, 255, 255, 1)",
                orient: "right",
                at: "right",
                arrowWidth: 10,
                dx: 0,
                rectWidth: 50,
                rectHeight: 20,
            },
        },
        hoverText: {
            enable: true,
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 12,
            fill: "#000000",
            bgFill: "rgba(250, 147, 37, .5)",
            bgWidth: "auto",
            bgHeight: "auto",
            text: "Click to select object",
        },
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();

        function onChange() {
            updateArgs({ enabled: false });
        }

        return <InteractiveYChart {...args} enabled={args.enabled} disableInStory={onChange} />;
    },
    parameters: {
        controls: {
            include: ["enabled", "isDraggable", "defaultPriceCoordinate", "hoverText"],
        },
    },
};
