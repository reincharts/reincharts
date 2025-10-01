import Link from "next/link";
import { Metadata } from "next";

import GuidePage from "@/app/guides/components/GuidePage";
import GuideSection from "@/app/guides/components/GuideSection";
import { GuideButtonLink, LinkGrid } from "@/app/guides/components/GuideButtons";
import { Paragraph } from "@/app/guides/components/Paragraph";
import { BulletList } from "@/app/guides/components/BulletList";
import { CodeBlockCommand } from "@/app/guides/components/CodeBlockCommand";
import { CodeFromFile } from "@/app/guides/components/CodeComponent";
import { siteConfig } from "@/app/config/site";

export const metadata: Metadata = {
    title: "Installation Guide",
    description: "Installation guide for Reincharts React charting library.",
    alternates: {
        canonical: `${siteConfig.url}/guides/installation/`,
    },
    openGraph: {
        title: "Install Reincharts",
        description: "Installation guide for Reincharts React charting library.",
        url: `${siteConfig.url}/guides/installation/`,
        images: [
            {
                url: "/chart.png",
                width: 1200,
                height: 630,
                alt: "Reincharts installation and setup guide for React developers",
            },
        ],
    },
};

export default function InstallationPage() {
    return (
        <GuidePage title="Installation" description={<>Install and set up Reincharts in your React application.</>}>
            <GuideSection title="Requirements">
                <Paragraph>Before installing, make sure you have the following:</Paragraph>
                <BulletList>
                    <li>React</li>
                    <li>Node.js</li>
                    <li>A node package manager</li>
                </BulletList>
            </GuideSection>

            <GuideSection title="Installation Methods">
                <CodeBlockCommand
                    __npm__="npm install reincharts"
                    __yarn__="yarn add reincharts"
                    __pnpm__="pnpm add reincharts"
                    __bun__="bun add reincharts"
                />
                <Paragraph>Or install individual packages as needed:</Paragraph>
                <CodeBlockCommand
                    __npm__="npm install @reincharts/<package>"
                    __yarn__="yarn add @reincharts/<package>"
                    __pnpm__="pnpm add @reincharts/<package>"
                    __bun__="bun add @reincharts/<package>"
                />
                <Paragraph>
                    The list of packages can be found on the{" "}
                    <Link href="/guides#packages-overview" className="underline text-blue-600 hover:text-blue-800">
                        Packages Overview
                    </Link>{" "}
                    section of the introduction page.
                </Paragraph>
            </GuideSection>

            <GuideSection title="Setup">
                <Paragraph>
                    After installation, you can import components from the aggregated entry point or per-package
                    imports:
                </Paragraph>
                <CodeFromFile
                    title="usage.tsx"
                    language="tsx"
                    src="/src/app/guides/installation/snippets/usage.tsx"
                    collapsible={false}
                />
            </GuideSection>

            <GuideSection title="TypeScript Support">
                <Paragraph>
                    This library includes TypeScript definitions out of the box. No additional installation is required.
                </Paragraph>
                <CodeFromFile
                    title="usage-typescript.tsx"
                    language="tsx"
                    src="/src/app/guides/installation/snippets/usage-typescript.tsx"
                    collapsible={false}
                />
            </GuideSection>

            <GuideSection title="Next Steps">
                <Paragraph>
                    Now that you have Reincharts installed, you&apos;re ready to build your first chart.
                </Paragraph>
                <LinkGrid>
                    <GuideButtonLink href="/guides/getting-started" variant="default">
                        Getting Started
                    </GuideButtonLink>
                </LinkGrid>
            </GuideSection>
        </GuidePage>
    );
}
