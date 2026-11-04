"use client";
import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/preview/chart-skeleton";

/** Client-only hero chart (canvas size and device pixel ratio are unknown on the server). */
export const LazyHeroChart = dynamic(() => import("./hero-chart").then((m) => m.HeroChart), {
    ssr: false,
    loading: ChartSkeleton,
});
