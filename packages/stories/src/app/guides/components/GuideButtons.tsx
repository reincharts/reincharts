import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/app/components/ui/button";
import { cn } from "@/app/libs/utils";

type GuideButtonLinkProps = {
    href: string;
    children: React.ReactNode;
    variant?: "default" | "outline" | "secondary" | "ghost";
    alignStart?: boolean;
};

export function GuideButtonLink({ href, children, variant = "outline", alignStart }: GuideButtonLinkProps) {
    return (
        <Link href={href} className={cn(buttonVariants({ variant }), alignStart ? "justify-start" : undefined)}>
            {children}
        </Link>
    );
}

export function LinkGrid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">{children}</div>;
}

export default GuideButtonLink;
