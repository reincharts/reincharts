import type { Meta, StoryObj } from "@storybook/react-vite";
import { Daily } from "./BasicAreaSeries";

const meta: Meta = {
    title: "Series/Area",
    component: Daily,
    argTypes: {
        fillStyle: {
            control: "color",
            description: "Fill color for the area under the line.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "rgba(33, 150, 243, 0.1)" },
            },
        },
        strokeStyle: {
            control: "color",
            description: "Color of the area series line.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#2196f3" },
            },
        },
        baseAt: {
            control: "number",
            description: "The base y value to draw the area to.",
            table: {
                type: {
                    summary: "number | function",
                    detail: "number | ((yScale: ScaleContinuousNumeric<number, number>, d: [number, number], moreProps: any) => number)",
                },
                defaultValue: { summary: "first(yScale.range())" },
            },
        },
        connectNulls: {
            control: "boolean",
            description: "Whether to connect the area between undefined data points.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        strokeDasharray: {
            control: "select",
            options: [
                "Solid",
                "ShortDash",
                "ShortDash2",
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
            description: "Stroke dash type for the area series line.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "Solid" },
            },
        },
        strokeWidth: {
            control: "number",
            description: "Stroke width for the area series line.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "3" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Area: Story = {
    args: {
        fillStyle: "rgba(33, 150, 243, 0.1)",
        strokeStyle: "#2196f3",
        connectNulls: false,
        strokeDasharray: "Solid",
        strokeWidth: 3,
    },
    parameters: {
        controls: {
            include: ["fillStyle", "strokeStyle", "baseAt", "connectNulls", "strokeDasharray", "strokeWidth"],
        },
    },
};
