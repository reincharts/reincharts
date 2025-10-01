import type { Meta, StoryObj } from "@storybook/react-vite";
import { Daily } from "./BasicPointAndFigureSeries";

const meta: Meta = {
    title: "Series/Point And Figure",
    component: Daily,
    argTypes: {
        clip: {
            control: "boolean",
            description: "Whether to clip the series to chart area.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        fill: {
            control: "color",
            description: "Fill colors of the down ellipse.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "rgba(0,0,0,0)" },
            },
        },
        stroke: {
            control: "object",
            description: "Stroke colors for up and down columns.",
            table: {
                type: { summary: "{ up: string; down: string; }" },
                defaultValue: { summary: '{ up: "#6BA583", down: "#FF0000" }' },
            },
        },
        strokeWidth: {
            control: "number",
            description: "Stroke width for columns.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PointAndFigure: Story = {
    args: {
        clip: true,
        fill: "rgba(0,0,0,0)",
        stroke: {
            up: "#6BA583",
            down: "#FF0000",
        },
        strokeWidth: 1,
    },
    parameters: {
        controls: { include: ["clip", "fill", "stroke", "strokeWidth"] },
    },
};
