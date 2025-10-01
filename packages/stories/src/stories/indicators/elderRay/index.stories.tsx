import type { Meta, StoryObj } from "@storybook/react-vite";
import ElderRayIndicator from "./ElderRayIndicator";

const meta: Meta = {
    title: "Indicators/Elder Ray",
    component: ElderRayIndicator,
    argTypes: {
        fillStyle: {
            description: "Custom colors for bullPower and bearPower bars.",
            control: "object",
            table: {
                type: { summary: "{ bearPower: string; bullPower: string }" },
                defaultValue: {
                    summary: '{ bearPower: "rgba(239, 83, 80, 0.7)", bullPower: "rgba(38, 166, 153, 0.7)" }',
                },
            },
        },
        clip: {
            description: "Clip the series to the chart area.",
            control: "boolean",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        strokeStyle: {
            description: "Stroke style for the bars.",
            control: "color",
            table: {
                type: { summary: "string | ((data: any, y: number) => string)" },
                defaultValue: { summary: "rgba(0, 0, 0, 0.3)" },
            },
        },
        straightLineStrokeStyle: {
            description: "Stroke color for the zero line.",
            control: "color",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "rgba(0, 0, 0, 0.7)" },
            },
        },
        straightLineStrokeDasharray: {
            description: "Dash style for the zero line.",
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
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "Dash" },
            },
        },
        widthRatio: {
            description: "Width ratio of the bars.",
            control: { type: "number", step: 0.1 },
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "0.8" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ElderRay: Story = {
    args: {
        fillStyle: {
            bearPower: "rgba(239, 83, 80, 0.7)",
            bullPower: "rgba(38, 166, 153, 0.7)",
        },
        clip: true,
        strokeStyle: "rgba(0, 0, 0, 0.3)",
        straightLineStrokeStyle: "rgba(0, 0, 0, 0.7)",
        straightLineStrokeDasharray: "Dash",
        widthRatio: 0.8,
    },
    parameters: {
        controls: {
            include: [
                "fillStyle",
                "clip",
                "strokeStyle",
                "straightLineStrokeStyle",
                "straightLineStrokeDasharray",
                "widthRatio",
            ],
        },
    },
};
