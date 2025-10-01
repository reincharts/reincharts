import type { Meta, StoryObj } from "@storybook/react-vite";
import { scaleLog, scaleUtc } from "d3-scale";
import { Daily } from "./Scales";

const meta: Meta = {
    title: "Features/Scales",
    component: Daily,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ContinuousScale: Story = {
    args: {},
    parameters: {
        controls: { include: [] },
    },
};

export const UtcScale: Story = {
    args: {
        xScale: scaleUtc(),
    },
    parameters: {
        controls: { include: [] },
    },
};

export const LogScale: Story = {
    args: {
        yScale: scaleLog(),
    },
    parameters: {
        controls: { include: [] },
    },
};
