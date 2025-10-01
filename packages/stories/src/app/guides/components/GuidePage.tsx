import React from "react";

type GuidePageProps = {
    title?: string;
    description?: React.ReactNode;
    children: React.ReactNode;
};

export function GuidePage({ title, description, children }: GuidePageProps) {
    return (
        <div className="prose prose-slate max-w-none dark:prose-invert">
            {(title || description) && (
                <div className="mb-8">
                    {title && <h1 className="scroll-m-20 text-4xl mb-2 font-bold tracking-tight">{title}</h1>}
                    {description && <p className="text-xl text-muted-foreground">{description}</p>}
                </div>
            )}
            {children}
        </div>
    );
}

export default GuidePage;
