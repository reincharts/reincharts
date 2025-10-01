import type { Meta, StoryObj } from "@storybook/react-vite";
import Annotations from "./Annotations";

const meta: Meta = {
    title: "Features/Label",
    component: Annotations,
    argTypes: {
        fillStyle: {
            control: "color",
            description: "Fill color for the label.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "#dcdcdc" },
            },
        },
        text: {
            control: {
                type: "text",
            },
            description: "Text content of the text label.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "" },
            },
        },
        fontFamily: {
            control: { type: "text" },
            description: "Font family for the text label.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif" },
            },
        },
        fontSize: {
            control: { type: "number" },
            description: "Font size for the text label.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "64" },
            },
        },
        fontWeight: {
            control: "select",
            options: [
                "normal",
                "bold",
                "bolder",
                "lighter",
                "100",
                "200",
                "300",
                "400",
                "500",
                "600",
                "700",
                "800",
                "900",
            ],
            description: "Font weight for the text label.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "bold" },
            },
        },
        rotate: {
            control: { type: "number" },
            description: "Rotation angle (degrees) for the label.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "0" },
            },
        },
        textAlign: {
            control: "select",
            options: ["left", "right", "center", "start", "end"],
            description: "Text alignment for the text label.",
            table: {
                type: { summary: "CanvasTextAlign" },
                defaultValue: { summary: "center" },
            },
        },
        svgPath: {
            control: { type: "text" },
            description: "SVG path string for the path label.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "M0 0 L10 0 L10 10 L0 10 Z" },
            },
        },
        strokeStyle: {
            control: "color",
            description: "Stroke color for the path label.",
            table: {
                type: { summary: "string" },
                defaultValue: { summary: "undefined" },
            },
        },
        strokeWidth: {
            control: { type: "number" },
            description: "Stroke width for the path label.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "undefined" },
            },
        },
        scale: {
            control: { type: "number" },
            description: "Scale factor for the path label.",
            table: {
                type: { summary: "number" },
                defaultValue: { summary: "1" },
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TextLabel: Story = {
    args: {
        useTextLabel: true,
        fillStyle: "#76b900",
        text: "NVDA",
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 64,
        fontWeight: "bold",
        rotate: 0,
        textAlign: "center",
    },
    parameters: {
        controls: { include: ["fillStyle", "text", "fontFamily", "fontSize", "fontWeight", "rotate", "textAlign"] },
    },
};

export const SvgPathLabel: Story = {
    args: {
        useSvgPathLabel: true,
        fillStyle: "#4d9071",
        strokeStyle: "rgba(0, 0, 0, 0)",
        strokeWidth: 1,
        scale: 2,
        rotate: 0,
        svgPath:
            "M111.692 125.904c-4.4-3.526-2.905-10.962-8.585-12.72-2.84-.594-6.132-4.808-8.704-3.308-4.794-1.395-9.83-6.395-13.928-1.321-4.03-2.914-8.514-5.155-13.56-5.72-2.821-.634-5.831-1.913-7.506 1.179-3.043 3.39-6.828 6.19-9.516 9.862-3.97 1.802.966 6.173-1.155 7.078-4.297 1.43-6.465-1.11-6.43-3.598-2.241 2.675-2.088 5.3-.122 8.017-3.951.067-9.593 1.132-7.458-4.63.089-2.864-.766-4.89 1.78-7.054 1.88-3.184 5.269-5.828 5.053-9.844 4.94-.969 2.412-6.33 3.499-10.013-.166-3.143 1.638-5.657 2.94-8.372.385-3.73-3.404-7.279-4.415-11.003-2.81-5.6-2.348-11.414-1.199-17.364.023-6.756 4.613-5.747 7.121-8.193 1 3.708 2.78 5.971-1.627 9.735-4.376 4.363-1.044 11.798 2.007 15.995 3.38 4.565 9.5-1.151 13.973-1.643 7.091-2.233 14.678-1.711 21.997-2.613 4.916.375 9.264-.829 13.3-3.579 5.81-2.518 11.945-5.445 18.436-4.982 5.82-1.952 11.547-4.781 17.841-4.68 5.473-.577 11.234-.243 16.159 2.307 5.157.795 8.446 6.65 14.015 5.766 2.24 1.71-6.524 2.807-1.114 2.448 4.23.923-4.962 3.874-6.719 1.624-3.683-2.54-8.55-3.215-8.26 2.63-1.593 5.045-2.618 10.32-4.683 15.189-4.597 3.938-8.576-1.63-11.467-3.152-4.205 6.243-6.195 13.611-9.103 20.435-2.3 3.154-8.197 6.71-9.047 9.093 1.022 2.55 6.804 6.77.734 5.946 1.667 2.57 8.595 8.167 1.404 6.765-1.817-.204-4.03.387-5.661-.28",
    },
    parameters: {
        controls: { include: ["fillStyle", "strokeStyle", "strokeWidth", "scale", "rotate", "svgPath"] },
    },
};
