import * as React from "react";

/** Inline 28×28 SVG icons (stroke = currentColor). */

const svg = (children: React.ReactNode, fill = false) => (
    <svg
        viewBox="0 0 28 28"
        width="28"
        height="28"
        fill={fill ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

const dot = (x: number, y: number) => <circle cx={x} cy={y} r="1.9" fill="var(--rc-panel, #fff)" />;

/** Built-in 28×28 line icons (tool and toolbar icons), drawn with `currentColor`. */
export const icons = {
    trendLine: svg(
        <>
            <path d="M7.5 20.5l13-13" />
            {dot(6.5, 21.5)}
            {dot(21.5, 6.5)}
        </>,
    ),
    ray: svg(
        <>
            <path d="M7.5 20.5L24 4" />
            {dot(6.5, 21.5)}
            {dot(14, 14)}
        </>,
    ),
    extendedLine: svg(
        <>
            <path d="M3 25L25 3" />
            {dot(10, 18)}
            {dot(18, 10)}
        </>,
    ),
    infoLine: svg(
        <>
            <path d="M6.5 21.5l15-15" />
            {dot(6.5, 21.5)}
            {dot(21.5, 6.5)}
            <rect x="14" y="16" width="10" height="7" rx="1.5" />
        </>,
    ),
    arrow: svg(
        <>
            <path d="M6 22L21 7M14 7h7v7" />
        </>,
    ),
    horizontalLine: svg(
        <>
            <path d="M3 14h22" />
            {dot(14, 14)}
        </>,
    ),
    horizontalRay: svg(
        <>
            <path d="M8 14h17" />
            {dot(6.5, 14)}
        </>,
    ),
    verticalLine: svg(
        <>
            <path d="M14 3v22" />
            {dot(14, 14)}
        </>,
    ),
    crossLine: svg(
        <>
            <path d="M3 14h22M14 3v22" />
            {dot(14, 14)}
        </>,
    ),
    parallelChannel: svg(
        <>
            <path d="M4 17L17 4M11 24L24 11" />
            <path d="M7.5 20.5l13-13" strokeDasharray="2 2" />
            {dot(4, 17)}
            {dot(24, 11)}
        </>,
    ),
    regressionChannel: svg(
        <>
            <path d="M4 14L24 6M4 22L24 14" />
            <path d="M4 18l20-8" strokeDasharray="2 2" />
            {dot(4, 18)}
            {dot(24, 10)}
        </>,
    ),
    pitchfork: svg(
        <>
            <path d="M4 15l9-5M4 15l9 5M13 10h11M13 20h11M8.5 15H24" />
            {dot(4, 15)}
            {dot(13, 10)}
            {dot(13, 20)}
        </>,
    ),
    fibRetracement: svg(
        <>
            <path d="M3 5h22M3 11h22M3 17h22M3 23h22" />
            <path d="M6 23L22 5" strokeDasharray="2 2" />
        </>,
    ),
    fibExtension: svg(
        <>
            <path d="M12 5h13M12 11h13M12 17h13" />
            <path d="M3 23l5-12 4 6" strokeDasharray="2 2" />
            {dot(3, 23)}
            {dot(8, 11)}
        </>,
    ),
    gannFan: svg(
        <>
            <path d="M4 24L24 4M4 24l20-8M4 24l20-14M4 24L10 4M4 24L17 4" />
            {dot(4, 24)}
        </>,
    ),
    rectangle: svg(
        <>
            <rect x="5" y="7" width="18" height="14" rx="0.5" />
            {dot(5, 7)}
            {dot(23, 21)}
        </>,
    ),
    ellipse: svg(<ellipse cx="14" cy="14" rx="10" ry="7" />),
    triangle: svg(
        <>
            <path d="M5 22L13 6l10 13z" />
            {dot(5, 22)}
            {dot(13, 6)}
            {dot(23, 19)}
        </>,
    ),
    path: svg(
        <>
            <path d="M4 20l6-9 6 6 8-11" />
            {dot(4, 20)}
            {dot(10, 11)}
            {dot(16, 17)}
        </>,
    ),
    brush: svg(
        <>
            <path d="M12 19l1-4L22 6l3 3-9 9zM20 8l3 3" />
            <path d="M3 23c2-3 4 1 6-1.5" />
        </>,
    ),
    highlighter: svg(
        <>
            <path d="M9 17l9-11 4 3.5-9 11zM9 17l-1 4 4-.5" />
            <path d="M4 24h20" strokeWidth="3" opacity=".45" />
        </>,
    ),
    text: svg(<path d="M7 7h14M14 7v15M11 22h6" />),
    callout: svg(
        <>
            <path d="M5 6h18v11H13l-5 5v-5H5z" />
            <path d="M9 10h10M9 13h6" />
        </>,
    ),
    priceLabel: svg(
        <>
            <path d="M5 8h18v9H16l-2 4-2-4H5z" />
            <path d="M9 12.5h10" />
        </>,
    ),
    priceLine: svg(
        <>
            <path d="M3 14h22" strokeDasharray="3 2" />
            <rect x="5" y="10" width="10" height="8" rx="1.5" />
        </>,
    ),
    longPosition: svg(
        <>
            <rect x="5" y="5" width="18" height="9" fill="#089981" fillOpacity="0.35" stroke="none" />
            <rect x="5" y="14" width="18" height="7" fill="#f23645" fillOpacity="0.35" stroke="none" />
            <path d="M5 14h18" />
            {dot(5, 14)}
        </>,
    ),
    shortPosition: svg(
        <>
            <rect x="5" y="7" width="18" height="7" fill="#f23645" fillOpacity="0.35" stroke="none" />
            <rect x="5" y="14" width="18" height="9" fill="#089981" fillOpacity="0.35" stroke="none" />
            <path d="M5 14h18" />
            {dot(5, 14)}
        </>,
    ),
    priceRange: svg(
        <>
            <path d="M5 5h18M5 23h18M14 7v14M11 10l3-3 3 3" />
        </>,
    ),
    dateRange: svg(
        <>
            <path d="M5 5v18M23 5v18M7 14h14M18 11l3 3-3 3" />
        </>,
    ),
    dateAndPriceRange: svg(
        <>
            <rect x="5" y="5" width="18" height="18" rx="1" />
            <path d="M14 8v12M8 14h12" />
        </>,
    ),
    // toolbar
    cross: svg(<path d="M14 4v20M4 14h20" />),
    cursor: svg(<path d="M9 5v16l4-4 3 7 2.5-1-3-7h6z" />),
    eraser: svg(
        <>
            <path d="M11 22l-5-5 11-11 6 6-10 10zM9 14l6 6M13 22h10" />
        </>,
    ),
    magnet: svg(<path d="M8 6v8a6 6 0 0 0 12 0V6h-4v8a2 2 0 0 1-4 0V6zM8 10h4M16 10h4" />),
    // "stay in drawing mode": a repeat arrow loop (the pencil belongs to the freehand brush)
    keepDrawing: svg(
        <>
            <path d="M6 13a7 7 0 0 1 12.5-4.3L21 11M21 6v5h-5" />
            <path d="M22 15a7 7 0 0 1-12.5 4.3L7 17M7 22v-5h5" />
        </>,
    ),
    lock: svg(
        <>
            <rect x="7" y="13" width="14" height="10" rx="2" />
            <path d="M10 13V9.5a4 4 0 0 1 8 0V13" />
        </>,
    ),
    unlock: svg(
        <>
            <rect x="7" y="13" width="14" height="10" rx="2" />
            <path d="M10 13V9.5a4 4 0 0 1 7.7-1.5" />
        </>,
    ),
    eye: svg(
        <>
            <path d="M3 14s4-7 11-7 11 7 11 7-4 7-11 7S3 14 3 14z" />
            <circle cx="14" cy="14" r="3" />
        </>,
    ),
    eyeOff: svg(
        <>
            <path d="M3 14s4-7 11-7 11 7 11 7-4 7-11 7S3 14 3 14z" />
            <path d="M5 23L23 5" />
        </>,
    ),
    trash: svg(<path d="M6 8h16M11 8V5.5h6V8M8 8l1 15h10l1-15M12 12v7M16 12v7" />),
    zoomIn: svg(<path d="M14 8v12M8 14h12" />),
    zoomOut: svg(<path d="M8 14h12" />),
    reset: svg(<path d="M8 10a8 8 0 1 1-1 7M7 5v5h5" />),
    left: svg(<path d="M16 8l-6 6 6 6" />),
    right: svg(<path d="M12 8l6 6-6 6" />),
    star: svg(<path d="M14 5l2.7 5.6 6.1.8-4.5 4.2 1.1 6L14 18.7l-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z" />),
    clone: svg(
        <>
            <rect x="10" y="10" width="12" height="12" rx="1.5" />
            <path d="M18 10V6.5A1.5 1.5 0 0 0 16.5 5h-10A1.5 1.5 0 0 0 5 6.5v10A1.5 1.5 0 0 0 6.5 18H10" />
        </>,
    ),
    undo: svg(<path d="M9 9H18a5 5 0 0 1 0 10h-6M12 5L8 9l4 4" />),
    redo: svg(<path d="M19 9H10a5 5 0 0 0 0 10h6M16 5l4 4-4 4" />),
    more: svg(
        <>
            <circle cx="8" cy="14" r="1" />
            <circle cx="14" cy="14" r="1" />
            <circle cx="20" cy="14" r="1" />
        </>,
    ),
} satisfies Record<string, React.ReactElement>;

export type IconName = keyof typeof icons;
