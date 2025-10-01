import Link from "next/link";
import { Metadata } from "next";
import { buttonVariants } from "@/app/components/ui/button";
import { cn } from "@/app/libs/utils";

export const metadata: Metadata = {
    title: "Page Not Found - Reincharts",
    description:
        "The page you're looking for doesn't exist. Explore our React charting documentation, guides, and API reference instead.",
    robots: {
        index: false,
        follow: true,
    },
};

export default function NotFound() {
    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <section className="flex min-h-[80vh] flex-col items-center justify-center space-y-6 text-center">
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl">404 - Page Not Found</h1>
                    <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                        The page you&apos;re looking for doesn&apos;t exist. But don&apos;t worry, there&apos;s plenty
                        of other pages to explore!
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/" className={cn(buttonVariants({ size: "lg" }))}>
                        Go Home
                    </Link>
                    <Link href="/guides" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                        Browse Guides
                    </Link>
                    <Link href="/api" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                        API Reference
                    </Link>
                    <Link href="/storybook" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                        Storybook
                    </Link>
                </div>
            </section>
        </div>
    );
}
