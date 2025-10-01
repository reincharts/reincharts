"use client";

import * as React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { MainNavItem } from "@/app/types";
import { siteConfig } from "@/app/config/site";
import { cn } from "@/app/libs/utils";
import { Icons } from "@/app/components/icons";

interface MainNavProps {
    items?: MainNavItem[];
}

export function MainNav({ items }: MainNavProps) {
    const segment = useSelectedLayoutSegment();

    return (
        <div className="flex gap-6 md:gap-10">
            <Link href="/" className="hidden items-center space-x-2 md:flex">
                <Icons.logo className="h-10 w-10" />
                <span className="hidden text-xl font-bold sm:inline-block">{siteConfig.name}</span>
            </Link>
            {items?.length ? (
                <nav className="hidden gap-6 md:flex">
                    {items?.map((item, index) => (
                        <Link
                            key={index}
                            href={item.disabled ? "#" : item.href}
                            className={cn(
                                "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
                                item.href.startsWith(`/${segment}`) ? "text-foreground" : "text-foreground/60",
                                item.disabled && "cursor-not-allowed opacity-80",
                            )}
                        >
                            {item.title}
                        </Link>
                    ))}
                </nav>
            ) : null}
        </div>
    );
}
