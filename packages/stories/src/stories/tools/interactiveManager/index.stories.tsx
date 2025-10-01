import type { Meta, StoryObj } from "@storybook/react-vite";
import InteractiveManagerChart from "./InteractiveManagerChart";

const meta: Meta = {
    title: "Tools/Interactive Manager",
    component: InteractiveManagerChart,
    argTypes: {
        sidebarPosition: {
            control: "select",
            options: ["left", "right", "top", "bottom"],
            description: "Position of the interactive tools sidebar (left, right, top, bottom).",
            table: {
                type: { summary: '"left" | "right" | "top" | "bottom"' },
                defaultValue: { summary: '"left"' },
            },
        },
        showSidebar: {
            control: "boolean",
            description: "Whether to show the sidebar with interactive tool buttons.",
            table: {
                type: { summary: "boolean" },
                defaultValue: { summary: "true" },
            },
        },
        size: {
            control: "number",
            description: "Size of the sidebar (width for vertical, height for horizontal).",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "54" },
            },
        },
        onInteractiveToggle: {
            description: "Callback fired when an interactive tool is toggled on/off.",
            control: false,
            table: {
                type: { summary: "(type: string, enabled: boolean) => void" },
                defaultValue: { summary: "undefined" },
            },
        },
        onSave: {
            description: "Callback fired when the save button is clicked.",
            control: false,
            table: {
                type: { summary: "(data: string) => void" },
                defaultValue: { summary: "undefined" },
            },
        },
        interactiveIcons: {
            description: "Mapping of icons to be shown in the toolbar for interactive components.",
            control: false,
            table: {
                type: { summary: "Record<string, React.ElementType>" },
                defaultValue: { summary: "INTERACTIVE_COMPONENTS object" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InteractiveManager: Story = {
    args: {
        sidebarPosition: "left",
        showSidebar: true,
        size: 54,
    },
    parameters: {
        controls: {
            include: ["sidebarPosition", "showSidebar", "size", "onInteractiveToggle", "onSave", "interactiveIcons"],
        },
    },
};
