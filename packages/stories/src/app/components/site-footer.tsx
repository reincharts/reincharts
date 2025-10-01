import * as React from "react";

import { cn } from "@/app/libs/utils";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
    return (
        <footer className={cn(className)}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <p className="text-center text-sm leading-loose md:text-left">
                        Built by Reincharts. Released under the{" "}
                        <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">
                            MIT License
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
