import type { Meta, StoryObj } from "@storybook/react-vite";
import CompareIndicator from "./CompareIndicator";

const meta: Meta = {
    title: "Indicators/Compare",
    component: CompareIndicator,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Compare: Story = {
    args: {},
    parameters: {
        controls: { include: [] },
    },
};
