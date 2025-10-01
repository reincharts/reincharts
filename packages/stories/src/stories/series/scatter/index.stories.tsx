import type { Meta, StoryObj } from "@storybook/react-vite";
import BasicScatterSeries from "./BasicScatterSeries";

const meta: Meta = {
    title: "Series/Scatter",
    component: BasicScatterSeries,
    argTypes: {
        fillStyle: {
            control: "color",
            description: "Fill color for scatter markers. Passed to marker via markerProps.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: '"#4682B4"' },
            },
        },
        strokeStyle: {
            control: "color",
            description: "Stroke color for scatter markers. Passed to marker via markerProps.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: '"#4682B4"' },
            },
        },
        strokeWidth: {
            control: "number",
            description: "Stroke width for scatter markers. Passed to marker via markerProps.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Scatter: Story = {
    args: {
        fillStyle: "#4682B4",
        strokeStyle: "#4682B4",
        strokeWidth: 1,
    },
    parameters: {
        controls: { include: ["fillStyle", "strokeStyle", "strokeWidth"] },
    },
};
