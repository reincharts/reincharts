"use client";

export default function StorybookPage() {
    return (
        <iframe
            src="/docs/index.html"
            className="w-full h-[calc(100vh-4.1rem)] border-0"
            title="Storybook Documentation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox"
        />
    );
}
