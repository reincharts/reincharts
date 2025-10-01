import type { Meta, StoryObj } from "@storybook/react-vite";
import AxisExample from "./Axis";

const meta: Meta = {
    title: "Features/Axis",
    component: AxisExample,
    argTypes: {
        axisAt: {
            control: "select",
            options: ["left", "right", "middle"],
            description: "Position of the Y axis.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "right" },
            },
        },
        gridLinesStrokeStyle: {
            control: "color",
            description: "Color of the grid lines.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#e2e4ec" },
            },
        },
        strokeStyle: {
            control: "color",
            description: "Color of the axis line.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#000000" },
            },
        },
        tickLabelFill: {
            control: "color",
            description: "Color of the tick labels.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#000000" },
            },
        },
        tickStrokeStyle: {
            control: "color",
            description: "Color of the tick marks.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#000000" },
            },
        },
        fontFamily: {
            control: "text",
            description: "Font family for tick labels.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif" },
            },
        },
        fontSize: {
            control: "number",
            description: "Font size for tick labels.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "12" },
            },
        },
        fontWeight: {
            control: "select",
            options: [
                "normal",
                "bold",
                "bolder",
                "lighter",
                "100",
                "200",
                "300",
                "400",
                "500",
                "600",
                "700",
                "800",
                "900",
            ],
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "400" },
            },
        },
        innerTickSize: {
            control: "number",
            description: "Length of the inner ticks.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "4" },
            },
        },
        orient: {
            control: "select",
            options: ["left", "right"],
            description: "Orientation of the Y axis.",
            table: {
                type: { summary: '"left" | "right"' },
                defaultValue: { summary: "right" },
            },
        },
        outerTickSize: {
            control: "number",
            description: "Length of the outer ticks.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "0" },
            },
        },
        showDomain: {
            control: "boolean",
            description: "Show the axis domain line.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        showGridLines: {
            control: "boolean",
            description: "Show grid lines.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        showTicks: {
            control: "boolean",
            description: "Show axis ticks.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        showTickLabel: {
            control: "boolean",
            description: "Show tick labels.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        ticks: {
            control: "number",
            description: "Number of ticks.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "8" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const YAxis: Story = {
    args: {
        axisAt: "right",
        gridLinesStrokeStyle: "#E2E4EC",
        strokeStyle: "#000000",
        tickLabelFill: "#000000",
        tickStrokeStyle: "#000000",
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 12,
        fontWeight: "400",
        innerTickSize: 4,
        orient: "right",
        outerTickSize: 0,
        showDomain: true,
        showGridLines: true,
        showTicks: true,
        showTickLabel: true,
        ticks: 8,
    },
    parameters: {
        controls: { exclude: [""] },
    },
};
