import type { Meta, StoryObj } from "@storybook/react-vite";
import Coordinates from "./Coordinates";

const meta: Meta = {
    title: "Features/Coordinates",
    component: Coordinates,
    argTypes: {
        arrowWidth: {
            control: "number",
            description: "Width of the coordinate arrows.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "0" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Edge: Story = {
    args: {
        arrowWidth: 0,
    },
    parameters: {
        controls: { include: ["arrowWidth"] },
    },
};

export const Arrows: Story = {
    args: {
        arrowWidth: 10,
    },
    parameters: {
        controls: { include: ["arrowWidth"] },
    },
};
