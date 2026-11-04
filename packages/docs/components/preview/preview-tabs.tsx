"use client";
import { useState, type ReactNode } from "react";

const tabs = ["Preview", "Code"] as const;

/** The tab strip + bordered card used by `<ComponentPreview>`. Both panels stay mounted so the chart keeps its state. */
export function PreviewTabs({
    preview,
    code,
    hideCode,
    className,
}: {
    preview: ReactNode;
    code: ReactNode;
    hideCode?: boolean;
    className?: string;
}) {
    const [tab, setTab] = useState<(typeof tabs)[number]>("Preview");
    return (
        <div className={`not-prose my-6 flex flex-col gap-3 ${className ?? ""}`}>
            {!hideCode && (
                <div role="tablist" className="flex items-center gap-4 border-b border-fd-border">
                    {tabs.map((t) => (
                        <button
                            key={t}
                            type="button"
                            role="tab"
                            aria-selected={tab === t}
                            onClick={() => setTab(t)}
                            className={`-mb-px border-b-2 px-0.5 pb-2.5 text-sm font-medium transition-colors ${
                                tab === t
                                    ? "border-fd-foreground text-fd-foreground"
                                    : "border-transparent text-fd-muted-foreground hover:text-fd-foreground"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}
            <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-background">
                <div role="tabpanel" hidden={tab !== "Preview"}>
                    {preview}
                </div>
                {!hideCode && (
                    <div role="tabpanel" hidden={tab !== "Code"} className="[&_figure]:shadow-none">
                        {code}
                    </div>
                )}
            </div>
        </div>
    );
}
