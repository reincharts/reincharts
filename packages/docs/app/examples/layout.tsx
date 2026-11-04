import type { ReactNode } from "react";
import { SectionLayout } from "@/lib/layout.shared";
import { examplesSource } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
    return <SectionLayout tree={examplesSource.getPageTree()}>{children}</SectionLayout>;
}
