import { isDefined, isNotDefined, mapObject } from "@reincharts/core";

export function getValueFromOverride(override: any, index: any, key: any, defaultValue: any) {
    if (isDefined(override) && override.index === index) {
        return override[key];
    }
    return defaultValue;
}

export function terminate() {
    // @ts-ignore
    this.setState({
        current: null,
        override: null,
    });
}

export function generateID() {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Returns a ref callback function for managing interactive node references by type.
 *
 * When used as a React ref callback, this function will:
 * - Save the given node under `this.nodes[type]` if the node is defined.
 * - Remove the node reference for `type` if the node is not defined.
 * - Initialize `this.nodes` if it does not exist.
 *
 *
 * @param type - The key under which to store the node reference.
 * @returns A function to be used as a React ref callback.
 */
export function saveNodeType(type: any) {
    return (node: any) => {
        // @ts-ignore
        if (isDefined(this.nodes)) {
            // @ts-ignore
            if (isNotDefined(node) && isDefined(this.nodes[type])) {
                // @ts-ignore
                delete this.nodes[type];
            } else {
                // @ts-ignore
                this.nodes[type] = node;
            }
        } else {
            // @ts-ignore
            this.nodes = [];
        }
    };
}
export function isHoverForInteractiveType(interactiveType: any) {
    return function (moreProps: any) {
        // this has to be function as it is bound to this

        // @ts-ignore
        if (isDefined(this.nodes)) {
            // @ts-ignore
            const selecedNodes = this.nodes.map((node) => node.isHover(moreProps));
            // @ts-ignore
            const interactive = this.props[interactiveType].map((t, idx) => {
                return {
                    ...t,
                    selected: selecedNodes[idx],
                };
            });
            return interactive;
        }
    };
}

export function isHover(moreProps: any) {
    // @ts-ignore
    const hovering = mapObject(this.nodes, (node) => node.isHover(moreProps)).reduce((a, b) => {
        return a || b;
    });
    return hovering;
}

function getMouseXY(moreProps: any, [ox, oy]: any) {
    if (Array.isArray(moreProps.mouseXY)) {
        const {
            mouseXY: [x, y],
        } = moreProps;
        const mouseXY = [x - ox, y - oy];
        return mouseXY;
    }
    return moreProps.mouseXY;
}

/**
 * Extracts and transforms chart-specific properties from the global moreProps object
 *
 * @param moreProps - The global properties object containing all chart configurations
 * @param chartId - The ID of the specific chart to get properties for
 *
 * @returns A new object that contains:
 *   1. All original properties from moreProps
 *   2. The chartConfig for the requested chart
 *   3. Adjusted mouseXY coordinates relative to the chart's origin
 *
 * This function is essential for multi-chart layouts where each chart needs
 * mouse coordinates relative to its own position rather than the overall canvas.
 */
export function getMorePropsForChart(moreProps: any, chartId: any) {
    const { chartConfigs: chartConfigList } = moreProps;
    const chartConfig = chartConfigList.find((config: any) => config.id === chartId);

    const { origin } = chartConfig;
    const mouseXY = getMouseXY(moreProps, origin);
    return {
        ...moreProps,
        chartConfig,
        mouseXY,
    };
}

export function getSelected(interactives: any) {
    const selected = interactives
        .map((each: any) => {
            const objects = each.objects.filter((obj: any) => {
                return obj.selected;
            });
            return {
                ...each,
                objects,
            };
        })
        .filter((each: any) => each.objects.length > 0);
    return selected;
}
