import { functor } from "@reincharts/core";
import * as React from "react";

export interface CircleMarkerProps {
    /** CSS class name for styling the circle marker. */
    readonly className?: string;
    /** Fill color for the circle marker. */
    readonly fillStyle?: string;
    /** Point data containing position and associated data. */
    readonly point: {
        x: number;
        y: number;
        data: any;
    };
    /** Radius of the circle marker, can be static number or function based on data. */
    readonly r: number | ((data: any) => number);
    /** Stroke color for the circle marker border. */
    readonly strokeStyle?: string;
    /** Width of the stroke around the circle marker. */
    readonly strokeWidth?: number;
}

export class CircleMarker extends React.Component<CircleMarkerProps> {
    public static defaultProps = {
        fillStyle: "#4682B4",
    };

    public static drawOnCanvas = (
        props: CircleMarkerProps,
        point: { x: number; y: number; data: unknown },
        ctx: CanvasRenderingContext2D,
    ) => {
        const { strokeStyle, fillStyle, r, strokeWidth } = props;

        if (strokeStyle !== undefined) {
            ctx.strokeStyle = strokeStyle;
        }
        if (strokeWidth !== undefined) {
            ctx.lineWidth = strokeWidth;
        }
        if (fillStyle !== undefined) {
            ctx.fillStyle = fillStyle;
        }

        const { data, x, y } = point;

        const radius = functor(r)(data);

        ctx.moveTo(x, y);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        if (strokeStyle !== undefined) {
            ctx.stroke();
        }
    };

    public render() {
        const { className, strokeStyle, strokeWidth, fillStyle, point, r } = this.props;
        const radius = functor(r)(point.data);

        return (
            <circle
                className={className}
                cx={point.x}
                cy={point.y}
                stroke={strokeStyle}
                strokeWidth={strokeWidth}
                fill={fillStyle}
                r={radius}
            />
        );
    }
}
