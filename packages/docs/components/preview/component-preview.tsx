import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { ExampleView } from "./example-view";
import { PreviewTabs } from "./preview-tabs";
import { readExample } from "./read-example";

export interface ComponentPreviewProps {
    /** File name in `examples/` without the extension, e.g. "candlestick" for examples/candlestick.tsx. */
    name: string;
    /** Height of the live preview. Default 400. */
    height?: number | string;
    /** Hide the Code tab. */
    hideCode?: boolean;
    /** Extra classes for the outer wrapper. */
    className?: string;
}

/**
 * Live example in a bordered card with Preview / Code tabs (shadcn style).
 * Server component: reads the example's source at build time and highlights it with Shiki;
 * the example itself is loaded lazily on the client (no SSR, so charts are hydration-safe).
 */
export async function ComponentPreview({ name, height = 400, hideCode = false, className }: ComponentPreviewProps) {
    const code = readExample(name);
    return (
        <PreviewTabs
            className={className}
            hideCode={hideCode}
            preview={<ExampleView name={name} height={height} />}
            code={
                <ServerCodeBlock
                    code={code}
                    lang="tsx"
                    themes={{ light: "github-light", dark: "github-dark" }}
                    codeblock={{
                        title: `${name}.tsx`,
                        className: "my-0 rounded-none border-0",
                        viewportProps: { className: "max-h-[560px]" },
                    }}
                />
            }
        />
    );
}
