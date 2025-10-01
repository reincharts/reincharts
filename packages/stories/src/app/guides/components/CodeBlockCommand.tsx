"use client";

import * as React from "react";
import { Check, Clipboard, Terminal } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
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

export function CodeBlockCommand({
    __npm__,
    __yarn__,
    __pnpm__,
    __bun__,
}: React.ComponentProps<"pre"> & {
    __npm__?: string;
    __yarn__?: string;
    __pnpm__?: string;
    __bun__?: string;
}) {
    const [packageManager, setPackageManager] = React.useState<"pnpm" | "npm" | "yarn" | "bun">("npm");
    const [hasCopied, setHasCopied] = React.useState(false);

    React.useEffect(() => {
        if (hasCopied) {
            const timer = setTimeout(() => setHasCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [hasCopied]);

    const tabs = React.useMemo(() => {
        return {
            npm: __npm__,
            pnpm: __pnpm__,
            yarn: __yarn__,
            bun: __bun__,
        };
    }, [__npm__, __pnpm__, __yarn__, __bun__]);

    const copyCommand = React.useCallback(() => {
        const command = (tabs as Record<string, string | undefined>)[packageManager];
        if (!command) {
            return;
        }
        copyToClipboardWithMeta(command, {
            name: "copy_npm_command",
            properties: {
                command,
                pm: packageManager,
            },
        });
        setHasCopied(true);
    }, [packageManager, tabs]);

    return (
        <div className="relative my-6 overflow-hidden rounded-lg border bg-code">
            <Tabs value={packageManager} className="gap-0" onValueChange={(value) => setPackageManager(value as any)}>
                <div className="border-border/50 flex items-center gap-2 border-b px-3 py-1">
                    <div className="bg-foreground flex size-4 items-center justify-center rounded-[1px] opacity-70">
                        <Terminal className="text-background size-3" />
                    </div>
                    <TabsList className="rounded-none bg-transparent p-0">
                        {Object.entries(tabs).map(([key]) => {
                            return (
                                <TabsTrigger
                                    key={key}
                                    value={key}
                                    className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:border-input h-7 border border-transparent pt-0.5 data-[state=active]:shadow-none"
                                >
                                    {key}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>
                <div className="no-scrollbar overflow-x-auto">
                    {Object.entries(tabs).map(([key, value]) => {
                        return (
                            <TabsContent key={key} value={key} className="mt-0 px-4 py-3.5">
                                <pre>
                                    <code
                                        className="relative font-mono text-sm leading-none text-code-foreground"
                                        data-language="bash"
                                    >
                                        {value}
                                    </code>
                                </pre>
                            </TabsContent>
                        );
                    })}
                </div>
            </Tabs>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        data-slot="copy-button"
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 z-10 size-7 opacity-70 hover:opacity-100 focus-visible:opacity-100 bg-background/10 hover:bg-background/20"
                        onClick={copyCommand}
                    >
                        <span className="sr-only">Copy</span>
                        {hasCopied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{hasCopied ? "Copied" : "Copy to Clipboard"}</TooltipContent>
            </Tooltip>
        </div>
    );
}
