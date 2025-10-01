import type { Meta, StoryObj } from "@storybook/react-vite";
import { Daily } from "./BasicBarSeries";

const meta: Meta = {
    title: "Series/Bar",
    component: Daily,
    argTypes: {
        fillStyle: {
            control: "color",
            description: "Fill color for the bars.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#2196f3" },
            },
        },
        width: {
            description: "Width of each bar, or a function to determine width. Defaults to plotDataLengthBarWidth.",
            control: "number",
            table: {
                type: { summary: "number | ((props: { widthRatio: number }, moreProps: any) => number)" },
                defaultValue: {
                    summary: "plotDataLengthBarWidth",
                    detail: "Function that calculates bar width based on the amount of items in the plot data and the distance between the first and last items.",
                },
            },
        },
        baseAt: {
            control: false,
            description: "Function or number for the base of the bars.",
            table: {
                type: {
                    summary: "number | function",
                    detail: "number | ((xScale: ScaleContinuousNumeric<number, number> | ScaleTime<number, number>, yScale: ScaleContinuousNumeric<number, number>, d: [number, number], moreProps: any) => number);",
                },
                defaultValue: { summary: "head(yScale.range())" },
            },
        },
        clip: {
            control: "boolean",
            description: "Whether to clip the bars to the chart area.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        strokeStyle: {
            control: "color",
            description: "Stroke color for the bar borders.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: undefined },
            },
        },
        strokeWidth: {
            control: "number",
            description: "Width of the bar stroke.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
        swapScales: {
            control: "boolean",
            description: "Swap X and Y scales.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        widthRatio: {
            control: { type: "number", step: 0.1 },
            description: "Ratio of bar width to available space.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "0.8" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Bar: Story = {
    args: {
        fillStyle: "rgba(70, 130, 180, 0.5)",
        clip: true,
        strokeStyle: undefined,
        strokeWidth: 1,
        swapScales: false,
        widthRatio: 0.8,
        width: undefined,
    },
    render: function Render(args) {
        return <Daily {...args} barWidth={args.width} />;
    },
    parameters: {
        controls: { include: ["fillStyle", "width", "clip", "strokeStyle", "strokeWidth", "widthRatio"] },
    },
};
