export type AnnotationShape =
    "arrowUp" | "arrowDown" | "circle" | "square" | "diamond" | "triangle" | "triangleDown" | "flag" | "cross";

const svgCache = new Map<string, Path2D>();

/** Parsed (cached) Path2D of an SVG path string. */
export const svgPath = (d: string) => {
    let p = svgCache.get(d);
    if (!p) {
        p = new Path2D(d);
        if (svgCache.size > 200) {
            svgCache.clear();
        }
        svgCache.set(d, p);
    }
    return p;
};

/** Adds a marker shape of size `s` centered at (cx, cy) to a path. */
export const addShape = (p: Path2D, shape: AnnotationShape, cx: number, cy: number, s: number) => {
    const h = s / 2;
    switch (shape) {
        case "circle":
            p.moveTo(cx + h, cy);
            p.arc(cx, cy, h, 0, Math.PI * 2);
            break;
        case "square":
            p.rect(cx - h, cy - h, s, s);
            break;
        case "diamond":
            p.moveTo(cx, cy - h);
            p.lineTo(cx + h, cy);
            p.lineTo(cx, cy + h);
            p.lineTo(cx - h, cy);
            p.closePath();
            break;
        case "triangle":
        case "triangleDown": {
            const d = shape === "triangle" ? 1 : -1;
            p.moveTo(cx, cy - h * d);
            p.lineTo(cx + h, cy + h * d);
            p.lineTo(cx - h, cy + h * d);
            p.closePath();
            break;
        }
        case "arrowUp":
        case "arrowDown": {
            // arrow with a wide head and a narrow stem
            const d = shape === "arrowUp" ? 1 : -1;
            const head = s * 0.55;
            const stem = Math.max(2, s * 0.36) / 2;
            const tip = cy - h * d;
            const base = tip + head * d;
            p.moveTo(cx, tip);
            p.lineTo(cx + h, base);
            p.lineTo(cx + stem, base);
            p.lineTo(cx + stem, cy + h * d);
            p.lineTo(cx - stem, cy + h * d);
            p.lineTo(cx - stem, base);
            p.lineTo(cx - h, base);
            p.closePath();
            break;
        }
        case "flag": {
            const pole = Math.max(1.5, s * 0.14);
            const left = cx - h + 1;
            p.rect(left, cy - h, pole, s);
            p.moveTo(left + pole, cy - h);
            p.lineTo(cx + h, cy - h + s * 0.27);
            p.lineTo(left + pole, cy - h + s * 0.55);
            p.closePath();
            break;
        }
        case "cross": {
            const w = Math.max(1.5, s * 0.22) / 2;
            p.rect(cx - h, cy - w, s, w * 2);
            p.rect(cx - w, cy - h, w * 2, s);
            break;
        }
    }
};
