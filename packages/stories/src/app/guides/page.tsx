import { Metadata } from "next";
import GuidePage from "@/app/guides/components/GuidePage";
import GuideSection from "@/app/guides//components/GuideSection";
import { GuideButtonLink, LinkGrid } from "@/app/guides//components/GuideButtons";
import { Card, CardText, CardTitle } from "@/app/guides/components/Card";
import { Paragraph } from "@/app/guides/components/Paragraph";
import { BulletList } from "@/app/guides/components/BulletList";
import { siteConfig } from "@/app/config/site";

export const metadata: Metadata = {
    title: "Introduction",
    description: "Overview of the Reincharts package for React.",
    alternates: {
        canonical: `${siteConfig.url}/guides/`,
    },
    openGraph: {
        title: "Reincharts Introduction",
        description: "Overview of the Reincharts package for React.",
        url: `${siteConfig.url}/guides/`,
    },
};

export default function IntroductionPage() {
    return (
        <GuidePage title="Introduction" description={<>Welcome to Reincharts</>}>
            <GuideSection title="What is Reincharts?">
                <Paragraph>
                    Reincharts is a set of composable React components built for interactive charting. It provides
                    primitives like ChartCanvas, Chart, Axes, Series, Tooltips, Coordinates, and Interactive tools. It
                    leverages D3 scales and a canvas-first rendering approach for speed, while keeping a React-friendly
                    API.
                </Paragraph>
            </GuideSection>

            <GuideSection title="Key Features">
                <BulletList>
                    <li>
                        <strong>Composable primitives:</strong> Build charts from small, reusable components
                    </li>
                    <li>
                        <strong>Performance:</strong> Canvas-first rendering, handles large datasets
                    </li>
                    <li>
                        <strong>Interactive:</strong> Zoom/pan, brush, trend lines, Fibonacci tools
                    </li>
                    <li>
                        <strong>TypeScript:</strong> Types across all packages
                    </li>
                    <li>
                        <strong>Modular:</strong> Import from a single entry point or per-package
                    </li>
                </BulletList>
            </GuideSection>

            <GuideSection title="Packages Overview" id="packages-overview">
                <BulletList>
                    <li>
                        <strong>
                            <code>reincharts</code>
                        </strong>
                        : Aggregated entry point re-exporting all packages
                    </li>
                    <li>
                        <strong>
                            <code>@reincharts/core</code>
                        </strong>
                        : ChartCanvas, Chart, Generic components
                    </li>
                    <li>
                        <strong>
                            <code>@reincharts/axes</code>
                        </strong>
                        : XAxis, YAxis
                    </li>
                    <li>
                        <strong>
                            <code>@reincharts/series</code>
                        </strong>
                        : LineSeries, CandlestickSeries, BarSeries, etc.
                    </li>
                    <li>
                        <strong>
                            <code>@reincharts/coordinates</code>
                        </strong>
                        : CrossHairCursor, MouseCoordinateX/Y, EdgeIndicator
                    </li>
                    <li>
                        <strong>
                            <code>@reincharts/tooltip</code>
                        </strong>
                        : OHLCTooltip, SingleValueTooltip, MACDTooltip…
                    </li>
                    <li>
                        <strong>
                            <code>@reincharts/interactive</code>
                        </strong>
                        : TrendLine, Brush, ZoomButtons, Fibonacci tools
                    </li>
                    <li>
                        <strong>
                            <code>@reincharts/annotations</code>
                        </strong>
                        : Label, BarAnnotation, SvgPathAnnotation
                    </li>
                    <li>
                        <strong>
                            <code>@reincharts/scales</code>
                        </strong>
                        : Discontinuous time scale providers
                    </li>
                    <li>
                        <strong>
                            <code>@reincharts/indicators</code>
                        </strong>
                        : Indicator helpers
                    </li>
                    <li>
                        <strong>
                            <code>@reincharts/utils</code>
                        </strong>
                        : withSize, withDeviceRatio HOCs
                    </li>
                </BulletList>
            </GuideSection>

            <GuideSection title="Chart Types">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <Card>
                        <CardTitle>Line</CardTitle>
                        <CardText>Line chart for trends over time</CardText>
                    </Card>
                    <Card>
                        <CardTitle>Area</CardTitle>
                        <CardText>Standard area chart for trends over time</CardText>
                    </Card>
                    <Card>
                        <CardTitle>Bar</CardTitle>
                        <CardText>Bar series for volume or categorical data</CardText>
                    </Card>
                    <Card>
                        <CardTitle>Candlestick</CardTitle>
                        <CardText>Visualize OHLC price action with wicks and bodies</CardText>
                    </Card>
                    <Card>
                        <CardTitle>Scatter</CardTitle>
                        <CardText>Scatter plot for visualizing data points</CardText>
                    </Card>
                    <Card>
                        <CardTitle>Heikin Ashi</CardTitle>
                        <CardText>Smooths price action for trend analysis</CardText>
                    </Card>
                    <Card>
                        <CardTitle>Kagi</CardTitle>
                        <CardText>Price movement chart that ignores time</CardText>
                    </Card>
                    <Card>
                        <CardTitle>OHLC</CardTitle>
                        <CardText>Open, High, Low, Close rendered as bars</CardText>
                    </Card>
                    <Card>
                        <CardTitle>Point & Figure</CardTitle>
                        <CardText>Charts price movement with Xs and Os</CardText>
                    </Card>
                    <Card>
                        <CardTitle>Renko</CardTitle>
                        <CardText>Brick-based chart for filtering out minor price moves</CardText>
                    </Card>
                </div>
            </GuideSection>

            <GuideSection title="Getting Started">
                <Paragraph>
                    Ready to start building charts? Follow the step-by-step guide to get Reincharts up and running in
                    your app.
                </Paragraph>
                <LinkGrid>
                    <GuideButtonLink href="/guides/installation" variant="default">
                        Installation Guide
                    </GuideButtonLink>
                    <GuideButtonLink href="/guides/getting-started" variant="outline">
                        Getting Started
                    </GuideButtonLink>
                </LinkGrid>
            </GuideSection>
        </GuidePage>
    );
}
