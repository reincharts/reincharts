import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
    return (
        <footer className="mt-auto border-t border-fd-border">
            <div className="mx-auto flex w-full max-w-[97rem] flex-col gap-2 px-4 py-6 text-sm text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-6">
                <p>Built by the Reincharts contributors. MIT licensed.</p>
                <nav className="flex gap-4">
                    <Link href="/docs" className="hover:text-fd-foreground">
                        Docs
                    </Link>
                    <Link href="/examples" className="hover:text-fd-foreground">
                        Examples
                    </Link>
                    <Link href="/api" className="hover:text-fd-foreground">
                        API
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
