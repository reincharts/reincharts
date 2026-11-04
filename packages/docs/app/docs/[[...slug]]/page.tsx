import { SectionPage, sectionMetadata } from "@/components/section-page";
import { source } from "@/lib/source";

interface Props {
    params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    return <SectionPage source={source} page={source.getPage(slug)} />;
}

export function generateStaticParams() {
    return source.generateParams();
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    return sectionMetadata(source.getPage(slug), "Reincharts documentation");
}
