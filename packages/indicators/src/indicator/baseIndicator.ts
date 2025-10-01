import { scaleOrdinal } from "d3-scale";

const defaultColors = [
    "rgba(31, 119, 180, 0.5)",
    "rgba(255, 127, 14, 0.5)",
    "rgba(44, 160, 44, 0.5)",
    "rgba(214, 39, 40, 0.5)",
    "rgba(148, 103, 189, 0.5)",
    "rgba(140, 86, 75, 0.5)",
    "rgba(227, 119, 194, 0.5)",
    "rgba(127, 127, 127, 0.5)",
    "rgba(188, 189, 34, 0.5)",
    "rgba(23, 190, 207, 0.5)",
];

let i = 0;
const overlayColors = scaleOrdinal<number, string>(defaultColors);

export interface BaseIndicator {
    (): () => void;
    id(): number;
    id(x: number): BaseIndicator;
    accessor(): any;
    accessor(x: any): BaseIndicator;
    stroke(): string | any;
    stroke(x: string | any): BaseIndicator;
    fill(): string | any;
    fill(x: string | any): BaseIndicator;
    echo(): any;
    echo(x: any): BaseIndicator;
    type(): string;
    type(x: string): BaseIndicator;
}

export default function () {
    let id = i++;
    let accessor: any;
    let stroke: string | any;
    let fill: string | any;
    let echo: any;
    let type: string;

    const baseIndicator = () => () => {
        /** Do Nothing */
    };

    baseIndicator.id = (newId?: number) => {
        if (newId === undefined) {
            return id;
        }

        id = newId;

        return baseIndicator;
    };

    baseIndicator.accessor = (newAccessor?: any) => {
        if (newAccessor === undefined) {
            return accessor;
        }

        accessor = newAccessor;

        return baseIndicator;
    };

    baseIndicator.stroke = (newStroke?: string | any) => {
        if (newStroke === undefined) {
            return !stroke ? (stroke = overlayColors(id)) : stroke;
        }

        stroke = newStroke;

        return baseIndicator;
    };

    baseIndicator.fill = (newFill?: string | any) => {
        if (newFill === undefined) {
            return !fill ? (fill = overlayColors(id)) : fill;
        }

        fill = newFill;

        return baseIndicator;
    };

    baseIndicator.echo = (newEcho?: any) => {
        if (newEcho === undefined) {
            return echo;
        }

        echo = newEcho;

        return baseIndicator;
    };

    baseIndicator.type = (newType?: string) => {
        if (newType === undefined) {
            return type;
        }

        type = newType;

        return baseIndicator;
    };

    return baseIndicator as BaseIndicator;
}
