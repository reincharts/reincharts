"use client";
import { createTheme, darkTheme, lightTheme, type Theme } from "@reincharts/core";
import { useTheme } from "fumadocs-ui/provider/base";
import { useEffect, useMemo, useState } from "react";

/**
 * The docs site's color scheme as a Reincharts theme name ("light" | "dark").
 * Returns "light" until mounted to stay hydration-safe.
 */
export function useDocsTheme(): "light" | "dark" {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted && resolvedTheme === "dark" ? "dark" : "light";
}

// The docs use shadcn's zinc palette; these presets make charts blend with the page and cards.
const zincLight = createTheme(
    {
        background: "#ffffff",
        text: "#09090b",
        textMuted: "#71717a",
        grid: { color: "rgba(9, 9, 11, 0.055)" },
        axis: { line: "#e4e4e7", text: "#52525b", tick: "#e4e4e7" },
        crosshair: { color: "#a1a1aa", labelBackground: "#18181b", labelText: "#fafafa" },
        paneSeparator: "#e4e4e7",
        watermark: "rgba(9, 9, 11, 0.05)",
    },
    lightTheme,
);

const zincDark = createTheme(
    {
        background: "#09090b",
        text: "#fafafa",
        textMuted: "#a1a1aa",
        grid: { color: "rgba(255, 255, 255, 0.055)" },
        axis: { line: "#27272a", text: "#a1a1aa", tick: "#27272a" },
        crosshair: { color: "#71717a", labelBackground: "#3f3f46", labelText: "#fafafa" },
        paneSeparator: "#27272a",
        selection: "rgba(41, 98, 255, 0.25)",
        drawing: { handleFill: "#09090b" },
        watermark: "rgba(255, 255, 255, 0.05)",
    },
    darkTheme,
);

/**
 * A full Reincharts theme matching the docs site (zinc palette, Geist font) in the current color scheme.
 * Live examples pass it to `<ChartCanvas theme={...}>` so charts follow the light / dark toggle.
 */
export function useDocsChartTheme(): Theme {
    const scheme = useDocsTheme();
    const [fontFamily, setFontFamily] = useState<string>();
    useEffect(() => setFontFamily(getComputedStyle(document.body).fontFamily || undefined), []);
    return useMemo(() => {
        const base = scheme === "dark" ? zincDark : zincLight;
        return fontFamily ? { ...base, fontFamily } : base;
    }, [scheme, fontFamily]);
}
