import type { ReactNode } from "react";
import { SectionLayout } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
    return <SectionLayout tree={source.getPageTree()}>{children}</SectionLayout>;
}
