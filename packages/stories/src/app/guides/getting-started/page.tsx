import Link from "next/link";
import { Metadata } from "next";

import GuidePage from "@/app/guides/components/GuidePage";
import GuideSection from "@/app/guides/components/GuideSection";
import { SubSectionHeading } from "@/app/guides/components/SubSection";
import { Paragraph } from "@/app/guides/components/Paragraph";
import { GuideButtonLink, LinkGrid } from "@/app/guides/components/GuideButtons";
import { CodeFromFile, CodeFromText } from "@/app/guides/components/CodeComponent";
import { DAILY_JSON } from "@/data/withOHLCData";
import { ChartContainer } from "@/app/guides/components/ChartContainer";

import Step1_BasicChart from "@/app/guides/getting-started/snippets/Step1_BasicChart";
import Step2_AddAxes from "@/app/guides/getting-started/snippets/Step2_AddAxes";
import Step3_AddCoordinates from "@/app/guides/getting-started/snippets/Step3_AddCoordinates";
import Step4_AddTooltip from "@/app/guides/getting-started/snippets/Step4_AddTooltip";
import Step5_CandlestickSeries from "@/app/guides/getting-started/snippets/Step5_CandlestickSeries";
import Step6_MultiPanel from "@/app/guides/getting-started/snippets/Step6_MultiPanel";
import Step7_MovingAverages from "@/app/guides/getting-started/snippets/Step7_MovingAverages";
import Step8_CompleteChart from "@/app/guides/getting-started/snippets/Step8_CompleteChart";
import { siteConfig } from "@/app/config/site";

export const metadata: Metadata = {
    title: "Getting Started",
    description: "Step-by-step guide to build interactive React charts with Reincharts.",
    alternates: {
        canonical: `${siteConfig.url}/guides/getting-started/`,
    },
    openGraph: {
        title: "Reincharts Getting Started",
        description: "Step-by-step guide to build interactive React charts with Reincharts.",
        url: `${siteConfig.url}/guides/getting-started/`,
        images: [
            {
                url: "/chart.png",
                width: 1200,
                height: 630,
                alt: "Step-by-step React chart tutorial showing interactive data visualization",
            },
        ],
    },
};

