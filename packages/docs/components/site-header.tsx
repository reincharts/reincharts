"use client";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { SidebarTrigger } from "fumadocs-ui/layouts/notebook/slots/sidebar";
import { useTheme } from "fumadocs-ui/provider/base";
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/logo";
import { navLinks, site } from "@/lib/site";

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

const iconButton =
    "inline-flex size-8 items-center justify-center rounded-md text-fd-foreground/80 transition-colors hover:bg-fd-accent hover:text-fd-foreground";

function GitHubIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
            <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.3-.52-1.47.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z" />
        </svg>
    );
}

function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const dark = mounted && resolvedTheme === "dark";
    return (
        <button
            type="button"
            className={iconButton}
            aria-label="Toggle theme"
            onClick={() => setTheme(dark ? "light" : "dark")}
        >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
    );
}

function SearchButton() {
    const { setOpenSearch, enabled } = useSearchContext();
    if (!enabled) {
        return null;
    }
    return (
        <>
            <button
                type="button"
                onClick={() => setOpenSearch(true)}
                className="hidden h-8 w-56 items-center gap-2 rounded-md bg-fd-secondary px-3 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent md:flex lg:w-64 dark:bg-fd-card"
            >
                <Search className="size-3.5" />
                <span className="flex-1 text-left">Search documentation...</span>
                <kbd className="pointer-events-none flex h-5 items-center gap-0.5 rounded border border-fd-border bg-fd-background px-1.5 font-mono text-[10px] font-medium">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>
            <button
                type="button"
                onClick={() => setOpenSearch(true)}
                className={`${iconButton} md:hidden`}
                aria-label="Search"
            >
                <Search className="size-4" />
            </button>
        </>
    );
}

/** Mobile menu for pages without a sidebar (home, gallery): the same links as the desktop navbar. */
function MobileMenu() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    useEffect(() => setOpen(false), [pathname]);
    return (
        <>
            <button
                type="button"
                className={`${iconButton} -ms-1.5 md:hidden`}
                aria-label="Menu"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
            >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            {open &&
                createPortal(
                    <div className="fixed inset-x-0 top-14 bottom-0 z-40 bg-fd-background md:hidden">
                        <nav className="flex flex-col gap-1 px-4 py-6">
                            <Link href="/" className="py-2 text-2xl font-medium text-fd-foreground">
                                Home
                            </Link>
                            {navLinks.map((l) => (
                                <Link
                                    key={l.href}
                                    href={l.href}
                                    className={`py-2 text-2xl font-medium ${
                                        isActive(pathname, l.href) ? "text-fd-foreground" : "text-fd-muted-foreground"
                                    }`}
                                >
                                    {l.text}
                                </Link>
                            ))}
                        </nav>
                    </div>,
                    document.body,
                )}
        </>
    );
}

/**
 * The one navbar used on every page (shadcn/ui style): logo + section links on the left,
 * search, GitHub and the theme toggle on the right. Inside a docs layout (`sidebar`), the mobile
 * menu button opens that section's sidebar drawer, which also lists the section links.
 */
export function SiteHeader({ sidebar = false }: { sidebar?: boolean }) {
    const pathname = usePathname();
    return (
        <header
            id="site-header"
            className="sticky top-0 z-30 w-full border-b border-fd-border bg-fd-background/90 backdrop-blur supports-[backdrop-filter]:bg-fd-background/75"
            // contain: the header spans every column of the docs grid without adding to their min-content size
            style={{ gridColumn: "1 / -1", gridRow: 1, contain: "inline-size" }}
        >
            <div className="mx-auto flex h-14 w-full max-w-[97rem] items-center gap-2 px-4 md:px-6">
                {sidebar ? (
                    <SidebarTrigger className={`${iconButton} -ms-1.5 md:hidden`} aria-label="Menu">
                        <Menu className="size-5" />
                    </SidebarTrigger>
                ) : (
                    <MobileMenu />
                )}
                <Link href="/" className="me-4 flex items-center lg:me-6" aria-label="Reincharts home">
                    <Logo />
                </Link>
                <nav className="hidden items-center gap-6 text-sm md:flex">
                    {navLinks.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`font-medium transition-colors hover:text-fd-foreground ${
                                isActive(pathname, l.href) ? "text-fd-foreground" : "text-fd-muted-foreground"
                            }`}
                        >
                            {l.text}
                        </Link>
                    ))}
                </nav>
                <div className="ms-auto flex items-center gap-1 md:gap-2">
                    <SearchButton />
                    <span className="mx-1 hidden h-4 w-px bg-fd-border md:block" />
                    <a href={site.github} className={iconButton} aria-label="GitHub" target="_blank" rel="noreferrer">
                        <GitHubIcon />
                    </a>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
