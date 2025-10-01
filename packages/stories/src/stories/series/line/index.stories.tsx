import type { Meta, StoryObj } from "@storybook/react-vite";
import { Daily } from "./BasicLineSeries";

const meta: Meta = {
    title: "Series/Line",
    component: Daily,
    argTypes: {
        connectNulls: {
            control: "boolean",
            description: "Whether to connect the line between undefined data points.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        highlightOnHover: {
            control: "boolean",
            description: "Whether to highlight the line when within the hoverTolerance.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        hoverStrokeWidth: {
            control: "number",
            description: "Width to increase the line to on hover.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "4" },
            },
        },
        hoverTolerance: {
            control: "number",
            description: "The distance between the cursor and the closest point in the line.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "6" },
            },
        },
        strokeStyle: {
            control: "color",
            description: "Color, gradient, or pattern to use for the stroke.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#2196f3" },
            },
        },
        strokeDasharray: {
            control: "select",
            options: [
                "Solid",
                "ShortDash",
                "ShortDot",
                "ShortDashDot",
                "ShortDashDotDot",
                "Dot",
                "Dash",
                "LongDash",
                "DashDot",
                "LongDashDot",
                "LongDashDotDot",
            ],
            description: "Stroke dash type.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "Solid" },
            },
        },
        strokeWidth: {
            control: "number",
            description: "Stroke width.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {
    args: {
        connectNulls: false,
        strokeStyle: "#2196f3",
        strokeDasharray: "Solid",
        strokeWidth: 1,
        highlightOnHover: false,
        hoverTolerance: 6,
        hoverStrokeWidth: 4,
    },
    parameters: {
        controls: {
            include: [
                "connectNulls",
                "highlightOnHover",
                "hoverStrokeWidth",
                "hoverTolerance",
                "strokeStyle",
                "strokeDasharray",
                "strokeWidth",
            ],
        },
    },
};
