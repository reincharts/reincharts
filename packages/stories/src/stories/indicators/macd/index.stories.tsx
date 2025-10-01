import type { Meta, StoryObj } from "@storybook/react-vite";
import MACDIndicator from "./MacdIndicator";

const meta: Meta = {
    title: "Indicators/MACD",
    component: MACDIndicator,
    argTypes: {
        fillStyle: {
            description: "Object specifying divergence bar fill color.",
            control: "object",
            table: {
                type: { summary: "{ divergence: string }" },
                defaultValue: { summary: '{ divergence: "rgba(70, 130, 180, 0.6)" }' },
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
            description: "Object specifying stroke colors for MACD, signal, and zero lines.",
            control: "object",
            table: {
                type: { summary: "{ macd: string; signal: string; zero: string }" },
                defaultValue: { summary: '{ macd: "#0093FF", signal: "#D84315", zero: "rgba(0, 0, 0, 0.3)" }' },
            },
        },
        widthRatio: {
            description: "Ratio of bar width to available space.",
            control: { type: "number", step: 0.1 },
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "0.5" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MACD: Story = {
    args: {
        fillStyle: { divergence: "rgba(70, 130, 180, 0.6)" },
        clip: true,
        strokeStyle: {
            macd: "#0093FF",
            signal: "#D84315",
            zero: "rgba(0, 0, 0, 0.3)",
        },
        widthRatio: 0.5,
    },
    parameters: {
        controls: {
            include: ["fillStyle", "clip", "strokeStyle", "widthRatio", "width"],
        },
    },
};
