import { accessor, functor, isFiniteNumber, useRenderable, type Accessor, type Functor } from "@reincharts/core";

export interface CurrentCoordinateProps<T = any> {
    /** Value accessor of the series to mark. */
    readonly y: Accessor<T, number | undefined>;
    /** Dot radius. Default 4. */
    readonly r?: number;
    /** Dot fill (static or per datum). Defaults to theme.line. */
    readonly fill?: Functor<T, string>;
    /** Ring color around the dot. Defaults to theme.background. */
    readonly stroke?: Functor<T, string>;
    /** Ring width. Default 2. */
    readonly strokeWidth?: number;
    /** Price scale id. Default "right". */
    readonly scale?: string;
}

/** A dot on a series at the hovered bar (follows the crosshair, also when synced from another chart). */
export function CurrentCoordinate<T = any>({
    y,
    r = 4,
    fill,
    stroke,
    strokeWidth = 2,
    scale,
}: CurrentCoordinateProps<T>) {
    const value = accessor(y);
    const fillOf = fill === undefined ? undefined : functor(fill);
    const strokeOf = stroke === undefined ? undefined : functor(stroke);
    useRenderable<T>({
        scale,
        layer: "top",
        zIndex: 900,
        draw(ctx, { crosshair, data, x, y: yOf, theme }) {
            const i = crosshair?.index ?? -1;
            const d = data[i];
            if (i < 0 || d === undefined) {
                return;
            }
            const v = value(d, i);
            if (!isFiniteNumber(v)) {
                return;
            }
            if (strokeWidth > 0) {
                ctx.fillStyle = strokeOf?.(d, i) ?? theme.background;
                ctx.beginPath();
                ctx.arc(x(i), yOf(v), r + strokeWidth, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = fillOf?.(d, i) ?? theme.line;
            ctx.beginPath();
            ctx.arc(x(i), yOf(v), r, 0, Math.PI * 2);
            ctx.fill();
        },
    });
    return null;
}
