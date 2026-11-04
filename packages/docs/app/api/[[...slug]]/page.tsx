import { SectionPage, sectionMetadata } from "@/components/section-page";
import { apiSource } from "@/lib/source";

interface Props {
    params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    return <SectionPage source={apiSource} page={apiSource.getPage(slug)} />;
}

export function generateStaticParams() {
    return apiSource.generateParams();
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    return sectionMetadata(apiSource.getPage(slug), "Reincharts API reference");
}
