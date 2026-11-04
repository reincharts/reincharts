import { clamp, font, useRenderable } from "@reincharts/core";

export interface WatermarkProps {
    /** Main text, e.g. the symbol. */
    readonly text: string;
    /** Smaller second line, e.g. "1D · NASDAQ". */
    readonly subtitle?: string;
    /** Text color. Defaults to theme.watermark. */
    readonly color?: string;
    /** Main font size. Default: scales with the pane height (24–72px). */
    readonly fontSize?: number;
    /** Font weight of the main text. Default "700". */
    readonly fontWeight?: string | number;
    /** Vertical placement in the pane. Default "center". */
    readonly position?: "center" | "top" | "bottom";
    /** Pane id. Defaults to the enclosing pane. */
    readonly pane?: string;
}

/** Big faint text behind the series (e.g. the symbol or a brand name). */
export function Watermark({
    text,
    subtitle,
    color,
    fontSize,
    fontWeight = "700",
    position = "center",
    pane,
}: WatermarkProps) {
    useRenderable({
        pane,
        zIndex: -90,
        draw(ctx, { pane: p, theme }) {
            if (!p || p.height <= 0) {
                return;
            }
            const size = fontSize ?? Math.round(clamp(p.height * 0.2, 24, 72));
            const sub = Math.round(size * 0.36);
            const gap = Math.round(size * 0.12);
            const total = size + (subtitle ? gap + sub : 0);
            const top =
                position === "top"
                    ? p.height * 0.12
                    : position === "bottom"
                      ? p.height * 0.88 - total
                      : (p.height - total) / 2;
            ctx.fillStyle = color ?? theme.watermark;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.font = font(theme, size, String(fontWeight));
            ctx.fillText(text, p.width / 2, top, p.width - 16);
            if (subtitle) {
                ctx.font = font(theme, sub, "500");
                ctx.fillText(subtitle, p.width / 2, top + size + gap, p.width - 16);
            }
        },
    });
    return null;
}
