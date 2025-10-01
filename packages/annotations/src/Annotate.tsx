import * as React from "react";
import { GenericChartComponent } from "@reincharts/core";

export interface AnnotateProps {
    /** CSS class name for styling the annotation container. */
    readonly className?: string;
    /** React component type to use for rendering each annotation. */
    readonly with: React.ElementType;
    /** Predicate function to determine which data points should be annotated. */
    readonly when: (value: any, index: number, array: any[]) => boolean;
    /** Additional props to pass to each annotation component instance. */
    readonly usingProps?: any;
}

export class Annotate extends React.Component<AnnotateProps> {
    public static defaultProps = {
        className: "reincharts-enable-interaction reincharts-annotate reincharts-default-cursor",
    };

    public render() {
        return <GenericChartComponent svgDraw={this.renderSVG} drawOn={["pan"]} />;
    }

    private readonly renderSVG = (moreProps: any) => {
        const {
            xAccessor,
            xScale,
            chartConfig: { yScale },
            plotData,
        } = moreProps;

        const { className, usingProps, with: Annotation, when } = this.props;

        const data = (plotData as unknown[]).filter(when);

        return (
            <g className={className}>
                {data.map((d, idx) => {
                    return (
                        <Annotation
                            key={idx}
                            {...usingProps}
                            xScale={xScale}
                            yScale={yScale}
                            xAccessor={xAccessor}
                            plotData={plotData}
                            data={d}
                        />
                    );
                })}
            </g>
        );
    };
}
