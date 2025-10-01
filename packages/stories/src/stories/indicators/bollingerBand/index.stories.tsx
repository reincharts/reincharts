import type { Meta, StoryObj } from "@storybook/react-vite";
import BollingerIndicator from "./BollingerIndicator";

const meta: Meta = {
    title: "Indicators/Bollinger Band",
    component: BollingerIndicator,
    argTypes: {
        fillStyle: {
            control: "color",
            description: "Fill color for the Bollinger Band area.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "rgba(38, 166, 153, 0.05)" },
            },
        },
        strokeStyle: {
            control: "object",
            description: "Stroke colors for the Bollinger Band lines (top, middle, bottom).",
            table: {
                type: { summary: "{ top: string; middle: string; bottom: string }" },
                defaultValue: { summary: '{ top: "#26a675ff", middle: "#812828", bottom: "#26a675ff" }' },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BollingerBand: Story = {
    args: {
        fillStyle: "rgba(38, 166, 153, 0.05)",
        strokeStyle: {
            top: "#26a675ff",
            middle: "#812828",
            bottom: "#26a675ff",
        },
    },
    parameters: {
        controls: { include: ["fillStyle", "strokeStyle"] },
    },
};
