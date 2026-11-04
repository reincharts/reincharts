import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/** Home and gallery: the shared navbar without a sidebar. */
export default function Layout({ children }: { children: ReactNode }) {
    return (
        <>
            <SiteHeader />
            {children}
            <SiteFooter />
        </>
    );
}
