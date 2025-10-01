import type { Meta, StoryObj } from "@storybook/react-vite";
import { Daily } from "./BasicKagiSeries";

const meta: Meta = {
    title: "Series/Kagi",
    component: Daily,
    argTypes: {
        currentValueStroke: {
            control: "color",
            description: "Stroke color for the current value indicator.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#000000" },
            },
        },
        stroke: {
            control: "object",
            description: "Stroke colors for yang and yin lines.",
            table: {
                type: { summary: "{ yang: string; yin: string; }" },
                defaultValue: { summary: '{ yang: "#26a675ff", yin: "#e93b3bff" }' },
            },
        },
        strokeWidth: {
            control: "number",
            description: "Stroke width for Kagi lines.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "2" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Kagi: Story = {
    args: {
        currentValueStroke: "#000000",
        stroke: {
            yang: "#26a675ff",
            yin: "#e93b3bff",
        },
        strokeWidth: 2,
    },
    parameters: {
        controls: { include: ["currentValueStroke", "stroke", "strokeWidth"] },
    },
};
