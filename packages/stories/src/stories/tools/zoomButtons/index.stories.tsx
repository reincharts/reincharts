import type { Meta, StoryObj } from "@storybook/react-vite";
import ZoomButtonsChart from "./ZoomButtonsChart";

const meta: Meta = {
    title: "Tools/Zoom Buttons",
    component: ZoomButtonsChart,
    argTypes: {
        fill: {
            control: "color",
            description: "Fill color for the zoom buttons.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "rgba(255,255,255,0.75)" },
            },
        },
        heightFromBase: {
            control: "number",
            description: "Height offset from the base position.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "32" },
            },
        },
        r: {
            control: "number",
            description: "Radius of the zoom buttons.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "16" },
            },
        },
        stroke: {
            control: "color",
            description: "Stroke color for the button borders.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#e0e3eb" },
            },
        },
        strokeWidth: {
            control: "number",
            description: "Width of the button stroke.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
        textFill: {
            control: "color",
            description: "Fill color for the button text.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#000000" },
            },
        },
        zoomMultiplier: {
            control: { type: "number", step: 0.5 },
            description: "Multiplier for zoom sensitivity.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1.5" },
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const ZoomButtons: Story = {
    args: {
        fill: "rgba(255,255,255,0.75)",
        heightFromBase: 32,
        r: 16,
        stroke: "#e0e3eb",
        strokeWidth: 1,
        textFill: "#000000",
        zoomMultiplier: 1.5,
    },
    parameters: {
        controls: {
            include: ["fill", "heightFromBase", "r", "stroke", "strokeWidth", "textFill", "zoomMultiplier"],
        },
    },
};
