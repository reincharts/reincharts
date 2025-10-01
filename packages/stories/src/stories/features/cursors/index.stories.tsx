import type { Meta, StoryObj } from "@storybook/react-vite";
import Cursors from "./Cursors";

const meta: Meta = {
    title: "Features/Cursors",
    component: Cursors,
    argTypes: {
        snapX: {
            control: "boolean",
            description: "Controls whether the X coordinate of the cursor snaps to the nearest data point.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        strokeStyle: {
            control: "color",
            description: "Color of the cursor lines.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "rgba(55, 71, 79, 0.8)" },
            },
        },
        useXCursorShape: {
            control: "boolean",
            description: "Whether to use a custom shape for the X cursor.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        disableYCursor: {
            control: "boolean",
            description: "Whether to disable the Y cursor line.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        xCursorShapeFillStyle: {
            control: "color",
            description: "Fill for the custom XCursorShape. Can be color or custom function.",
            table: {
                type: { summary: "string | ((currentItem: any) => string)" },
                defaultValue: { summary: "rgba(0, 0, 0, 0.5)" },
            },
        },
        xCursorShapeStrokeStyle: {
            control: "color",
            description: "Stroke for the custom XCursorShape. Can be color or custom function.",
            table: {
                type: { summary: "string | ((currentItem: any) => string)" },
                defaultValue: { summary: "rgba(0, 0, 0, 0.5)" },
            },
        },
        crosshair: {
            control: "boolean",
            description: "Whether to show crosshair cursor.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        strokeDasharray: {
            control: "select",
            options: [
                "Solid",
                "ShortDash",
                "ShortDash2",
                "ShortDot",
                "ShortDashDot",
                "ShortDashDotDot",
                "Dot",
                "Dash",
                "LongDash",
                "DashDot",
                "LongDashDot",
                "LongDashDotDot",
            ],
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "Cursor Dependent", detail: "ShortDash for Cursor, Dash for CrossHairCursor" },
            },
        },
        xCursorShapeStrokeDasharray: {
            control: "select",
            description: "Stroke dash style for the custom XCursorShape.",
            options: [
                "Solid",
                "ShortDash",
                "ShortDash2",
                "ShortDot",
                "ShortDashDot",
                "ShortDashDotDot",
                "Dot",
                "Dash",
                "LongDash",
                "DashDot",
                "LongDashDot",
                "LongDashDotDot",
            ],
            table: {
                type: { summary: "string" },
            },
        },
        strokeWidth: {
            control: "number",
            description: "Width of the cursor lines.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Cursor: Story = {
    args: {
        cursor: "cursor",
        snapX: true,
        disableYCursor: false,
        strokeStyle: "rgba(55, 71, 79, 0.8)",
        strokeDasharray: "ShortDash",
        useXCursorShape: false,
        xCursorShapeFillStyle: "rgba(0, 0, 0, 0.5)",
        xCursorShapeStrokeStyle: "rgba(0, 0, 0, 0.5)",
    },
    parameters: {
        controls: {
            include: [
                "snapX",
                "xCursorShapeStrokeDasharray",
                "strokeStyle",
                "useXCursorShape",
                "disableYCursor",
                "xCursorShapeFillStyle",
                "xCursorShapeStrokeStyle",
                "strokeDasharray",
            ],
        },
    },
};

export const CursorCustomShape: Story = {
    args: {
        cursor: "cursor",
        snapX: true,
        disableYCursor: false,
        useXCursorShape: true,
        strokeStyle: "rgba(55, 71, 79, 0.8)",
        strokeDasharray: "ShortDash",
        xCursorShapeFillStyle: (currentItem: any) => {
            return currentItem && currentItem.close > currentItem.open
                ? "rgba(0, 255, 0, 0.25)"
                : "rgba(255, 0, 0, 0.25)";
        },
        xCursorShapeStrokeStyle: (currentItem: any) => {
            return currentItem && currentItem.close > currentItem.open ? "rgba(0, 255, 0, 1)" : "rgba(255, 0, 0, 1)";
        },
        xCursorShapeStrokeDasharray: "LongDash",
    },
    parameters: {
        controls: {
            include: [
                "snapX",
                "disableYCursor",
                "useXCursorShape",
                "strokeStyle",
                "strokeDasharray",
                "xCursorShapeStrokeDasharray",
            ],
        },
    },
};

export const Crosshair: Story = {
    args: {
        crosshair: true,
        snapX: true,
        strokeStyle: "rgba(55, 71, 79, 0.8)",
        strokeDasharray: "Dash",
        strokeWidth: 1,
    },
    parameters: {
        controls: { include: ["snapX", "strokeStyle", "strokeDasharray", "strokeWidth"] },
    },
};
