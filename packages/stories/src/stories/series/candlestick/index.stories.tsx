import type { Meta, StoryObj } from "@storybook/react-vite";
import { Daily } from "./BasicCandlestick";

const meta: Meta = {
    title: "Series/Candlestick",
    component: Daily,
    argTypes: {
        candleStrokeWidth: {
            description: "Width of the candle stroke.",
            control: "number",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "0.5" },
            },
        },
        clip: {
            description: "Whether to clip the series to chart area.",
            control: "boolean",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        fillStyle: {
            description: "Fill color or function for candles.",
            control: "color",
            table: {
                type: { summary: "string | (data) => string" },
                defaultValue: { summary: '(d) => (d.close > d.open ? "#26a675ff" : "#e93b3bff")' },
            },
        },
        strokeStyle: {
            description: "Stroke color or function for candles.",
            control: "color",
            table: {
                type: { summary: "string | (data) => string" },
                defaultValue: { summary: "none" },
            },
        },
        wickStroke: {
            description: "Stroke color or function for candle wicks.",
            control: "color",
            table: {
                type: { summary: "string | (data) => string" },
                defaultValue: { summary: '(d) => (d.close > d.open ? "#26a675ff" : "#e93b3bff")' },
            },
        },
        widthRatio: {
            description: "Ratio of candle width to available space.",
            control: { type: "number", step: 0.1 },
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "0.8" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Candlestick: Story = {
    args: {
        clip: true,
        strokeStyle: "rgba(0, 0, 0, 0)",
        candleStrokeWidth: 0.5,
        widthRatio: 0.8,
    },
    parameters: {
        controls: { include: ["candleStrokeWidth", "clip", "fillStyle", "strokeStyle", "wickStroke", "widthRatio"] },
    },
};
