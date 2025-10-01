import type { Meta, StoryObj } from "@storybook/react-vite";
import { lastVisibleItemBasedZoomAnchor, mouseBasedZoomAnchor, rightDomainBasedZoomAnchor } from "@reincharts/core";

import Interaction from "./Interaction";

const meta = {
    title: "Features/Interaction",
    component: Interaction,
    argTypes: {
        disableInteraction: {
            control: "boolean",
            description: "Controls whether to disable interaction with the chart.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        disablePan: {
            control: "boolean",
            description: "Controls whether to disable panning the chart.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        disableZoom: {
            control: "boolean",
            description: "Controls whether to disable zooming in/out on the chart.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "false" },
            },
        },
        clamp: {
            control: "select",
            options: [true, false, "left", "right", "both"],
            description:
                'Controls whether the chart data is clamped to data bounds. Can be boolean to clamp both sides, a string to specify which side to clamp ("left", "right", or "both"), or a function that returns a range to clamp to.',
            table: {
                type: {
                    summary: "boolean | string | function",
                    detail: 'boolean | ("left" | "right" | "both") | (domain: [number, number], items: [number, number]) => [number, number]',
                },
                defaultValue: { summary: "false" },
            },
        },
    },
} satisfies Meta<typeof Interaction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Clamp: Story = {
    args: {
        clamp: true,
    },
    parameters: {
        controls: { include: ["clamp"] },
    },
};

export const DisableInteraction: Story = {
    args: {
        disableInteraction: true,
    },
    parameters: {
        controls: { include: ["disableInteraction"] },
    },
};

export const DisablePan: Story = {
    args: {
        disablePan: true,
    },
    parameters: {
        controls: { include: ["disablePan"] },
    },
};

export const DisableZoom: Story = {
    args: {
        disableZoom: true,
    },
    parameters: {
        controls: { include: ["disableZoom"] },
    },
};

export const ZoomAnchorToMouse: Story = {
    args: {
        zoomAnchor: mouseBasedZoomAnchor,
    },
    parameters: {
        controls: { include: [""] },
    },
};

export const ZoomAnchorToLastVisible: Story = {
    args: {
        zoomAnchor: lastVisibleItemBasedZoomAnchor,
    },
    parameters: {
        controls: { include: [""] },
    },
};

export const ZoomAnchorToBounds: Story = {
    args: {
        zoomAnchor: rightDomainBasedZoomAnchor,
    },
    parameters: {
        controls: { include: [""] },
    },
};
