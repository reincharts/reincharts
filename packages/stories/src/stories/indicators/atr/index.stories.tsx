import type { Meta, StoryObj } from "@storybook/react-vite";
import ATRIndicator from "./AtrIndicator";

const meta: Meta = {
    title: "Indicators/ATR",
    component: ATRIndicator,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ATR: Story = {
    args: {},
    parameters: {
        controls: { include: [] },
    },
};
