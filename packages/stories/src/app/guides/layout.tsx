import { docsConfig } from "@/app/config/docs";
import { DocsSidebarNav } from "@/app/components/sidebar-nav";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { SiteFooter } from "@/app/components/site-footer";

interface DocsLayoutProps {
    children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
                <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
                    <ScrollArea className="h-full py-6 pr-6 lg:py-8">
                        <DocsSidebarNav items={docsConfig.sidebarNav} />
                    </ScrollArea>
                </aside>
                <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
                    <div className="mx-auto w-full min-w-0">{children}</div>
                </main>
            </div>
            <SiteFooter />
        </div>
    );
}
