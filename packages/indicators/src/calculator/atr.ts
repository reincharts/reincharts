import { sum } from "d3-array";
import { slidingWindow, path } from "../utils";
import { ATR as defaultOptions } from "./defaultOptionsForComputation";

export interface ATROptions {
    readonly windowSize: number;
    readonly highPath?: string;
    readonly lowPath?: string;
    readonly closePath?: string;
    readonly openPath?: string;
}

export interface ATRSource {
    readonly close: number;
    readonly high: number;
    readonly low: number;
    readonly open: number;
}

export interface ATRCalculator {
    (data: any[]): any;
    undefinedLength(): number;
    options(): ATROptions;
    options(newOptions: ATROptions): ATRCalculator;
    source(): (d: any) => ATRSource;
    source(newSource: (d: any) => ATRSource): ATRCalculator;
}

export default function () {
    let options: ATROptions = defaultOptions;

    const calculator = (data: any[]) => {
        const { windowSize, highPath = "high", lowPath = "low", closePath = "close", openPath = "open" } = options;

        const highSource = path(highPath);
        const lowSource = path(lowPath);
        const closeSource = path(closePath);
        const openSource = path(openPath);

        const source = (d: any) => ({
            open: openSource(d),
            high: highSource(d),
            low: lowSource(d),
            close: closeSource(d),
        });

        const trueRangeAlgorithm = slidingWindow()
            .windowSize(2)
            .source(source)
            .undefinedValue((d: any) => {
                const sourceData = source(d);
                return sourceData.high - sourceData.low;
            }) // the first TR value is simply the High minus the Low
            .accumulator((values: any) => {
                const prev = values[0];
                const d = values[1];
                return Math.max(d.high - d.low, d.high - prev.close, d.low - prev.close);
            });

        let prevATR: number | undefined;

        const atrAlgorithm = slidingWindow()
            .skipInitial(1) // trueRange starts from index 1 so ATR starts from 1
            .windowSize(windowSize)
            .accumulator((values: any[]) => {
                const tr = values[values.length - 1];
                const atr =
                    prevATR !== undefined ? (prevATR * (windowSize - 1) + tr) / windowSize : sum(values) / windowSize;

                prevATR = atr;
                return atr;
            });

        const newData = atrAlgorithm(trueRangeAlgorithm(data));

        return newData;
    };

    calculator.undefinedLength = () => {
        const { windowSize } = options;

        return windowSize - 1;
    };

    calculator.options = (newOptions?: ATROptions) => {
        if (newOptions === undefined) {
            return options;
        }

        options = { ...defaultOptions, ...newOptions };

        return calculator;
    };

    calculator.source = (newSource?: (d: any) => ATRSource) => {
        if (newSource === undefined) {
            const { highPath = "high", lowPath = "low", closePath = "close", openPath = "open" } = options;
            const highSource = path(highPath);
            const lowSource = path(lowPath);
            const closeSource = path(closePath);
            const openSource = path(openPath);

            return (d: any) => ({
                open: openSource(d),
                high: highSource(d),
                low: lowSource(d),
                close: closeSource(d),
            });
        }
    };

    return calculator as ATRCalculator;
}
