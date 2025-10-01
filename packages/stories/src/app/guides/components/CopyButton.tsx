"use client";

import * as React from "react";
import { Check, Clipboard } from "lucide-react";

import { cn } from "@/app/libs/utils";
import { Button } from "@/app/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";

export function copyToClipboardWithMeta(
    value: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _event?: { name: string; properties?: Record<string, unknown> },
) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(value);
    }
}

export function CopyButton({
    value,
    className,
    variant = "ghost",
    ...props
}: React.ComponentProps<typeof Button> & {
    value: string;
}) {
    const [hasCopied, setHasCopied] = React.useState(false);

    React.useEffect(() => {
        if (!hasCopied) {
            return;
        }
        const t = setTimeout(() => setHasCopied(false), 2000);
        return () => clearTimeout(t);
    }, [hasCopied]);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    data-slot="copy-button"
                    size="icon"
                    variant={variant}
                    className={cn(
                        "absolute top-3 right-2 z-10 size-7 opacity-70 hover:opacity-100 focus-visible:opacity-100",
                        className,
                    )}
                    onClick={() => {
                        copyToClipboardWithMeta(value);
                        setHasCopied(true);
                    }}
                    {...props}
                >
                    <span className="sr-only">Copy</span>
                    {hasCopied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{hasCopied ? "Copied" : "Copy to Clipboard"}</TooltipContent>
        </Tooltip>
    );
}
