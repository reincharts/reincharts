import type { Meta, StoryObj } from "@storybook/react-vite";
import { Daily } from "./BasicRenkoSeries";

const meta: Meta = {
    title: "Series/Renko",
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
            control: "object",
            description: "Fill colors for Renko bricks (up, down, partial).",
            table: {
                type: { summary: "{ up: string; down: string; partial: string }" },
                defaultValue: { summary: '{ up: "#26a675ff", down: "#e93b3bff", partial: "#4682B4" }' },
            },
        },
        stroke: {
            control: "object",
            description: "Stroke colors for Renko bricks (up, down).",
            table: {
                type: { summary: "{ up: string; down: string }" },
                defaultValue: { summary: '{ up: "rgba(0,0,0,0)", down: "rgba(0,0,0,0)" }' },
            },
        },
        strokeWidth: {
            control: "number",
            description: "Stroke width for Renko bricks.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Renko: Story = {
    args: {
        clip: true,
        fill: {
            up: "#26a675ff",
            down: "#e93b3bff",
            partial: "#4682B4",
        },
        stroke: {
            up: "rgba(0,0,0,0)",
            down: "rgba(0,0,0,0)",
        },
        strokeWidth: 1,
    },
    parameters: {
        controls: { include: ["clip", "fill", "stroke", "strokeWidth"] },
    },
};
