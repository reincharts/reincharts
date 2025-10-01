import type { Meta, StoryObj } from "@storybook/react-vite";
import Annotated from "./Annotated";

const meta: Meta = {
    title: "Features/Annotate",
    component: Annotated,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LabelAnnotation: Story = {
    args: {
        labelAnnotation: true,
    },
    parameters: {
        controls: { include: [""] },
    },
};

export const SVGPathAnnotation: Story = {
    args: {
        svgAnnotation: true,
    },
    parameters: {
        controls: { include: [""] },
    },
};
