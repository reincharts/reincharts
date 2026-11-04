import {
    ArrowRight,
    ChartCandlestick,
    ChartScatter,
    FileCode2,
    Gauge,
    Highlighter,
    MousePointer2,
    Palette,
    Scale,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { GalleryCard } from "@/components/gallery/gallery-card";
import { ExampleView } from "@/components/preview/example-view";
import { LazyHeroChart } from "@/components/home/lazy-hero-chart";
import { galleryItems } from "@/lib/gallery";
import { site } from "@/lib/site";

const features: { icon: LucideIcon; title: string; description: string }[] = [
    {
        icon: MousePointer2,
        title: "Interactive by default",
        description: "Pan, zoom, pinch, crosshairs, tooltips, legends and keyboard controls on every chart.",
    },
    {
        icon: Gauge,
        title: "Canvas performance",
        description: "One engine, one render loop, two canvas layers. Hundreds of thousands of points stay smooth.",
    },
    {
        icon: ChartScatter,
        title: "Every cartesian chart",
        description: "Lines, areas, grouped and stacked bars, horizontal bars, scatter, bubbles and error bars.",
    },
    {
        icon: Highlighter,
        title: "Annotations",
        description:
            "Reference lines and areas, markers and callouts, plus drawing tools so users can mark up charts too.",
    },
    {
        icon: Palette,
        title: "Themeable",
        description: "Light and dark presets, or a typed theme object. Every component takes its colors from it.",
    },
    {
        icon: FileCode2,
        title: "TypeScript first",
        description: "Strictly typed props and hooks, generic data types and accessors. React 18 and 19, ESM only.",
    },
    {
        icon: ChartCandlestick,
        title: "Financial-grade",
        description:
            "Candlesticks, 30+ indicators, Fibonacci and position tools and a complete trading chart when you need them.",
    },
    {
        icon: Scale,
        title: "Free & MIT",
        description: "No license keys, no watermark, no usage limits. Modular packages you own end to end.",
    },
];

const pick = (names: string[]) => names.map((name) => galleryItems.find((item) => item.name === name)!);
const general = pick(["tooltip", "bar-grouped", "scatter", "horizontal-bar-stacked", "stacked-area", "bubble"]);
const financial = pick(["candlestick", "volume-profile", "indicators-moving-averages"]);

const annotations = [
    ["ReferenceArea", "highlights the launch period"],
    ["ReferenceLine", "marks the goal, with a label"],
    ["Markers", "call out notable weeks with text"],
    ["Label", "adds a callout with a background"],
    ["Tooltip + Crosshair", "show every value on hover"],
];

function SectionHeader({
    title,
    description,
    href,
    link,
}: {
    title: string;
    description: string;
    href: string;
    link: string;
}) {
    return (
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight text-fd-foreground sm:text-3xl">{title}</h2>
                <p className="mt-2 max-w-2xl text-fd-muted-foreground">{description}</p>
            </div>
            <Link
                href={href}
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-fd-foreground hover:underline"
            >
                {link} <ArrowRight className="size-3.5" />
            </Link>
        </div>
    );
}

export default function HomePage() {
    return (
        <main className="flex flex-1 flex-col">
            {/* hero */}
            <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-14 text-center sm:px-6 md:pt-20">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-5xl md:text-6xl md:leading-[1.05]">
                    Interactive charts for React
                </h1>
                <p className="mt-5 max-w-2xl text-base text-balance text-fd-muted-foreground sm:text-lg">
                    Fast canvas charts with pan, zoom, crosshairs, tooltips and annotations built in. Lines, areas,
                    bars, scatter and financial charts from one small, composable API. Free and open source.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/docs"
                        className="inline-flex h-10 items-center gap-2 rounded-md bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground shadow-xs transition-opacity hover:opacity-90"
                    >
                        Get Started
                        <ArrowRight className="size-4" />
                    </Link>
                    <Link
                        href="/examples"
                        className="inline-flex h-10 items-center rounded-md border border-fd-border bg-fd-background px-5 text-sm font-medium text-fd-foreground shadow-xs transition-colors hover:bg-fd-accent"
                    >
                        Browse examples
                    </Link>
                </div>
            </section>

            {/* the most advanced example: a full trading chart */}
            <section className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
                <div className="relative overflow-hidden rounded-xl border border-fd-border bg-fd-background shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.12)] dark:shadow-none">
                    <div className="h-[480px] sm:h-[560px] md:h-[620px]">
                        <LazyHeroChart />
                    </div>
                </div>
                <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-balance text-fd-muted-foreground">
                    An advanced example: a complete trading terminal assembled from Reincharts components, with
                    indicators, drawing tools, chart types, layouts and replay on a live demo feed.{" "}
                    <Link href="/docs/trading-chart" className="font-medium text-fd-foreground hover:underline">
                        Learn about &lt;TradingChart&gt;
                    </Link>
                </p>
            </section>

            {/* annotations: a simple, eye-catching general chart */}
            <section className="mx-auto mt-24 w-full max-w-6xl px-4 sm:px-6">
                <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-fd-foreground sm:text-3xl">
                            Tell the story behind the data
                        </h2>
                        <p className="mt-3 text-fd-muted-foreground">
                            Annotations are components too. Drop them into a pane and they follow the data as you pan
                            and zoom.
                        </p>
                        <ul className="mt-6 flex flex-col gap-3 text-sm">
                            {annotations.map(([name, text]) => (
                                <li key={name} className="flex gap-2">
                                    <code className="h-fit rounded bg-fd-muted px-1.5 py-0.5 font-mono text-[12px] text-fd-foreground">
                                        {name}
                                    </code>
                                    <span className="text-fd-muted-foreground">{text}</span>
                                </li>
                            ))}
                        </ul>
                        <Link
                            href="/examples/annotated-line"
                            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-fd-foreground hover:underline"
                        >
                            See the code <ArrowRight className="size-3.5" />
                        </Link>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-background shadow-xs">
                        <ExampleView name="annotated-line" height={420} />
                    </div>
                </div>
            </section>

            {/* general-purpose showcase */}
            <section className="mx-auto mt-24 w-full max-w-6xl px-4 sm:px-6">
                <SectionHeader
                    title="Every chart your dashboard needs"
                    description="Areas, bars, horizontal bars, scatter and bubbles on numeric, time or category axes, all with the same pan, zoom, crosshair and tooltips."
                    href="/gallery"
                    link="Chart gallery"
                />
                <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {general.map((item) => (
                        <GalleryCard key={item.name} item={item} height={240} />
                    ))}
                </div>
            </section>

            {/* features */}
            <section className="mx-auto mt-24 w-full max-w-6xl px-4 sm:px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-2xl font-semibold tracking-tight text-fd-foreground sm:text-3xl">
                        Small API, serious engine
                    </h2>
                    <p className="mt-3 text-fd-muted-foreground">
                        Compose charts from React components. The canvas engine does the heavy lifting.
                    </p>
                </div>
                <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-fd-border bg-fd-border sm:grid-cols-2 lg:grid-cols-4">
                    {features.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="flex flex-col gap-2 bg-fd-background p-6">
                            <Icon className="size-5 text-fd-foreground" strokeWidth={1.75} />
                            <h3 className="mt-2 font-medium text-fd-foreground">{title}</h3>
                            <p className="text-sm leading-relaxed text-fd-muted-foreground">{description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* financial, smaller */}
            <section className="mx-auto mt-24 w-full max-w-6xl px-4 sm:px-6">
                <SectionHeader
                    title="Financial charts, too"
                    description="Candlesticks, volume profiles, 30+ indicators and drawing tools, on the same engine."
                    href="/docs/financial"
                    link="Financial charts"
                />
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {financial.map((item) => (
                        <GalleryCard key={item.name} item={item} height={200} />
                    ))}
                </div>
            </section>

            {/* call to action */}
            <section className="mx-auto mt-24 mb-20 w-full max-w-6xl px-4 sm:px-6">
                <div className="flex flex-col items-center rounded-xl border border-fd-border bg-fd-card px-6 py-14 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight text-fd-foreground sm:text-3xl">
                        Build your first chart
                    </h2>
                    <p className="mt-3 max-w-xl text-fd-muted-foreground">
                        Install the packages you need and compose the rest.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/docs/quick-start"
                            className="inline-flex h-10 items-center rounded-md bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground hover:opacity-90"
                        >
                            Quick start
                        </Link>
                        <a
                            href={site.github}
                            className="inline-flex h-10 items-center rounded-md border border-fd-border bg-fd-background px-5 text-sm font-medium hover:bg-fd-accent"
                        >
                            Star on GitHub
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}
