"use client";

export default function ApiPage() {
    return (
        <iframe
            src="/typedocs/index.html"
            className="w-full h-[calc(100vh-4.1rem)] border-0"
            title="API Documentation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
    );
}
