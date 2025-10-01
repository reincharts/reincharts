import { isNotDefined, isDefined } from "reincharts";

interface InteractiveNode {
    type: string;
    chartId: number;
    node: any;
}

interface InteractiveNodes {
    [key: string]: InteractiveNode;
}

interface ComponentContext {
    state: any;
    setState: (state: any) => void;
    interactiveNodes?: InteractiveNodes;
    [key: string]: any;
}

export function saveInteractiveNode(this: ComponentContext, chartId: number) {
    return (node: any) => {
        this[`node_${chartId}`] = node;
    };
}

export function handleSelection(this: ComponentContext, type: string, chartId: number) {
    return (selectionArray: boolean[]) => {
        const key = `${type}_${chartId}`;
        const interactive = this.state[key].map((each: any, idx: number) => {
            return {
                ...each,
                selected: selectionArray[idx],
            };
        });
        this.setState({
            [key]: interactive,
        });
    };
}

export function saveInteractiveNodes(this: ComponentContext, type: string, chartId: number) {
    return (node: any) => {
        if (isNotDefined(this.interactiveNodes)) {
            this.interactiveNodes = {};
        }
        const key = `${type}_${chartId}`;
        if (isDefined(node) || isDefined(this.interactiveNodes![key])) {
            this.interactiveNodes = {
                ...this.interactiveNodes,
                [key]: { type, chartId, node },
            };
        }
    };
}

export function getInteractiveNodes(this: ComponentContext): InteractiveNodes {
    return this.interactiveNodes || {};
}
