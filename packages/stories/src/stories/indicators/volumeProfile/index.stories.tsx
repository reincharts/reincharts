import type { Meta, StoryObj } from "@storybook/react-vite";
import VolumeProfile from "./VolumeProfile";

const meta: Meta = {
    title: "Indicators/Volume Profile",
    component: VolumeProfile,
    argTypes: {
        bins: {
            description: "Number of bins for the volume profile histogram.",
            control: { type: "number" },
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "20" },
            },
        },
        bySession: {
            description: "Whether to split the volume profile by session.",
            control: { type: "boolean" },
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        maxProfileWidthPercent: {
            description: "Maximum width of the volume profile as a percent of chart width.",
            control: { type: "number" },
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "50" },
            },
        },
        orient: {
            description: "Orientation of the volume profile.",
            control: "select",
            options: ["left", "right"],
            table: {
                type: { summary: "left | right" },
                defaultValue: { summary: "left" },
            },
        },
        sessionBackground: {
            description: "Background color for session highlighting.",
            control: { type: "color" },
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "rgba(70, 130, 180, 0.3)" },
            },
        },
        showSessionBackground: {
            description: "Show background for sessions.",
            control: { type: "boolean" },
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        stroke: {
            description: "Stroke color for volume profile bars.",
            control: { type: "color" },
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#FFFFFF" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Chart: Story = {
    name: "Volume Profile",
    args: {
        bins: 20,
        bySession: false,
        maxProfileWidthPercent: 50,
        orient: "left",
        sessionBackground: "rgba(70, 130, 180, 0.3)",
        showSessionBackground: false,
        stroke: "#FFFFFF",
    },
    parameters: {
        controls: {
            include: [
                "bins",
                "bySession",
                "maxProfileWidthPercent",
                "orient",
                "sessionBackground",
                "showSessionBackground",
                "stroke",
            ],
        },
    },
};
