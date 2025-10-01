import fs from "node:fs/promises";
import path from "node:path";
import * as React from "react";

import { highlightCode } from "@/app/libs/highlight-code";
import { cn } from "@/app/libs/utils";
import { CodeCollapsibleWrapper } from "@/app/guides/components/CodeCollapsibleWrapper";
import { CopyButton } from "@/app/guides/components/CopyButton";
import { getIconForLanguageExtension } from "@/app/components/icons";

export async function CodeFromFile({
    src,
    title,
    language,
    collapsible = true,
    className,
}: React.ComponentProps<"div"> & {
    src?: string;
    title?: string;
    language?: string;
    collapsible?: boolean;
}) {
    if (!src) {
        return null;
    }

    let code: string | undefined;

    if (src) {
        const file = await fs.readFile(path.join(process.cwd(), src), "utf-8");
        code = file;
    }

    if (!code) {
        return null;
    }

    const lang = language ?? title?.split(".").pop() ?? "tsx";
    const highlightedCode = await highlightCode(code, lang);

    if (!collapsible) {
        return (
            <div className={cn("relative", className)}>
                <ComponentCode code={code} highlightedCode={highlightedCode} language={lang} title={title} />
            </div>
        );
    }

    return (
        <CodeCollapsibleWrapper className={className}>
            <ComponentCode code={code} highlightedCode={highlightedCode} language={lang} title={title} />
        </CodeCollapsibleWrapper>
    );
}

export async function CodeFromText({
    title,
    language,
    collapsible = true,
    className,
    children,
}: React.ComponentProps<"div"> & {
    title?: string;
    language?: string;
    collapsible?: boolean;
    children?: React.ReactNode;
}) {
    let code: string | undefined;

    if (children) {
        code = String(children);
    }

    if (!code) {
        return null;
    }

    const lang = language ?? title?.split(".").pop() ?? "tsx";
    const highlightedCode = await highlightCode(code, lang);

    if (!collapsible) {
        return (
            <div className={cn("relative", className)}>
                <ComponentCode code={code} highlightedCode={highlightedCode} language={lang} title={title} />
            </div>
        );
    }

    return (
        <CodeCollapsibleWrapper className={className}>
            <ComponentCode code={code} highlightedCode={highlightedCode} language={lang} title={title} />
        </CodeCollapsibleWrapper>
    );
}

function ComponentCode({
    code,
    highlightedCode,
    language,
    title,
}: {
    code: string;
    highlightedCode: string;
    language: string;
    title: string | undefined;
}) {
    return (
        <figure data-rehype-pretty-code-figure="" className="[&>pre]:max-h-96">
            {title && (
                <figcaption
                    data-rehype-pretty-code-title=""
                    className="text-code-foreground [&_svg]:text-code-foreground flex items-center gap-2 [&_svg]:size-4 [&_svg]:opacity-70"
                    data-language={language}
                >
                    {getIconForLanguageExtension(language)}
                    {title}
                </figcaption>
            )}
            <CopyButton value={code} />
            <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </figure>
    );
}
