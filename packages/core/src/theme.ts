/** Visual theme shared by every Reincharts component. Components read their default colors from it. */
export interface Theme {
    /** Preset name ("light" / "dark"); dark-based custom themes keep "dark". */
    readonly name: string;
    /** Canvas background color. */
    readonly background: string;
    /** Primary text color (legends, labels). */
    readonly text: string;
    /** Secondary text color. */
    readonly textMuted: string;
    /** Font family for every canvas label. */
    readonly fontFamily: string;
    /** Base font size in pixels for axis and crosshair labels. */
    readonly fontSize: number;
    /** Grid line color and which directions are drawn by default. */
    readonly grid: { readonly color: string; readonly vertical: boolean; readonly horizontal: boolean };
    /** Axis line, tick label and tick mark colors. */
    readonly axis: { readonly line: string; readonly text: string; readonly tick: string };
    /** Crosshair lines and axis label styling. */
    readonly crosshair: {
        readonly color: string;
        readonly width: number;
        readonly dash: readonly number[];
        readonly labelBackground: string;
        readonly labelText: string;
    };
    /** Color of the draggable line between panes. */
    readonly paneSeparator: string;
    /** Rising candles / bars. */
    readonly up: string;
    /** Falling candles / bars. */
    readonly down: string;
    /** Unchanged values. */
    readonly neutral: string;
    /** Default line series color. */
    readonly line: string;
    /** Default area gradient (top and bottom colors). */
    readonly area: { readonly top: string; readonly bottom: string };
    /** Volume bar colors for rising / falling bars. */
    readonly volume: { readonly up: string; readonly down: string };
    /** Palette used for indicators / compare series / drawings when no color is given. */
    readonly palette: readonly string[];
    /** Selection / brush highlight fill. */
    readonly selection: string;
    /** Default drawing tool color and handle colors. */
    readonly drawing: { readonly color: string; readonly handleFill: string; readonly handleStroke: string };
    /** Watermark text color. */
    readonly watermark: string;
}

export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends readonly unknown[] ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const font = `-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif`;

export const lightTheme: Theme = {
    name: "light",
    background: "#ffffff",
    text: "#131722",
    textMuted: "#787b86",
    fontFamily: font,
    fontSize: 11,
    grid: { color: "rgba(42, 46, 57, 0.06)", vertical: true, horizontal: true },
    axis: { line: "#e0e3eb", text: "#131722", tick: "#e0e3eb" },
    crosshair: { color: "#9598a1", width: 1, dash: [4, 4], labelBackground: "#131722", labelText: "#ffffff" },
    paneSeparator: "#e0e3eb",
    up: "#089981",
    down: "#f23645",
    neutral: "#787b86",
    line: "#2962ff",
    area: { top: "rgba(41, 98, 255, 0.28)", bottom: "rgba(41, 98, 255, 0.02)" },
    volume: { up: "rgba(8, 153, 129, 0.5)", down: "rgba(242, 54, 69, 0.5)" },
    palette: ["#2962ff", "#ff6d00", "#9c27b0", "#00bcd4", "#e91e63", "#4caf50", "#ffb300", "#795548"],
    selection: "rgba(41, 98, 255, 0.15)",
    drawing: { color: "#2962ff", handleFill: "#ffffff", handleStroke: "#2962ff" },
    watermark: "rgba(42, 46, 57, 0.06)",
};

export const darkTheme: Theme = {
    ...lightTheme,
    name: "dark",
    background: "#131722",
    text: "#d1d4dc",
    textMuted: "#787b86",
    grid: { color: "rgba(240, 243, 250, 0.06)", vertical: true, horizontal: true },
    axis: { line: "#2a2e39", text: "#d1d4dc", tick: "#2a2e39" },
    crosshair: { color: "#758696", width: 1, dash: [4, 4], labelBackground: "#363a45", labelText: "#ffffff" },
    paneSeparator: "#2a2e39",
    selection: "rgba(41, 98, 255, 0.25)",
    drawing: { color: "#2962ff", handleFill: "#131722", handleStroke: "#2962ff" },
    watermark: "rgba(240, 243, 250, 0.06)",
};

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

const merge = (base: any, overrides: any): any => {
    const out: any = { ...base };
    for (const key of Object.keys(overrides ?? {})) {
        const value = overrides[key];
        out[key] = isObject(value) && isObject(base[key]) ? merge(base[key], value) : value;
    }
    return out;
};

/** Creates a theme by deep-merging overrides into a base theme (defaults to `lightTheme`). */
export const createTheme = (overrides: DeepPartial<Theme> = {}, base: Theme = lightTheme): Theme =>
    merge(base, overrides);

/** Resolves the `theme` prop: a preset name, a full theme, or partial overrides of the light theme. */
export const resolveTheme = (theme: "light" | "dark" | Theme | DeepPartial<Theme> | undefined): Theme => {
    if (theme === undefined || theme === "light") {
        return lightTheme;
    }
    if (theme === "dark") {
        return darkTheme;
    }
    return createTheme(theme, (theme as Theme).name === "dark" ? darkTheme : lightTheme);
};
