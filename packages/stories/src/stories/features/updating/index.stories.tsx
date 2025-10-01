import type { Meta, StoryObj } from "@storybook/react-vite";
import { Updating } from "./BasicLineSeries";

const meta: Meta = {
    title: "Features/Updating",
    component: Updating,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Continuous: Story = {
    args: {},
    parameters: {
        controls: { include: [] },
    },
};
