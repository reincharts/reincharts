import * as React from "react";
import { IOHLCData } from "./iOHLCData";

// Sample data for our financial chart
const generateSampleData = (count = 100): IOHLCData[] => {
    const startDate = new Date(2020, 0, 1);
    const data: IOHLCData[] = [];

    let price = 100;
    for (let i = 0; i < count; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        // Generate random price movement
        const change = (Math.random() - 0.5) * 2;
        const open = price;
        price = price + price * (change / 10);
        const close = price;
        const high = Math.max(open, close) * (1 + Math.random() * 0.1);
        const low = Math.min(open, close) * (1 - Math.random() * 0.1);

        // Generate random volume
        const volume = 1000000 + Math.round(Math.random() * 2000000);

        data.push({
            date,
            open,
            high,
            low,
            close,
            volume,
        });
    }

    return data;
};

// Higher-order component to provide OHLC data to a component
export function withGenOHLCData() {
    return function <TProps extends object>(
        OriginalComponent: React.ComponentType<TProps & { readonly data: IOHLCData[] }>,
    ) {
        return class WithOHLCData extends React.Component<Omit<TProps, "data">> {
            public render() {
                const { ...props } = this.props;
                return React.createElement(OriginalComponent, {
                    ...(props as TProps),
                    data: generateSampleData(),
                });
            }
        };
    };
}
