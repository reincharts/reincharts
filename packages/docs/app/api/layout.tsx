import type { ReactNode } from "react";
import { SectionLayout } from "@/lib/layout.shared";
import { apiSource } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
    return <SectionLayout tree={apiSource.getPageTree()}>{children}</SectionLayout>;
}
