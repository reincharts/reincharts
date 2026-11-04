"use client";
import { useEffect, useRef, useState } from "react";
import { ChartSkeleton } from "./chart-skeleton";
import { examples } from "./registry.generated";

/** Renders a registered example (client only) inside a fixed-height box, mounting it when it scrolls into view. */
export function ExampleView({ name, height }: { name: string; height: number | string }) {
    const Example = examples[name];
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === "undefined") {
            setVisible(true);
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "400px 0px" },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return (
        <div ref={ref} className="relative w-full" style={{ height }}>
            {!Example ? (
                <p className="p-6 text-sm text-fd-error">Unknown example “{name}”. Run `pnpm generate`.</p>
            ) : visible ? (
                <Example />
            ) : (
                <ChartSkeleton />
            )}
        </div>
    );
}
