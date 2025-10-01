import type { Meta, StoryObj } from "@storybook/react-vite";
import SARIndicator from "./SarIndicator";

const meta: Meta = {
    title: "Indicators/SAR",
    component: SARIndicator,
    argTypes: {
        fillStyle: {
            description: "Colors for SAR dots when falling or rising.",
            control: "object",
            table: {
                type: { summary: "{ falling: string; rising: string }" },
                defaultValue: { summary: '{ falling: "#4682B4", rising: "#15EC2E" }' },
            },
        },
        strokeStyle: {
            description: "Stroke colors for SAR dots when falling or rising.",
            control: "object",
            table: {
                type: { summary: "{ falling: string; rising: string }" },
                defaultValue: { summary: '{ falling: "#4682B4", rising: "#15EC2E" }' },
            },
        },
        highlightOnHover: {
            description: "Highlight SAR dots on hover.",
            control: "boolean",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        strokeWidth: {
            description: "Stroke width of the SAR dots.",
            control: "number",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SAR: Story = {
    args: {
        fillStyle: {
            falling: "#4682B4",
            rising: "#15EC2E",
        },
        strokeStyle: {
            falling: "#4682B4",
            rising: "#15EC2E",
        },
        strokeWidth: 1,
        highlightOnHover: false,
    },
    parameters: {
        controls: { include: ["fillStyle", "strokeStyle", "highlightOnHover", "strokeWidth"] },
    },
};
