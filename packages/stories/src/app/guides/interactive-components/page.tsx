import { Metadata } from "next";
import GuidePage from "@/app/guides/components/GuidePage";
import GuideSection from "@/app/guides/components/GuideSection";
import { BulletList } from "@/app/guides/components/BulletList";
import { SubSectionHeading } from "@/app/guides/components/SubSection";
import { GuideButtonLink, LinkGrid } from "@/app/guides/components/GuideButtons";
import { Paragraph } from "@/app/guides/components/Paragraph";
import { CodeFromFile } from "@/app/guides/components/CodeComponent";
import { siteConfig } from "@/app/config/site";

export const metadata: Metadata = {
    title: "Interactive Components",
    description: "Learn to add interactive features to Reincharts.",
    alternates: {
        canonical: `${siteConfig.url}/guides/interactive-components/`,
    },
    openGraph: {
        title: "Reincharts Interactive Components",
        description: "Learn to add interactive features to Reincharts.",
        url: `${siteConfig.url}/guides/interactive-components/`,
        images: [
            {
                url: "/chart.png",
                width: 1200,
                height: 630,
                alt: "Interactive React chart components with drawing tools and zoom controls",
            },
        ],
    },
};

export default function InteractiveComponentsPage() {
    return (
        <GuidePage
            title="Interactive Components"
            description={<>Add drawing tools, zoom controls, and selections using the interactive package.</>}
        >
            <GuideSection title="Overview">
                <Paragraph>
                    Interactive features live in <code>@reincharts/interactive</code>. They fall into two categories: UI
                    controls and drawing tools.
                </Paragraph>

                <SubSectionHeading>UI Controls</SubSectionHeading>
                <Paragraph>These don&apos;t require state management:</Paragraph>
                <BulletList>
                    <li>
                        <strong>ZoomButtons:</strong> UI overlay with reset/zoom controls.
                    </li>
                    <li>
                        <strong>Brush:</strong> Selection rectangle for zooming or custom logic. Uses callback
                        functions.
                    </li>
                </BulletList>

                <SubSectionHeading>Drawing Tools</SubSectionHeading>
                <Paragraph>
                    These require state management and callbacks that can be set manually or handled automatically with
                    InteractiveManager:
                </Paragraph>
                <BulletList>
                    <li>
                        <strong>TrendLine:</strong> Draw trend lines, rays, or extended lines.
                    </li>
                    <li>
                        <strong>FibonacciRetracement:</strong> Draw Fibonacci retracement levels between two points.
                    </li>
                    <li>
                        <strong>GannFan:</strong> Draw Gann fan analysis lines.
                    </li>
                    <li>
                        <strong>EquidistantChannel:</strong> Draw parallel channel lines at equal distances.
                    </li>
                    <li>
                        <strong>StandardDeviationChannel:</strong> Draw channel lines based on standard deviation
                        calculations.
                    </li>
                    <li>
                        <strong>InteractiveText:</strong> Add movable text annotations.
                    </li>
                    <li>
                        <strong>InteractiveYCoordinate:</strong> Add horizontal reference lines at specific Y values.
                    </li>
                    <li>
                        <strong>Drawing:</strong> Generic drawing tool for simple shapes.
                    </li>
                </BulletList>

                <Paragraph>
                    <strong>Note:</strong> The examples below show simplified code snippets. For complete examples
                    explore the interactive stories in Storybook under &quot;Tools&quot; sections.
                </Paragraph>
            </GuideSection>

            <GuideSection title="UI Controls">
                <SubSectionHeading>UI Controls (ZoomButtons & Brush)</SubSectionHeading>
                <Paragraph>
                    These components work independently and don&apos;t require direct state management:
                </Paragraph>
                <CodeFromFile
                    title="UI Controls"
                    language="tsx"
                    src="/src/app/guides/interactive-components/snippets/UIControls.tsx"
                    collapsible={true}
                />
                <Paragraph>
                    When using the Brush component, the enabled prop controls whether brush is currently active for
                    selecting an area. After a brush happens the enabled prop should probably be set to false. When
                    using Zoom Buttons you need to set a callback for onReset. Resetting the chart can be accomplished
                    by changing the seriesName prop passed to ChartCanvas. See the &quot;Zoom Buttons&quot; and
                    &quot;Brush&quot; stories for complete examples.
                </Paragraph>
            </GuideSection>

            <GuideSection title="Drawing Tools">
                <Paragraph>
                    Drawing tools for the most part have these common props for controlling their behavior:
                </Paragraph>
                <BulletList>
                    <li>
                        <strong>enabled:</strong> <code>boolean</code> - Controls whether the tool is active for
                        drawing/interaction. After an interactive object is placed this should most likely be set to
                        false until you want to place another object.
                    </li>
                    <li>
                        <strong>onStart:</strong> <code>(e: MouseEvent, moreProps: any) =&gt; void</code> - Callback
                        when drawing begins.
                    </li>
                    <li>
                        <strong>onComplete:</strong>{" "}
                        <code>(e: MouseEvent, newItems: any[], moreProps: any) =&gt; void</code> - Callback when
                        interaction completes with updated items array. This is the most important callback because{" "}
                        <code>newItems</code> must be used to update the current state array that is passed to the
                        component in order to persist updates. More info on this in the Data Props section below.
                    </li>
                    <li>
                        <strong>appearance:</strong> <code>object</code> - Styling configuration (strokeStyle,
                        strokeWidth, colors, etc.). Exact values differ between components.
                    </li>
                    <li>
                        <strong>hoverText:</strong> <code>object</code> - Configuration for hover tooltips.
                    </li>
                </BulletList>
                <SubSectionHeading>Data Props</SubSectionHeading>
                <Paragraph>Each component accepts an array prop containing the items to render:</Paragraph>
                <BulletList>
                    <li>
                        <strong>TrendLine:</strong> <code>trends</code> array
                    </li>
                    <li>
                        <strong>FibonacciRetracement:</strong> <code>retracements</code> array
                    </li>
                    <li>
                        <strong>GannFan:</strong> <code>fans</code> array
                    </li>
                    <li>
                        <strong>EquidistantChannel:</strong> <code>channels</code> array
                    </li>
                    <li>
                        <strong>StandardDeviationChannel:</strong> <code>channels</code> array
                    </li>
                    <li>
                        <strong>InteractiveText:</strong> <code>textList</code> array
                    </li>
                    <li>
                        <strong>InteractiveYCoordinate:</strong> <code>yCoordinateList</code> array
                    </li>
                    <li>
                        <strong>Drawing:</strong> <code>drawings</code> array
                    </li>
                </BulletList>
                <Paragraph>
                    These arrays should be stored in state and updated using the <code>onComplete</code> callback. If
                    they are not updated the drawn objects will not change.
                </Paragraph>
            </GuideSection>

            <GuideSection title="Drawing Tools - Manual Usage">
                <Paragraph>To use drawing tools manually, you have to manage their state and callbacks</Paragraph>
                <CodeFromFile
                    title="Drawing Tools"
                    language="tsx"
                    src="/src/app/guides/interactive-components/snippets/DrawingTools.tsx"
                    collapsible={true}
                />
                <Paragraph>
                    For complete examples, see individual tool stories like &quot;Trend Line&quot;, &quot;Fibonacci
                    Retracement&quot;, &quot;Equidistant Channel&quot;, etc.
                </Paragraph>

                <SubSectionHeading>Key concepts for manual usage</SubSectionHeading>
                <BulletList>
                    <li>
                        <strong>Enable Control:</strong> Use a boolean prop to control if the tool is active and able
                        create new objects.
                    </li>
                    <li>
                        <strong>State Management:</strong> Store interactive objects in component state and pass them to
                        the data array prop then update them using <code>onComplete</code>.
                    </li>
                    <li>
                        <strong>Ref:</strong> Ref must be set in order for <code>InteractiveObjectSelector</code> to
                        work correctly. More on this in the <code>InteractiveObjectSelector</code> section below.
                    </li>
                </BulletList>

                <SubSectionHeading>InteractiveObjectSelector</SubSectionHeading>
                <Paragraph>
                    To enable selection and modification of drawn objects, you must include{" "}
                    <code>InteractiveObjectSelector</code>. This is also required for the <code>onKeyPress</code>{" "}
                    function in the example above to delete the currently selected object.
                </Paragraph>
                <BulletList>
                    <li>
                        <strong>Multi-tool and chart support:</strong> Handles selection across different drawing tools
                        in different charts when configured accordingly with getInteractiveNodes/onSelect.
                    </li>
                    <li>
                        <strong>Reference tracking system:</strong> The selector uses <code>getInteractiveNodes()</code>{" "}
                        to access stored tool refs, then calls each tool&apos;s <code>getSelectionState()</code> method
                        to determine what objects are currently selected or interactive.
                    </li>
                    <li>
                        <strong>getInteractiveNodes:</strong> Requires a function that returns references to interactive
                        components. This function provides access to all interactive tool instances so the selector can
                        query their selection state. View an example of how this works in any of the tool stories with{" "}
                        <code>saveInteractiveNodes</code> and <code>getInteractiveNodes</code>.
                    </li>
                </BulletList>
            </GuideSection>

            <GuideSection title="InteractiveManager - Automatic State and Callback Handling">
                <Paragraph>
                    The <code>InteractiveManager</code> automatically controls the state and callbacks of drawing tools
                    (not UI controls like ZoomButtons/Brush) and provides a built-in toolbar:
                </Paragraph>
                <CodeFromFile
                    title="Interactive Manager"
                    language="tsx"
                    src="/src/app/guides/interactive-components/snippets/Manager.tsx"
                    collapsible={true}
                />

                <SubSectionHeading>InteractiveManager features</SubSectionHeading>
                <BulletList>
                    <li>
                        <strong>Drawing tools only:</strong> Manages TrendLine, FibonacciRetracement, etc. Not
                        ZoomButtons/Brush that work independently.
                    </li>
                    <li>
                        <strong>Auto-detection:</strong> Automatically finds drawing components in children and creates
                        toolbar buttons.
                    </li>
                    <li>
                        <strong>Granular:</strong> Can add a specific set tools to each charts and the manager will only
                        let those tools be drawn on that chart.
                    </li>
                    <li>
                        <strong>Single-tool activation:</strong> Ensures only one drawing tool is active at a time.
                    </li>
                    <li>
                        <strong>Built-in toolbar:</strong> Provides sidebar with toggle buttons for each detected tool.
                    </li>
                    <li>
                        <strong>Keyboard shortcuts:</strong> Delete/Backspace removes selected items, Escape deactivates
                        tools.
                    </li>
                    <li>
                        <strong>Layout management:</strong> Automatically adjusts chart dimensions to account for
                        sidebar space.
                    </li>
                    <li>
                        <strong>State persistence:</strong> Supports <code>initialStates</code> prop and{" "}
                        <code>onSave</code> callback for data persistence.
                    </li>
                    <li>
                        If you don&apos;t like the appearance or behavior you can use the source as a base and create a
                        new component with your own custom styling/handling.
                    </li>
                </BulletList>

                <SubSectionHeading>InteractiveManager props</SubSectionHeading>
                <BulletList>
                    <li>
                        <strong>sidebarPosition:</strong>{" "}
                        <code>&quot;left&quot; | &quot;right&quot; | &quot;top&quot; | &quot;bottom&quot;</code> -
                        Position of the toolbar.
                    </li>
                    <li>
                        <strong>showSidebar:</strong> <code>boolean</code> - Whether to display the toolbar.
                    </li>
                    <li>
                        <strong>height:</strong> <code>number</code> - Height of the chart.
                    </li>
                    <li>
                        <strong>width:</strong> <code>number</code> - Width of the chart.
                    </li>
                    <li>
                        <strong>size:</strong> <code>number</code> - Width/height of the sidebar (default: 54px).
                    </li>
                    <li>
                        <strong>onInteractiveToggle:</strong> <code>(type: string, enabled: boolean) =&gt; void</code> -
                        Callback when tools are toggled.
                    </li>
                    <li>
                        <strong>onSave:</strong> <code>(data: string) =&gt; void</code> - Callback for save button with
                        serialized state.
                    </li>
                    <li>
                        <strong>initialStates:</strong> <code>Record&lt;string, Array&lt;any&gt;&gt;</code> - Initial
                        state for tools.
                    </li>
                    <li>
                        <strong>interactiveIcons:</strong> <code>Record&lt;string, React.ElementType&gt;</code> - Custom
                        icons for toolbar buttons.
                    </li>
                </BulletList>
                <Paragraph>
                    See the &quot;Interactive Manager&quot; story for a complete working example with multiple tools.
                </Paragraph>
            </GuideSection>

            <GuideSection title="Next Steps">
                <Paragraph>
                    Explore the interactive stories in storybook under &quot;Tools&quot; for complete, running examples
                    of all tools:
                </Paragraph>
                <LinkGrid>
                    <GuideButtonLink href="/storybook">Browse Interactive Stories →</GuideButtonLink>
                </LinkGrid>
            </GuideSection>
        </GuidePage>
    );
}
