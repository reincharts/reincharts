// 18×18 line icons drawn on a pixel grid (1px strokes on .5 coordinates stay crisp at 1x and 2x).

const gear = (() => {
    const teeth = 8;
    const parts: string[] = [];
    for (let k = 0; k < teeth * 2; k++) {
        const a0 = (k / (teeth * 2)) * Math.PI * 2 - Math.PI / 16;
        const a1 = ((k + 1) / (teeth * 2)) * Math.PI * 2 - Math.PI / 16;
        const r = k % 2 === 0 ? 7 : 5.4;
        const p0 = [9 + r * Math.cos(a0), 9 + r * Math.sin(a0)];
        const p1 = [9 + r * Math.cos(a1), 9 + r * Math.sin(a1)];
        parts.push(
            `${k === 0 ? "M" : "L"}${p0[0].toFixed(2)} ${p0[1].toFixed(2)}`,
            `L${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`,
        );
    }
    return `${parts.join("")}Z`;
})();

const paths = {
    search: (
        <>
            <circle cx="7.5" cy="7.5" r="5" />
            <path d="M11.2 11.2 15.5 15.5" />
        </>
    ),
    chevronDown: <path d="M5.5 7.5 9 11l3.5-3.5" />,
    chevronRight: <path d="M7.5 5.5 11 9l-3.5 3.5" />,
    candles: (
        <>
            <path d="M5.5 2v3M5.5 14v2.5M12.5 3.5V6M12.5 12v3" />
            <rect x="3.5" y="5.5" width="4" height="8" />
            <rect x="10.5" y="6.5" width="4" height="5" fill="currentColor" />
        </>
    ),
    hollowCandles: (
        <>
            <path d="M5.5 2v3M5.5 14v2.5M12.5 3.5V6M12.5 12v3" />
            <rect x="3.5" y="5.5" width="4" height="8" />
            <rect x="10.5" y="6.5" width="4" height="5" />
        </>
    ),
    bars: <path d="M5.5 3v12M3 6h2.5M5.5 12H8M12.5 2.5v11M10 10.5h2.5M12.5 5H15" />,
    heikinAshi: (
        <>
            <path d="M5.5 3v2.5M5.5 12.5V15M12.5 2v4M12.5 10v2.5" />
            <rect x="3.5" y="5.5" width="4" height="7" fill="currentColor" />
            <rect x="10.5" y="5.5" width="4" height="4.5" fill="currentColor" />
        </>
    ),
    line: <path d="M2 13.5 6 8l4 3 6-7" />,
    stepLine: <path d="M2 13.5h4v-5h4v3h4v-7h2" />,
    area: (
        <>
            <path d="M2 15.5V12l4-4.5 4 3 6-6.5v11.5z" fill="currentColor" fillOpacity="0.2" stroke="none" />
            <path d="M2 12l4-4.5 4 3 6-6.5" />
        </>
    ),
    baseline: (
        <>
            <path d="M2 9.5h14" strokeDasharray="1.5 1.5" />
            <path d="M2 12.5 5 8l3 3.5 3-7 5 3" />
        </>
    ),
    columns: <path d="M3.5 16V11M7 16V7M10.5 16V9M14 16V4" strokeWidth="2" />,
    hlcArea: (
        <>
            <path d="M2 7.5 6 4l4 2.5 6-4v8l-6 3-4-2.5-4 3z" fill="currentColor" fillOpacity="0.2" stroke="none" />
            <path d="M2 10.5 6 7.5l4 2.5 6-4" />
        </>
    ),
    renko: (
        <>
            <rect x="2.5" y="11.5" width="3" height="4" />
            <rect x="5.5" y="7.5" width="3" height="4" />
            <rect x="8.5" y="3.5" width="3" height="4" fill="currentColor" />
            <rect x="12.5" y="7.5" width="3" height="4" fill="currentColor" />
        </>
    ),
    kagi: <path d="M2.5 15.5v-5h3v-7h4v9h3v-6h3v4" />,
    pointAndFigure: (
        <>
            <path d="M3 3l3 3M6 3 3 6M3 8l3 3M6 8l-3 3M12 9l3 3M15 9l-3 3" />
            <circle cx="13.5" cy="5.5" r="1.8" />
            <circle cx="4.5" cy="14.5" r="1.8" />
        </>
    ),
    lineBreak: (
        <>
            <rect x="2.5" y="10.5" width="3" height="5" />
            <rect x="6.5" y="6.5" width="3" height="4" />
            <rect x="10.5" y="2.5" width="3" height="4" />
            <rect x="14" y="4.5" width="2.5" height="6" fill="currentColor" />
        </>
    ),
    indicators: (
        <path d="M8.5 3.5c-1.6-.4-2.6.4-2.9 2.1l-1.3 7.3c-.3 1.6-1.1 2.3-2.6 2M3.5 7.5h4.5M10 7.5l5 7M15 7.5l-5 7" />
    ),
    compare: (
        <>
            <circle cx="9" cy="9" r="6.5" />
            <path d="M9 5.5v7M5.5 9h7" />
        </>
    ),
    undo: <path d="M6 3.5 2.5 7 6 10.5M2.5 7h8.25a4.25 4.25 0 0 1 0 8.5H8" />,
    redo: <path d="M12 3.5 15.5 7 12 10.5M15.5 7H7.25a4.25 4.25 0 0 0 0 8.5H10" />,
    camera: (
        <>
            <path d="M2.5 6.5a1 1 0 0 1 1-1h2.2l1.3-2h4l1.3 2h2.2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z" />
            <circle cx="9" cy="10" r="2.6" />
        </>
    ),
    fullscreen: <path d="M2.5 6.5v-4h4M11.5 2.5h4v4M15.5 11.5v4h-4M6.5 15.5h-4v-4" />,
    exitFullscreen: <path d="M6.5 2.5v4h-4M15.5 6.5h-4v-4M11.5 15.5v-4h4M2.5 11.5h4v4" />,
    sun: (
        <>
            <circle cx="9" cy="9" r="3.2" />
            <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" />
        </>
    ),
    moon: <path d="M14.8 11.3A6.5 6.5 0 0 1 6.7 3.2 6.5 6.5 0 1 0 14.8 11.3z" />,
    settings: (
        <>
            <path d={gear} />
            <circle cx="9" cy="9" r="2.3" />
        </>
    ),
    eye: (
        <>
            <path d="M1.5 9S4.3 4 9 4s7.5 5 7.5 5-2.8 5-7.5 5S1.5 9 1.5 9z" />
            <circle cx="9" cy="9" r="2.3" />
        </>
    ),
    eyeOff: (
        <>
            <path d="M1.5 9S4.3 4 9 4s7.5 5 7.5 5-2.8 5-7.5 5S1.5 9 1.5 9z" />
            <circle cx="9" cy="9" r="2.3" />
            <path d="M3 15 15 3" />
        </>
    ),
    close: <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />,
    star: <path d="M9 2.3l2 4.2 4.6.6-3.4 3.2.9 4.6L9 12.7l-4.1 2.2.9-4.6-3.4-3.2 4.6-.6z" />,
    starFilled: <path d="M9 2.3l2 4.2 4.6.6-3.4 3.2.9 4.6L9 12.7l-4.1 2.2.9-4.6-3.4-3.2 4.6-.6z" fill="currentColor" />,
    layoutSingle: <rect x="2.5" y="3.5" width="13" height="11" rx="1" />,
    layout2h: (
        <>
            <rect x="2.5" y="3.5" width="13" height="11" rx="1" />
            <path d="M9 3.5v11" />
        </>
    ),
    layout2v: (
        <>
            <rect x="2.5" y="3.5" width="13" height="11" rx="1" />
            <path d="M2.5 9h13" />
        </>
    ),
    layout3: (
        <>
            <rect x="2.5" y="3.5" width="13" height="11" rx="1" />
            <path d="M9 3.5v11M9 9h6.5" />
        </>
    ),
    layout4: (
        <>
            <rect x="2.5" y="3.5" width="13" height="11" rx="1" />
            <path d="M9 3.5v11M2.5 9h13" />
        </>
    ),
    replay: <path d="M3.5 4.5v9M9.5 4.5 5 9l4.5 4.5zM15 4.5 10.5 9l4.5 4.5z" />,
    play: <path d="M5.5 3.5v11l9-5.5z" fill="currentColor" />,
    pause: <path d="M6 3.5v11M12 3.5v11" strokeWidth="2.5" />,
    stepForward: (
        <>
            <path d="M4 4v10l7-5z" fill="currentColor" />
            <path d="M13.5 4v10" strokeWidth="2" />
        </>
    ),
    stepBack: (
        <>
            <path d="M14 4v10L7 9z" fill="currentColor" />
            <path d="M4.5 4v10" strokeWidth="2" />
        </>
    ),
    objectTree: <path d="M3.5 3.5h4v4h-4zM10.5 4.5h5M10.5 6.5h3M3.5 10.5h4v4h-4zM10.5 11.5h5M10.5 13.5h3" />,
    more: (
        <>
            <circle cx="4" cy="9" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="14" cy="9" r="1.2" fill="currentColor" stroke="none" />
        </>
    ),
    maximize: <path d="M10.5 2.5h5v5M15.5 2.5 10 8M7.5 15.5h-5v-5M2.5 15.5 8 10" />,
    minimize: <path d="M14.5 8.5h-5v-5M9.5 8.5l6-6M3.5 9.5h5v5M8.5 9.5l-6 6" />,
    collapse: <path d="M5 7.5 9 11.5l4-4" />,
    expand: <path d="M5 11 9 7l4 4" />,
    arrowUp: <path d="M9 14.5v-11M5 7.5l4-4 4 4" />,
    arrowDown: <path d="M9 3.5v11M5 10.5l4 4 4-4" />,
    realtime: <path d="M4.5 4.5 9 9l-4.5 4.5M9.5 4.5 14 9l-4.5 4.5" />,
    trash: (
        <path d="M3 4.5h12M7 4.5V3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1.5M4.5 4.5l.7 10.1a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9l.7-10.1M7.5 7.5v5M10.5 7.5v5" />
    ),
    lock: (
        <>
            <rect x="4" y="8.5" width="10" height="7" rx="1" />
            <path d="M6 8.5V6a3 3 0 0 1 6 0v2.5" />
        </>
    ),
    unlock: (
        <>
            <rect x="4" y="8.5" width="10" height="7" rx="1" />
            <path d="M6 8.5V6a3 3 0 0 1 5.8-1" />
        </>
    ),
    plus: <path d="M9 3.5v11M3.5 9h11" />,
    check: <path d="M3.5 9.5 7 13l7.5-8" />,
    copy: (
        <>
            <rect x="5.5" y="5.5" width="9" height="10" rx="1" />
            <path d="M3.5 12.5v-9a1 1 0 0 1 1-1h7" />
        </>
    ),
    reset: <path d="M3.5 9a5.5 5.5 0 1 0 1.6-3.9M3.5 2.5v3.5H7" />,
    loading: <path d="M9 2.5a6.5 6.5 0 1 0 6.5 6.5" />,
} as const;

