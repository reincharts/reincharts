import * as React from "react";
import { head, isDefined, mapObject, GenericComponent, getMouseCanvas } from "@reincharts/core";
import { getMorePropsForChart, getSelected } from "./utils";

interface InteractiveObjectSelectorProps {
    /** Function that returns the interactive nodes object. */
    readonly getInteractiveNodes: () => object;
    /** Callback function when an interactive object is selected. */
    readonly onSelect?: (e: React.MouseEvent, interactives: any[], moreProps: any) => void;
    /** Callback function when an interactive object is double-clicked. */
    readonly onDoubleClick?: (e: React.MouseEvent, item: any, moreProps: any) => void;
    /** Mapping configuration for interactive objects. */
    readonly interactiveObjectMap?: any;
    /** Whether the selector is enabled. */
    readonly enabled: boolean;
}

export class InteractiveObjectSelector extends React.Component<InteractiveObjectSelectorProps> {
    public static displayName = "InteractiveObjectSelector";

    public static defaultProps = {
        enabled: true,
        interactiveObjectMap: {
            Drawing: "drawings",
            GannFan: "fans",
            EquidistantChannel: "channels",
            FibonacciRetracement: "retracements",
            StandardDeviationChannel: "channels",
            InteractiveText: "textList",
            TrendLine: "trends",
            InteractiveYCoordinate: "yCoordinateList",
        },
    };

    public constructor(props: InteractiveObjectSelectorProps) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.getInteraction = this.getInteraction.bind(this);
    }

    public render() {
        return (
            <GenericComponent
                canvasToDraw={getMouseCanvas}
                onMouseDown={this.handleClick}
                onDoubleClick={this.handleDoubleClick}
                drawOn={["mousemove", "pan", "drag"]}
            />
        );
    }

    private readonly getInteraction = (moreProps: any) => {
        const { getInteractiveNodes, interactiveObjectMap } = this.props;
        const interactiveNodes = getInteractiveNodes();
        const interactives = mapObject(interactiveNodes, (each: any) => {
            const key = interactiveObjectMap[each.type];

            const valueArray = isDefined(key) ? each.node.props[key] : undefined;

            const valuePresent = isDefined(valueArray) && Array.isArray(valueArray) && valueArray.length > 0;
            if (valuePresent) {
                const morePropsForChart = getMorePropsForChart(moreProps, each.chartId);

                const objects = each.node.getSelectionState(morePropsForChart);

                return {
                    type: each.type,
                    chartId: each.chartId,
                    objects,
                };
            }
            return {
                type: each.type,
                chartId: each.chartId,
                objects: [],
            };
        });

        return interactives;
    };

    private readonly handleClick = (e: React.MouseEvent, moreProps: any) => {
        e.preventDefault();
        const { onSelect } = this.props;
        const { enabled } = this.props;
        if (!enabled) {
            return;
        }

        const interactives = this.getInteraction(moreProps);
        if (onSelect !== undefined) {
            onSelect(e, interactives, moreProps);
        }
    };

    private readonly handleDoubleClick = (e: React.MouseEvent, moreProps: any) => {
        e.preventDefault();
        const { onDoubleClick } = this.props;
        const { enabled } = this.props;
        if (!enabled) {
            return;
        }

        const interactives = this.getInteraction(moreProps);
        const allSelected = getSelected(interactives);

        if (allSelected.length > 0) {
            const selected = head(allSelected);
            const item = {
                type: selected.type,
                chartId: selected.chartId,
                object: head(selected.objects),
            };
            const morePropsForChart = getMorePropsForChart(moreProps, selected.chartId);
            if (onDoubleClick !== undefined) {
                onDoubleClick(e, item, morePropsForChart);
            }
        }
    };
}
