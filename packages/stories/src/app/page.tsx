import Link from "next/link";
import { Metadata } from "next";

import { SiteFooter } from "@/app/components/site-footer";
import { siteConfig } from "@/app/config/site";
import { cn } from "@/app/libs/utils";
import { buttonVariants } from "@/app/components/ui/button";

import CandlestickSeries from "@/app/guides/getting-started/snippets/Step5_CandlestickSeries";

export const metadata: Metadata = {
    title: "Interactive React Charting Library",
    description:
        "Build performant interactive charts with React. Open-source library featuring customizable chart components.",
    alternates: {
        canonical: siteConfig.url,
    },
    openGraph: {
        title: "Reincharts - Interactive React Charting Library",
        description: "Build performant interactive charts with React.",
        url: siteConfig.url,
        images: [
            {
                url: "/chart.png",
                width: 1200,
                height: 630,
                alt: "Reincharts interactive chart example showing dynamic data visualization",
            },
        ],
    },
};

export default async function IndexPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <section id="welcome" className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-20">
                <div className="flex max-w-[64rem] mx-auto flex-col items-center gap-4 text-center">
                    <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">{siteConfig.name}</h1>
                    <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                        An interactive charting library built on React components
                    </p>
                    <div className="space-x-4">
                        <Link href="/guides" className={cn(buttonVariants({ size: "lg" }))}>
                            Get Started
                        </Link>
                    </div>
                    <div className="min-w-[42rem] my-6 border rounded-lg p-4 bg-gray-50">
                        <CandlestickSeries />
                    </div>
                </div>
            </section>
            <section
                id="features"
                className="my-6 border rounded-lg p-4 space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24"
            >
                <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                    <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Features</h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                        Create fast and interactive charts for React with ease.
                    </p>
                </div>
                <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <svg viewBox="0 0 24 24" className="h-12 w-12 fill-current">
                                <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38a2.167 2.167 0 0 0-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44a23.476 23.476 0 0 0-3.107-.534A23.892 23.892 0 0 0 12.769 4.7c1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442a22.73 22.73 0 0 0-3.113.538 15.02 15.02 0 0 1-.254-1.42c-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87a25.64 25.64 0 0 1-4.412.005 26.64 26.64 0 0 1-1.183-1.86c-.372-.64-.71-1.29-1.018-1.946a25.17 25.17 0 0 1 1.013-1.954c.38-.66.773-1.286 1.18-1.868A25.245 25.245 0 0 1 12 8.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933a25.952 25.952 0 0 0-1.345-2.32zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493a23.966 23.966 0 0 0-1.1-2.98c.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98a23.142 23.142 0 0 0-1.086 2.964c-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39a25.819 25.819 0 0 0 1.341-2.338zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143a22.005 22.005 0 0 1-2.006-.386c.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295a1.185 1.185 0 0 1-.553-.132c-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" />
                            </svg>
                            <div className="space-y-2">
                                <h3 className="font-bold">React</h3>
                                <p className="text-sm text-muted-foreground">Built for React.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <svg viewBox="0 0 24 24" className="h-12 w-12 fill-current">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    transform="translate(-.999 -.999)scale(1.08317)"
                                    d="M12.012 1.324a.68.68 0 0 0-.596.336l-7 12A.675.675 0 0 0 5 14.676h6.324V22a.675.675 0 0 0 1.26.34l7-12A.675.675 0 0 0 19 9.324h-6.324V2a.67.67 0 0 0-.664-.676M11.324 4.5V10a.67.67 0 0 0 .676.676h5.824L12.676 19.5V14a.67.67 0 0 0-.676-.676H6.176Z"
                                />
                            </svg>
                            <div className="space-y-2">
                                <h3 className="font-bold">Fast</h3>
                                <p className="text-sm text-muted-foreground">Built on HTML canvas and SVG.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <svg viewBox="0 0 23.761275 23.761279" className="h-12 w-12 fill-current">
                                <path
                                    d="M 11.572266,-0.0390625 -0.0390625,12.425781 5.5625,17.644531 6.2929687,15.566406 c 0.086753,-0.247327 0.2196832,-0.470075 0.4003907,-0.664062 0.7162012,-0.768837 1.9224709,-0.812015 2.6914062,-0.0957 0.7688694,0.716252 0.8118494,1.922628 0.095703,2.691406 -0.1808864,0.194179 -0.3932071,0.343247 -0.6347657,0.447265 l -2.0234375,0.875 5.6035154,5.21875 4.431641,-4.755859 c 0.04526,0.712014 0.354271,1.36647 0.875,1.851563 1.120634,1.043944 2.881251,0.982621 3.925781,-0.138672 1.044039,-1.120766 0.979978,-2.881868 -0.140625,-3.925782 -0.517674,-0.482245 -1.188225,-0.744542 -1.908203,-0.742187 l 4.429687,-4.755859 -4.753906,-4.4296879 c 0.710133,-0.044651 1.36565,-0.3533762 1.851563,-0.875 C 22.181018,5.1465316 22.116976,3.3859706 20.996094,2.3417969 19.875256,1.2976654 18.116474,1.3595209 17.072266,2.4804688 16.589628,2.9985753 16.326073,3.670061 16.328125,4.390625 Z m 0.06055,1.6425781 4.197265,3.9121094 c 0.09358,0.087179 0.209467,0.1492402 0.335938,0.1777344 0.391254,0.08896 0.80246,-0.034585 1.072265,-0.3242188 0.12609,-0.1353564 0.213507,-0.2983837 0.267578,-0.5175781 l 0.002,-0.00586 v -0.00781 c 0.01429,-0.090909 0.01272,-0.2150206 -0.002,-0.3164062 -0.0057,-0.03771 -0.01157,-0.072898 -0.01367,-0.1171875 -0.0085,-0.4235669 0.143207,-0.8233258 0.429688,-1.1308594 0.607436,-0.6520779 1.631064,-0.6875868 2.283203,-0.080078 0.652186,0.6075479 0.687675,1.6289999 0.08008,2.28125 -0.282616,0.303386 -0.659097,0.4819382 -1.115234,0.5097656 l -0.150391,-0.00977 -0.199219,0.017578 -0.01172,0.00391 c -0.218612,0.053268 -0.410103,0.1630043 -0.556641,0.3203125 -0.271075,0.2909982 -0.364119,0.7095587 -0.246094,1.0957032 0.03732,0.1204765 0.105697,0.2292892 0.199219,0.3164062 l 4.189453,3.9023434 -3.912109,4.201172 c -0.08676,0.09314 -0.147809,0.205369 -0.177735,0.333985 -0.128181,0.564676 0.169177,1.173931 0.841797,1.339843 l 0.0059,0.002 h 0.0078 c 0.0885,0.01396 0.209576,0.01416 0.304688,0 0.04814,-0.0066 0.08742,-0.01391 0.128906,-0.01563 0.424269,-0.0088 0.825953,0.14383 1.132812,0.429688 0.651594,0.606997 0.687376,1.631275 0.08008,2.283203 -0.607035,0.65165 -1.629235,0.687473 -2.28125,0.08008 -0.304648,-0.283799 -0.485968,-0.668103 -0.509766,-1.085937 v -0.0039 c -1.37e-4,-0.0025 1.26e-4,-0.0053 0,-0.0078 l 0.0078,-0.238281 -0.01758,-0.13086 -0.002,-0.0098 c -0.14903,-0.602678 -0.833419,-0.98023 -1.410156,-0.804688 -0.123257,0.03611 -0.2359,0.106366 -0.324219,0.201172 l -3.902343,4.189453 -3.4472661,-3.210937 0.3886719,-0.167969 c 0.389919,-0.168201 0.7326612,-0.412462 1.0234372,-0.724609 1.153152,-1.2379 1.083716,-3.180697 -0.154297,-4.333985 C 8.9396024,12.80363 6.9969208,12.871456 5.84375,14.109375 5.5533492,14.421118 5.3338095,14.782108 5.1933594,15.181641 l -0.140625,0.398437 -3.4472657,-3.21289 z"
                                    style={{ strokeWidth: 0.0733037 }}
                                    transform="matrix(0.98684073,0,0,0.98684073,0.03854847,0.03854847)"
                                />
                            </svg>
                            <div className="space-y-2">
                                <h3 className="font-bold">Composable</h3>
                                <p className="text-sm text-muted-foreground">
                                    Build charts as simple or complex as you want with a rich set of components.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section id="explore" className="container py-8 md:py-12 lg:py-24 mb-20">
                <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
                    <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Explore the Docs</h2>
                    <div className="space-x-4">
                        <Link href="/guides" className={cn(buttonVariants({ size: "lg" }))}>
                            Get Started
                        </Link>
                    </div>
                </div>
            </section>
            <SiteFooter />
        </div>
    );
}
