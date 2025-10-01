import { tsvParse } from "d3-dsv";
import { timeParse } from "d3-time-format";
import * as React from "react";
import { IOHLCData } from "./iOHLCData";

import DAILY_DATA from "./DAILY.tsv?raw";
import MINUTES_DATA from "./MINUTES.tsv?raw";
import SECONDS_DATA from "./SECONDS.tsv?raw";
import comparison_DATA from "./comparison.tsv?raw";

const parseDate = timeParse("%Y-%m-%d");

const parseData = () => {
    return (d: any) => {
        const date = parseDate(d.date);
        if (date === null) {
            d.date = new Date(Number(d.date));
        } else {
            d.date = new Date(date);
        }

        for (const key in d) {
            if (key !== "date" && Object.prototype.hasOwnProperty.call(d, key)) {
                d[key] = +d[key];
            }
        }

        return d as IOHLCData;
    };
};

// Map dataset keys to raw TSV content
const rawDataMap: Record<"DAILY" | "MINUTES" | "SECONDS" | "comparison", string> = {
    DAILY: DAILY_DATA,
    MINUTES: MINUTES_DATA,
    SECONDS: SECONDS_DATA,
    comparison: comparison_DATA,
};
// Parsed DAILY dataset as JSON array for display
export const DAILY_JSON = tsvParse(rawDataMap["DAILY"], parseData());

interface WithOHLCDataProps {
    /** Array of OHLC (Open, High, Low, Close) data points. */
    readonly data: IOHLCData[];
}

export interface WithOHLCState {
    /** Optional array of OHLC data points after processing. */
    data?: IOHLCData[];
    /** Status message for data loading state. */
    message: string;
}

export function withOHLCData(dataSet: "DAILY" | "MINUTES" | "SECONDS" | "comparison" = "DAILY") {
    return <TProps extends WithOHLCDataProps>(OriginalComponent: React.ComponentClass<TProps>) => {
        return class WithOHLCData extends React.Component<Omit<TProps, "data">, WithOHLCState> {
            public constructor(props: Omit<TProps, "data">) {
                super(props);

                this.state = {
                    message: `Loading ${dataSet} data...`,
                };
            }

            public componentDidMount() {
                try {
                    const raw = rawDataMap[dataSet];
                    const data = tsvParse(raw, parseData());
                    this.setState({ data });
                } catch {
                    this.setState({
                        message: `Failed to load data.`,
                    });
                }
            }

            public render() {
                const { data, message } = this.state;
                if (data === undefined) {
                    return <div className="center">{message}</div>;
                }

                return <OriginalComponent {...(this.props as TProps)} data={data} />;
            }
        };
    };
}
