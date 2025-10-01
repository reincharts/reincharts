import type { Meta, StoryObj } from "@storybook/react-vite";
import RSIIndicator from "./RsiIndicator";

const meta: Meta = {
    title: "Indicators/RSI",
    component: RSIIndicator,
    argTypes: {
        strokeStyle: {
            description: "Stroke colors for RSI lines (line is a fallback for outsideThreshold, insideThreshold)",
            control: "object",
            table: {
                type: {
                    summary: "object",
                    detail: "{ line: string; top: string; middle: string; bottom: string; outsideThreshold: string; insideThreshold: string }",
                },
                defaultValue: {
                    summary:
                        '{ line: "#000000", top: "#B8C2CC", middle: "#8795A1", bottom: "#B8C2CC", outsideThreshold: "#b300b3", insideThreshold: "#ffccff" }',
                },
            },
        },
        strokeDasharray: {
            description: "Dash style for RSI lines (Uses same dash array types as other components)",
            control: "object",
            table: {
                type: { summary: "object", detail: "{ line: string; top: string; middle: string; bottom: string }" },
                defaultValue: {
                    summary: '{ line: "Solid", top: "ShortDash", middle: "ShortDash", bottom: "ShortDash" }',
                },
            },
        },
        strokeWidth: {
            description: "Width for RSI lines",
            control: "object",
            table: {
                type: {
                    summary: "object",
                    detail: "{ outsideThreshold: number; insideThreshold: number; top: number; middle: number; bottom: number }",
                },
                defaultValue: { summary: "{ outsideThreshold: 1, insideThreshold: 1, top: 1, middle: 1, bottom: 1 }" },
            },
        },
        overSold: {
            description: "OverSold threshold (upper)",
            control: "number",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "70" },
            },
        },
        middle: {
            description: "Middle threshold",
            control: "number",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "50" },
            },
        },
        overBought: {
            description: "OverBought threshold (lower)",
            control: "number",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "30" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const RSI: Story = {
    args: {
        strokeStyle: {
            line: "#000000",
            top: "#B8C2CC",
            middle: "#8795A1",
            bottom: "#B8C2CC",
            outsideThreshold: "#b300b3",
            insideThreshold: "#ffccff",
        },
        strokeDasharray: {
            line: "Solid",
            top: "ShortDash",
            middle: "ShortDash",
            bottom: "ShortDash",
        },
        strokeWidth: {
            outsideThreshold: 1,
            insideThreshold: 1,
            top: 1,
            middle: 1,
            bottom: 1,
        },
        overSold: 70,
        middle: 50,
        overBought: 30,
    },
    parameters: {
        controls: {
            include: ["strokeStyle", "strokeDasharray", "strokeWidth", "overSold", "middle", "overBought"],
        },
    },
};
