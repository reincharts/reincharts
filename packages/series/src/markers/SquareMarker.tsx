import * as React from "react";
import { functor } from "@reincharts/core";

export interface SquareProps {
    /** CSS class name for styling the square marker. */
    readonly className?: string;
    /** Fill color for the square marker. */
    readonly fillStyle?: string;
    /** Point data containing position and associated data. */
    readonly point: {
        x: number;
        y: number;
        data: any;
    };
    /** Stroke color for the square marker border. */
    readonly strokeStyle?: string;
    /** Width of the stroke around the square marker. */
    readonly strokeWidth?: number;
    /** Width of the square marker, can be static number or function based on data. */
    readonly width: number | ((data: any) => number);
}

export class Square extends React.Component<SquareProps> {
    public static defaultProps = {
        fillStyle: "#4682B4",
        className: "reincharts-marker-rect",
    };

    public static drawOnCanvas = (
        props: SquareProps,
        point: { x: number; y: number; data: unknown },
        ctx: CanvasRenderingContext2D,
    ) => {
        const { strokeStyle, fillStyle, strokeWidth, width } = props;

        if (strokeStyle !== undefined) {
            ctx.strokeStyle = strokeStyle;
        }
        if (strokeWidth !== undefined) {
            ctx.lineWidth = strokeWidth;
        }
        if (fillStyle !== undefined) {
            ctx.fillStyle = fillStyle;
        }

        const w = functor(width)(point.data);
        const x = point.x - w / 2;
        const y = point.y - w / 2;
        ctx.beginPath();
        ctx.rect(x, y, w, w);
        ctx.fill();

        if (strokeStyle !== undefined) {
            ctx.stroke();
        }
    };

    public render() {
        const { className, strokeStyle, strokeWidth, fillStyle, point, width } = this.props;
        const w = functor(width)(point.data);
        const x = point.x - w / 2;
        const y = point.y - w / 2;

        return (
            <rect
                className={className}
                x={x}
                y={y}
                stroke={strokeStyle}
                strokeWidth={strokeWidth}
                fill={fillStyle}
                width={w}
                height={w}
            />
        );
    }
}
