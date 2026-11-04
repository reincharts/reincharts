import { SectionPage, sectionMetadata } from "@/components/section-page";
import { examplesSource } from "@/lib/source";

interface Props {
    params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    return <SectionPage source={examplesSource} page={examplesSource.getPage(slug)} />;
}

export function generateStaticParams() {
    return examplesSource.generateParams();
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    return sectionMetadata(examplesSource.getPage(slug), "Reincharts example");
}
