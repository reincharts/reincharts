import React from "react";
import { cn } from "@/app/libs/utils";

type ParagraphProps = {
    children: React.ReactNode;
    className?: string;
};

export function Paragraph({ children, className }: ParagraphProps) {
    return <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}>{children}</p>;
}

export default Paragraph;
