import type { Meta, StoryObj } from "@storybook/react-vite";
import EMAIndicator from "./EmaIndicator";

const meta: Meta = {
    title: "Indicators/EMA",
    component: EMAIndicator,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EMA: Story = {
    args: {},
    parameters: {
        controls: { include: [] },
    },
};