/** Name of a built-in widget icon. */
export type IconName = keyof typeof paths;

/** Props of `WidgetIcon`. */
export interface IconProps {
    /** Icon to draw. */
    readonly name: IconName;
    /** Pixel size (square). Default 18. */
    readonly size?: number;
    /** Extra class name of the `<svg>`. */
    readonly className?: string;
}

/** A small inline SVG line icon (stroke = currentColor). */
export function Icon({ name, size = 18, className }: IconProps) {
    return (
        <svg
            className={className ? `rc-w-icon ${className}` : "rc-w-icon"}
            width={size}
            height={size}
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {paths[name]}
        </svg>
    );
}

/** Icon of each chart type (same ids as `ChartType`). */
export const chartTypeIcon: Record<string, IconName> = {
    candles: "candles",
    hollowCandles: "hollowCandles",
    bars: "bars",
    heikinAshi: "heikinAshi",
    line: "line",
    stepLine: "stepLine",
    area: "area",
    baseline: "baseline",
    columns: "columns",
    hlcArea: "hlcArea",
    renko: "renko",
    kagi: "kagi",
    pointAndFigure: "pointAndFigure",
    lineBreak: "lineBreak",
};

/** Icon of each multi-chart layout. */
export const layoutIcon: Record<string, IconName> = {
    single: "layoutSingle",
    "2h": "layout2h",
    "2v": "layout2v",
    "3": "layout3",
    "4": "layout4",
};
