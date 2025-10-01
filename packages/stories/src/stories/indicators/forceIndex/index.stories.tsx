import type { Meta, StoryObj } from "@storybook/react-vite";
import ForceIndicator from "./ForceIndicator";

const meta: Meta = {
    title: "Indicators/Force Index",
    component: ForceIndicator,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ForceIndex: Story = {
    args: {},
    parameters: {
        controls: { include: [] },
    },
};