export default function GettingStartedPage() {
    return (
        <GuidePage
            title="Getting Started"
            description={
                <>Build your first chart step-by-step, learning the core concepts and gradually adding complexity.</>
            }
        >
            <GuideSection title="Step 1 · Basic Chart with ChartCanvas, Chart & Series">
                <Paragraph>Start by understanding the three foundational components that work together:</Paragraph>
                <Paragraph>
                    <strong>• ChartCanvas</strong> is the top-level container that orchestrates the entire charting
                    system. It manages data processing, scales, interactions, and provides the foundation for all chart
                    elements. It requires data, scale provider, accessors, and extents to define the plotting domain.
                </Paragraph>
                <Paragraph>
                    <strong>• Chart</strong> represents an individual chart panel within the ChartCanvas. Multiple Chart
                    components can be stacked vertically to create multi-panel layouts. Each Chart has its own Y-scale
                    and manages a specific vertical area. Chart components need an id, yExtents (for Y-domain
                    calculation), and optional height/origin positioning.
                </Paragraph>
                <Paragraph>
                    <strong>• Series components</strong> (like LineSeries) render the actual data visualization.
                    LineSeries connects data points with a line. All series need a yAccessor to extract the Y values
                    from your data. Series components go inside Chart panels and need yAccessor functions to map data to
                    visual coordinates.
                </Paragraph>
                <ChartContainer>
                    <Step1_BasicChart />
                </ChartContainer>
                <CodeFromFile
                    title="Step1_BasicChart.tsx"
                    language="tsx"
                    src="/src/app/guides/getting-started/snippets/Step1_BasicChart.tsx"
                    collapsible={true}
                />
                <Paragraph>
                    This example shows how ChartCanvas, Chart, and LineSeries work together to create a basic
                    functioning chart. A snippet of the data being used in this chart can be found{" "}
                    <Link
                        href="/guides/getting-started#data-snippet"
                        className="underline text-blue-600 hover:text-blue-800"
                    >
                        here
                    </Link>
                    .
                </Paragraph>
            </GuideSection>

            <GuideSection title="Step 2 · Add Axes">
                <Paragraph>
                    <strong>Axes</strong> provide reference scales and labels for your data. XAxis shows time/date
                    labels, YAxis shows value labels. They can be positioned at different sides and configured with
                    ticks and grid lines.
                </Paragraph>
                <ChartContainer>
                    <Step2_AddAxes />
                </ChartContainer>
                <CodeFromFile
                    title="Step2_AddAxes.tsx"
                    language="tsx"
                    src="/src/app/guides/getting-started/snippets/Step2_AddAxes.tsx"
                    collapsible={true}
                />
                <Paragraph>
                    Axes are positioned with axisAt and orient props. They automatically scale based on the chart&apos;s
                    domains. A snippet of the data being used in this chart can be found{" "}
                    <Link
                        href="/guides/getting-started#data-snippet"
                        className="underline text-blue-600 hover:text-blue-800"
                    >
                        here
                    </Link>
                    .
                </Paragraph>
            </GuideSection>

            <GuideSection title="Step 3 · Add Coordinates & Crosshair">
                <Paragraph>
                    <strong>Coordinates</strong> provide interactive feedback showing exact values under the mouse
                    cursor. CrossHairCursor draws crosshair lines, while MouseCoordinate components show formatted
                    values.
                </Paragraph>
                <ChartContainer>
                    <Step3_AddCoordinates />
                </ChartContainer>
                <CodeFromFile
                    title="Step3_AddCoordinates.tsx"
                    language="tsx"
                    src="/src/app/guides/getting-started/snippets/Step3_AddCoordinates.tsx"
                    collapsible={true}
                />
                <Paragraph>
                    Use displayFormat to control how values are shown. A snippet of the data being used in this chart
                    can be found{" "}
                    <Link
                        href="/guides/getting-started#data-snippet"
                        className="underline text-blue-600 hover:text-blue-800"
                    >
                        here
                    </Link>
                    .
                </Paragraph>
            </GuideSection>

            <GuideSection title="Step 4 · Add Tooltips">
                <Paragraph>
                    <strong>Tooltips</strong> display data values in a fixed position as you move the mouse. Different
                    tooltip types exist for different data formats (OHLC, single values, multiple indicators).
                </Paragraph>
                <ChartContainer>
                    <Step4_AddTooltip />
                </ChartContainer>
                <CodeFromFile
                    title="Step4_AddTooltip.tsx"
                    language="tsx"
                    src="/src/app/guides/getting-started/snippets/Step4_AddTooltip.tsx"
                    collapsible={true}
                />
                <Paragraph>
                    Tooltips go inside Chart panels and use the same yAccessor pattern as series. Position them with the
                    origin prop. A snippet of the data being used in this chart can be found{" "}
                    <Link
                        href="/guides/getting-started#data-snippet"
                        className="underline text-blue-600 hover:text-blue-800"
                    >
                        here
                    </Link>
                    .
                </Paragraph>
            </GuideSection>

            <GuideSection title="Step 5 · Candlestick Series">
                <Paragraph>
                    <strong>CandlestickSeries</strong> is essential for financial data, showing open, high, low, and
                    close values. It automatically uses OHLC properties from your data and provides standard candlestick
                    styling.
                </Paragraph>
                <ChartContainer>
                    <Step5_CandlestickSeries />
                </ChartContainer>
                <CodeFromFile
                    title="Step5_CandlestickSeries.tsx"
                    language="tsx"
                    src="/src/app/guides/getting-started/snippets/Step5_CandlestickSeries.tsx"
                    collapsible={true}
                />
                <Paragraph>
                    Candlestick series expect data with high, low, open, close properties. YExtents should include both
                    high and low for proper scaling. A snippet of the data being used in this chart can be found{" "}
                    <Link
                        href="/guides/getting-started#data-snippet"
                        className="underline text-blue-600 hover:text-blue-800"
                    >
                        here
                    </Link>
                    .
                </Paragraph>
            </GuideSection>

            <GuideSection title="Step 6 · Multi-Panel Layout">
                <Paragraph>
                    <strong>Multiple Chart panels</strong> let you create complex layouts with different data views.
                    Common patterns include price + volume, or price + indicators. Each panel has independent Y-scaling.
                </Paragraph>
                <ChartContainer>
                    <Step6_MultiPanel />
                </ChartContainer>
                <CodeFromFile
                    title="Step6_MultiPanel.tsx"
                    language="tsx"
                    src="/src/app/guides/getting-started/snippets/Step6_MultiPanel.tsx"
                    collapsible={true}
                />
                <Paragraph>
                    Use height and origin props to position panels. A snippet of the data being used in this chart can
                    be found{" "}
                    <Link
                        href="/guides/getting-started#data-snippet"
                        className="underline text-blue-600 hover:text-blue-800"
                    >
                        here
                    </Link>
                    .
                </Paragraph>
            </GuideSection>

            <GuideSection title="Step 7 · Technical Indicators">
                <Paragraph>
                    <strong>Indicators</strong> calculate derived data from your raw OHLC data. EMAs, moving averages,
                    RSI, MACD and others are available. Indicators process data and merge results back into your
                    dataset.
                </Paragraph>
                <ChartContainer>
                    <Step7_MovingAverages />
                </ChartContainer>
                <CodeFromFile
                    title="Step7_MovingAverages.tsx"
                    language="tsx"
                    src="/src/app/guides/getting-started/snippets/Step7_MovingAverages.tsx"
                    collapsible={true}
                />
                <Paragraph>
                    Indicators are calculated before creating the chart, then rendered as LineSeries. Use specialized
                    tooltips to display indicator values. A snippet of the data being used in this chart can be found{" "}
                    <Link
                        href="/guides/getting-started#data-snippet"
                        className="underline text-blue-600 hover:text-blue-800"
                    >
                        here
                    </Link>
                    .
                </Paragraph>
            </GuideSection>

            <GuideSection title="Step 8 · Complete Chart">
                <Paragraph>
                    <strong>Final result</strong> with all features enabled: responsive sizing, grid lines, proper
                    margins, and production-ready styling. This represents a typical financial chart implementation.
                </Paragraph>
                <ChartContainer>
                    <Step8_CompleteChart />
                </ChartContainer>
                <CodeFromFile
                    title="Step8_CompleteChart.tsx"
                    language="tsx"
                    src="/src/app/guides/getting-started/snippets/Step8_CompleteChart.tsx"
                    collapsible={true}
                />
                <Paragraph>
                    Use withSize and withDeviceRatio HOCs for responsive charts. Add grid lines and proper margins for
                    professional appearance. A snippet of the data being used in this chart can be found{" "}
                    <Link
                        href="/guides/getting-started#data-snippet"
                        className="underline text-blue-600 hover:text-blue-800"
                    >
                        here
                    </Link>
                    .
                </Paragraph>
            </GuideSection>

            <GuideSection title="Data" id="data-snippet">
                <Paragraph>This is a snippet of the data that is used in the examples above.</Paragraph>
                <CodeFromText title="JSON Data" language="json" collapsible={true}>
                    {JSON.stringify(DAILY_JSON.splice(0, 15), null, 2)}
                </CodeFromText>
            </GuideSection>

            <GuideSection title="Architecture Summary">
                <SubSectionHeading>Component Hierarchy</SubSectionHeading>
                <CodeFromText title="Component Structure" language="" collapsible={false}>
                    {`<ChartCanvas>            // Top-level container, manages data & interactions
    <Chart id={1}>         // Individual chart panel with Y-scale
        <_Series/>           // Visual data representation
        <_Axis/>             // Axis labels and ticks
        <MouseCoordinate_/>  // X-coordinate display
        <_Tooltip/>          // Data tooltips
    </Chart>
    <_Cursor/>             // Custom cursor
</ChartCanvas>`}
                </CodeFromText>

                <SubSectionHeading>Key Concepts</SubSectionHeading>
                <Paragraph>
                    <strong>• ChartCanvas:</strong> Foundation layer handling data, scales, events, and canvas
                    management
                    <br />
                    <strong>• Chart:</strong> Individual panels with independent Y-scales for different data views
                    <br />
                    <strong>• Series:</strong> Visual representations of data (lines, candlesticks, bars, etc.)
                    <br />
                    <strong>• Axes:</strong> Reference scales and labels positioned around chart panels
                    <br />
                    <strong>• Coordinates:</strong> Interactive feedback showing cursor position and values
                    <br />
                    <strong>• Tooltips:</strong> Fixed-position data displays that update with mouse movement
                    <br />
                    <strong>• Indicators:</strong> Calculated data transformations (moving averages, RSI, etc.)
                </Paragraph>
            </GuideSection>

            <GuideSection title="Next Steps">
                <Paragraph>
                    You&apos;ve learned the core concepts. Next, explore interactive components or explore other chart
                    features.
                </Paragraph>
                <LinkGrid>
                    <GuideButtonLink href="/guides/interactive-components" alignStart>
                        Interactive Components →
                    </GuideButtonLink>
                    <GuideButtonLink href="/storybook" alignStart>
                        Browse Examples →
                    </GuideButtonLink>
                </LinkGrid>
            </GuideSection>
        </GuidePage>
    );
}
