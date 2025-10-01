import type { Meta, StoryObj } from "@storybook/react-vite";
import Tooltips from "./Tooltips";

const meta: Meta = {
    title: "Features/Tooltips",
    component: Tooltips,
    argTypes: {
        background: {
            control: "object",
            description: "Background style for HoverTooltip.",
            table: {
                type: {
                    summary: "object",
                    detail: "{ fillStyle?: string; height?: number; strokeStyle?: string; width?: number; }",
                },
                defaultValue: { summary: '{ fillStyle: "rgba(33, 148, 243, 0.1)" }' },
            },
        },
        toolTipFillStyle: {
            control: "color",
            description: "Fill style for HoverTooltip tooltip box.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "rgba(250, 250, 250, 1)" },
            },
        },
        toolTipStrokeStyle: {
            control: "color",
            description: "Stroke style for HoverTooltip tooltip box.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "rgba(33, 148, 243)" },
            },
        },
        toolTipStrokeWidth: {
            control: "number",
            description: "Stroke width for HoverTooltip tooltip box.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
        fontFill: {
            control: "color",
            description: "Font color for HoverTooltip.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#000000" },
            },
        },
        fontFamily: {
            control: "text",
            description: "Font family for tooltips.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "-apple-system, system-ui, 'Helvetica Neue', Ubuntu, sans-serif" },
            },
        },
        fontSize: {
            control: "number",
            description: "Font size for tooltips.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "14" },
            },
        },
        origin: {
            control: "object",
            description: "Origin position for OHLCTooltip.",
            table: {
                type: { summary: "[number, number]" },
                defaultValue: { summary: "[0, 0]" },
            },
        },
        fontWeight: {
            control: "select",
            options: [
                "normal",
                "bold",
                "bolder",
                "lighter",
                "100",
                "200",
                "300",
                "400",
                "500",
                "600",
                "700",
                "800",
                "900",
            ],
            description: "Font weight for OHLCTooltip text.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "normal" },
            },
        },
        labelFill: {
            control: "color",
            description: "Label fill color for OHLCTooltip.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#4682B4" },
            },
        },
        labelFontWeight: {
            control: "select",
            options: [
                "normal",
                "bold",
                "bolder",
                "lighter",
                "100",
                "200",
                "300",
                "400",
                "500",
                "600",
                "700",
                "800",
                "900",
            ],
            description: "Font weight for OHLCTooltip label.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "normal" },
            },
        },
        textFill: {
            control: "color",
            description: "Text fill color for OHLCTooltip values.",
            table: {
                type: { summary: "string | ((item: any) => string)" },
                defaultValue: { summary: "black" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const HoverTooltip: Story = {
    args: {
        hoverTooltip: true,
        toolTipFillStyle: "rgba(250, 250, 250, 1)",
        toolTipStrokeStyle: "rgba(33, 148, 243)",
        toolTipStrokeWidth: 1,
        fontFill: "#000000",
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 14,
        background: {
            fillStyle: "rgba(33, 148, 243, 0.1)",
        },
    },
    parameters: {
        controls: {
            include: [
                "toolTipFillStyle",
                "toolTipStrokeStyle",
                "toolTipStrokeWidth",
                "fontFill",
                "fontFamily",
                "fontSize",
                "background",
            ],
        },
    },
};

export const OHLCTooltip: Story = {
    args: {
        fontFamily: "-apple-system, system-ui, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 11,
        fontWeight: "normal",
        labelFill: "#4682B4",
        labelFontWeight: "normal",
        origin: [8, 16],
    },
    parameters: {
        controls: {
            include: ["fontFamily", "fontSize", "fontWeight", "labelFill", "labelFontWeight", "textFill", "origin"],
        },
    },
};
