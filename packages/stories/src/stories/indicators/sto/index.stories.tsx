import type { Meta, StoryObj } from "@storybook/react-vite";
import StoIndicator from "./StoIndicator";

const meta: Meta = {
    title: "Indicators/Stochastic Oscillator",
    component: StoIndicator,
    argTypes: {
        overBought: {
            description: "Y-value for the overbought threshold line",
            control: { type: "number" },
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "20" },
            },
        },
        overSold: {
            description: "Y-value for the oversold threshold line",
            control: { type: "number" },
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "80" },
            },
        },
        middle: {
            description: "Y-value for the middle threshold line",
            control: { type: "number" },
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "50" },
            },
        },
        strokeStyle: {
            description: "Stroke colors for the lines",
            control: { type: "object" },
            table: {
                type: {
                    summary: "object",
                    detail: "{ top: string; middle: string; bottom: string; dLine: string; kLine: string }",
                },
                defaultValue: {
                    summary:
                        '{ top: "rgba(150, 75, 0, 0.3)", middle: "rgba(0, 0, 0, 0.3)", bottom: "rgba(150, 75, 0, 0.3)", dLine: "#EA2BFF", kLine: "#74D400" }',
                },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const StochasticOscillator: Story = {
    args: {
        overBought: 20,
        overSold: 80,
        middle: 50,
        strokeStyle: {
            top: "rgba(150, 75, 0, 0.3)",
            middle: "rgba(0, 0, 0, 0.3)",
            bottom: "rgba(150, 75, 0, 0.3)",
            dLine: "#EA2BFF",
            kLine: "#74D400",
        },
    },
    parameters: {
        controls: { include: ["overBought", "overSold", "middle", "strokeStyle"] },
    },
};
