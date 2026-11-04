"use client";
import { Code2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/** "View code" button that opens the highlighted example source in a modal. */
export function CodeDialog({ title, children }: { title: string; children: ReactNode }) {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (!open) {
            return;
        }
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open]);
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
            >
                <Code2 className="size-3.5" />
                View code
            </button>
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
                    onClick={() => setOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-label={`${title} code`}
                        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-background shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-fd-border px-4 py-3">
                            <span className="text-sm font-medium">{title}</span>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                className="rounded-md p-1 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <div className="min-h-0 overflow-auto [&_figure]:my-0 [&_figure]:rounded-none [&_figure]:border-0">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
