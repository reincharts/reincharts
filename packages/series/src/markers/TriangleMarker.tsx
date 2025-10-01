import * as React from "react";
import { functor } from "@reincharts/core";

export interface TriangleProps {
    /** CSS class name for styling the triangle marker. */
    readonly className?: string;
    /** Direction the triangle points, can be static or function based on data. */
    readonly direction?: "top" | "bottom" | "left" | "right" | "hide" | ((data: any) => any);
    /** Fill color for the triangle marker, can be static or function based on data. */
    readonly fillStyle?: string | ((data: any) => string);
    /** Point data containing position and associated data. */
    readonly point: {
        x: number;
        y: number;
        data: any;
    };
    /** Stroke color for the triangle marker border, can be static or function based on data. */
    readonly strokeStyle?: string | ((data: any) => string);
    /** Width of the stroke around the triangle marker. */
    readonly strokeWidth?: number;
    /** Width of the triangle marker, can be static number or function based on data. */
    readonly width?: number | ((data: any) => number);
}

export class Triangle extends React.Component<TriangleProps> {
    public static defaultProps = {
        direction: "top",
        fillStyle: "#4682B4",
        className: "reincharts-marker-triangle",
    };

    public static drawOnCanvas = (
        props: TriangleProps,
        point: { x: number; y: number; data: unknown },
        ctx: CanvasRenderingContext2D,
    ) => {
        const { fillStyle, strokeStyle, strokeWidth, width } = props;

        if (strokeStyle !== undefined) {
            ctx.strokeStyle = functor(strokeStyle)(point.data);
        }
        if (strokeWidth !== undefined) {
            ctx.lineWidth = strokeWidth;
        }
        if (fillStyle !== undefined) {
            ctx.fillStyle = functor(fillStyle)(point.data);
        }

        const w = functor(width)(point.data);
        const { x, y } = point;
        const { innerOpposite, innerHypotenuse } = getTrianglePoints(w);
        const rotationDeg = getRotationInDegrees(props, point);

        ctx.beginPath();
        ctx.moveTo(x, y - innerHypotenuse);
        ctx.lineTo(x + w / 2, y + innerOpposite);
        ctx.lineTo(x - w / 2, y + innerOpposite);

        // TODO: rotation does not work
        // example: https://gist.github.com/geoffb/6392450
        if (rotationDeg !== null && rotationDeg !== 0) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((rotationDeg * Math.PI) / 180); // 45 degrees
            ctx.fill();
            ctx.restore();
        }
        ctx.fill();

        if (strokeStyle !== undefined) {
            ctx.stroke();
        }
    };

    public render() {
        const { className, fillStyle, strokeStyle, strokeWidth, point, width } = this.props;

        const rotation = getRotationInDegrees(this.props, point);
        if (rotation == null) {
            return null;
        }

        const fillColor = functor(fillStyle)(point.data);
        const strokeColor = functor(strokeStyle)(point.data);

        const w = functor(width)(point.data);
        const { x, y } = point;
        const { innerOpposite, innerHypotenuse } = getTrianglePoints(w);
        const points = `
		${x} ${y - innerHypotenuse},
		${x + w / 2} ${y + innerOpposite},
		${x - w / 2} ${y + innerOpposite}
	    `;

        return (
            <polygon
                className={className}
                points={points}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={fillColor}
                transform={rotation !== 0 ? `rotate(${rotation}, ${x}, ${y})` : undefined}
            />
        );
    }
}

const getTrianglePoints = (width: number) => {
    const innerHypotenuse = (width / 2) * (1 / Math.cos((30 * Math.PI) / 180));
    const innerOpposite = (width / 2) * (1 / Math.tan((60 * Math.PI) / 180));
    return {
        innerOpposite,
        innerHypotenuse,
    };
};

const getRotationInDegrees = (props: TriangleProps, point: any) => {
    const { direction = Triangle.defaultProps.direction } = props;

    const directionVal = functor(direction)(point.data);
    if (directionVal === "hide") {
        return null;
    }

    let rotate = 0;
    switch (directionVal) {
        case "bottom":
            rotate = 180;
            break;
        case "left":
            rotate = -90;
            break;
        case "right":
            rotate = 90;
            break;
    }
    return rotate;
};
