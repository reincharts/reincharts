import type { Meta, StoryObj } from "@storybook/react-vite";
import { Daily } from "./BasicOHLCSeries";

const meta: Meta = {
    title: "Series/OHLC",
    component: Daily,
    argTypes: {
        clip: {
            control: "boolean",
            description: "Whether to clip the OHLC series to chart bounds.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        stroke: {
            control: "color",
            description: "Stroke color for OHLC bars. Can be a string or a function.",
            table: {
                type: { summary: "string | ((data: any) => string)" },
                defaultValue: {
                    summary:
                        '(d) => (isDefined(d.absoluteChange) ? (d.absoluteChange > 0 ? "#26a675ff" : "#e93b3bff") : "#000000")',
                },
            },
        },
        strokeWidth: {
            control: "number",
            description: "Stroke width for OHLC bars.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const OHLC: Story = {
    args: {
        clip: true,
        strokeWidth: 1,
    },
    parameters: {
        controls: { include: ["clip", "stroke", "strokeWidth"] },
    },
};
