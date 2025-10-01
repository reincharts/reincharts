import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import BrushChart from "./BrushChart";

const meta: Meta = {
    title: "Tools/Brush",
    component: BrushChart,
    argTypes: {
        enabled: {
            control: "boolean",
            description: "Enable or disable the brush selection tool.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        strokeStyle: {
            control: "color",
            description: "Color of the brush selection border.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#000000" },
            },
        },
        fillStyle: {
            control: "color",
            description: "Fill color of the brush selection area.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "rgba(150, 150, 150, 0.3)" },
            },
        },
        strokeDashArray: {
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
            description: "Dash style for the brush border.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "ShortDash" },
            },
        },
        strokeWidth: {
            control: "number",
            description: "Width of the brush selection border.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Brush: Story = {
    args: {
        enabled: true,
        strokeStyle: "#000000",
        fillStyle: "rgba(150, 150, 150, 0.3)",
        strokeDashArray: "ShortDash",
        strokeWidth: 1,
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();

        function onChange() {
            updateArgs({ enabled: false });
        }

        return <BrushChart {...args} enabled={args.enabled} disableInStory={onChange} />;
    },
    parameters: {
        controls: {
            include: ["enabled", "strokeStyle", "fillStyle", "strokeDashArray", "strokeWidth"],
        },
    },
};
