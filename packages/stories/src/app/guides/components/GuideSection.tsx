import React from "react";

type GuideSectionProps = {
    title: string;
    children: React.ReactNode;
    id?: string;
};

export function GuideSection({ title, children, id }: GuideSectionProps) {
    return (
        <div className="mb-8" id={id}>
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">{title}</h2>
            {children}
        </div>
    );
}

export default GuideSection;
