import * as React from "react";
import { GenericChartComponent } from "@reincharts/core";

interface SVGComponentProps {
    /** Function that returns React elements to render as SVG, receiving chart props as parameter. */
    readonly children: (moreProps: any) => React.ReactNode;
}

export class SVGComponent extends React.Component<SVGComponentProps> {
    public render() {
        const { children } = this.props;
        return <GenericChartComponent drawOn={[]} svgDraw={children} />;
    }
}
