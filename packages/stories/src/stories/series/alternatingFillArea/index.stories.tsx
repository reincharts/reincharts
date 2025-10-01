import type { Meta, StoryObj } from "@storybook/react-vite";
import { Daily } from "./BasicBaselineSeries";

const meta: Meta = {
    title: "Series/Alternating Fill Area",
    component: Daily,
    argTypes: {
        baseAt: {
            control: "number",
            description: "Base value for the area series.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: undefined },
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
        fillStyle: {
            control: "object",
            description: "Fill style configuration for above/below baseline.",
            table: {
                type: { summary: "{ top: string; bottom: string }" },
                defaultValue: { summary: '{ top: "rgba(38, 166, 154, 0.1)", bottom: "rgba(239, 83, 80, 0.1)" }' },
            },
        },
        strokeStyle: {
            control: "object",
            description: "Stroke style configuration for the line above/below baseline.",
            table: {
                type: { summary: "{ top: string; bottom: string }" },
                defaultValue: { summary: '{ top: "#26a675ff", bottom: "#e93b3bff" }' },
            },
        },
        strokeDasharray: {
            control: "object",
            description: "Stroke dash type for the line above/below baseline.",
            table: {
                type: {
                    summary: "{ top: strokeDashTypes; bottom: strokeDashTypes }",
                    detail: "strokeDashTypes used in other components",
                },
                defaultValue: { summary: '{ top: "Solid", bottom: "Solid" }' },
            },
        },
        strokeWidth: {
            control: "object",
            description: "Stroke width for the line above/below baseline.",
            table: {
                type: { summary: "{ top: number; bottom: number }" },
                defaultValue: { summary: "{ top: 2, bottom: 2 }" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AlternatingFillArea: Story = {
    args: {
        baseAt: 56,
        connectNulls: false,
        fillStyle: {
            top: "rgba(38, 166, 154, 0.1)",
            bottom: "rgba(239, 83, 80, 0.1)",
        },
        strokeStyle: {
            top: "#26a675ff",
            bottom: "#e93b3bff",
        },
        strokeDasharray: {
            top: "Solid",
            bottom: "Solid",
        },
        strokeWidth: {
            top: 2,
            bottom: 2,
        },
    },
    parameters: {
        controls: { include: ["baseAt", "connectNulls", "fillStyle", "strokeStyle", "strokeDasharray", "strokeWidth"] },
    },
};
