import type { GalleryItem } from "@/components/gallery/gallery-card";

export interface GallerySection {
    id: string;
    title: string;
    description: string;
    items: GalleryItem[];
    /** Nested groups shown under the section (Indicators under Financial). */
    subsections?: GallerySection[];
}

const item = (name: string, title: string, description: string, slug: string): GalleryItem => ({
    name,
    title,
    description,
    href: `/examples/${slug}`,
});

/** The /gallery page: general-purpose charts first, then financial charts with indicators as a subsection. */
export const gallery: GallerySection[] = [
    {
        id: "general",
        title: "General",
        description: "Interactive charts for dashboards and data apps, with pan, zoom, crosshairs and tooltips.",
        items: [
            item(
                "annotated-line",
                "Annotated line",
                "A highlighted period, a goal line and markers.",
                "annotated-line",
            ),
            item("tooltip", "Area & line", "Shared tooltip that follows the pointer.", "tooltip"),
            item("line-curves", "Curves", "Linear, monotone and step lines.", "curves"),
            item("stacked-area", "Stacked area", "Absolute or normalized to 100%.", "stacked-area"),
            item("bar", "Bars", "Rounded columns on a category axis.", "bar"),
            item("bar-grouped", "Grouped bars", "Several values per category.", "grouped-bars"),
            item("bars-legend-toggle", "Stacked bars", "Toggle series from the legend.", "legend-toggle"),
            item("bar-histogram", "Histogram", "Positive and negative values.", "histogram"),
            item("horizontal-bar", "Horizontal bars", "Category y axis, value x axis.", "horizontal-bars"),
            item("horizontal-bar-stacked", "Stacked horizontal bars", "Progress by team.", "stacked-horizontal-bars"),
            item("scatter", "Scatter", "Markers by group, nearest-point tooltip.", "scatter"),
            item("bubble", "Bubble", "Area mapped to a value.", "bubble"),
            item("error-bars", "Error bars", "Mean with one standard deviation.", "error-bars"),
            item("data-linear", "Numeric x axis", "Continuous, unevenly sampled data.", "numeric-axis"),
            item(
                "annotations-reference",
                "Reference lines & areas",
                "Thresholds, incidents and peaks.",
                "reference-lines",
            ),
        ],
    },
    {
        id: "financial",
        title: "Financial",
        description: "Candlesticks and other price charts, on the same engine.",
        items: [
            item("candlestick", "Candlestick", "Legend, last value line and crosshair.", "candlestick"),
            item("candlestick-hollow", "Hollow candles", "Rising candles drawn as outlines.", "hollow-candles"),
            item("ohlc", "OHLC bars", "Open and close ticks on a high-low line.", "ohlc"),
            item("heikin-ashi", "Heikin Ashi", "Averaged candles that filter noise.", "heikin-ashi"),
            item("baseline", "Baseline", "Green above, red below a base value.", "baseline"),
            item("hlc-area", "HLC area", "High-low range around the close.", "hlc-area"),
            item("price-scale-overlay", "Volume overlay", "Volume on an overlay scale.", "volume-overlay"),
            item("volume-profile", "Volume profile", "Volume by price with the POC.", "volume-profile"),
            item("renko", "Renko", "Fixed-size bricks.", "renko"),
            item("kagi", "Kagi", "Yin and yang reversal lines.", "kagi"),
            item("point-and-figure", "Point & Figure", "Columns of X and O.", "point-and-figure"),
            item("line-break", "Line break", "Three-line break boxes.", "line-break"),
        ],
        subsections: [
            {
                id: "indicators",
                title: "Indicators",
                description: "30+ built-in indicators, or define your own.",
                items: [
                    item(
                        "indicators-moving-averages",
                        "Moving averages",
                        "SMA, EMA, WMA, HMA and VWMA.",
                        "indicators/moving-averages",
                    ),
                    item(
                        "indicators-bands",
                        "Bands & channels",
                        "Bollinger, Keltner, Donchian and envelopes.",
                        "indicators/bands",
                    ),
                    item("annotations-markers", "Signals", "EMA crossovers with markers.", "indicators/signals"),
                    item(
                        "custom-indicator",
                        "Custom indicator",
                        "Bollinger %B with defineIndicator.",
                        "indicators/custom-indicator",
                    ),
                ],
            },
        ],
    },
];

/** Every gallery item, flattened. */
export const galleryItems = gallery.flatMap((s) => [...s.items, ...(s.subsections ?? []).flatMap((x) => x.items)]);
