"use client";
import type { ReactNode } from "react";

/** Small segmented control used by interactive examples. */
export function Segmented<T extends string>({
    value,
    options,
    onChange,
    label,
}: {
    value: T;
    options: readonly T[];
    onChange: (value: T) => void;
    label?: string;
}) {
    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-xs text-fd-muted-foreground">{label}</span>}
            <div className="inline-flex rounded-md border border-fd-border p-0.5">
                {options.map((o) => (
                    <button
                        key={o}
                        type="button"
                        onClick={() => onChange(o)}
                        className={`rounded-[5px] px-2 py-0.5 text-xs font-medium transition-colors ${
                            o === value
                                ? "bg-fd-accent text-fd-foreground"
                                : "text-fd-muted-foreground hover:text-fd-foreground"
                        }`}
                    >
                        {o}
                    </button>
                ))}
            </div>
        </div>
    );
}

/** A toolbar row above a chart that fills the remaining height. */
export function WithToolbar({ toolbar, children }: { toolbar: ReactNode; children: ReactNode }) {
    return (
        <div className="flex size-full flex-col">
            <div className="flex flex-wrap items-center gap-3 border-b border-fd-border px-3 py-2">{toolbar}</div>
            <div className="min-h-0 flex-1">{children}</div>
        </div>
    );
}

/** Small button for example toolbars. */
export function ToolbarButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-md border border-fd-border px-2 py-0.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
        >
            {children}
        </button>
    );
}
