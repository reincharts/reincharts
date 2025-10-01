import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import BasicLineSeries from "./BasicLineSeries";

const meta: Meta = {
    title: "Features/EdgeCases",
    component: BasicLineSeries,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoData: Story = {
    args: {
        data: [],
    },
    parameters: {
        controls: { include: [] },
    },
};

export const SingleDataPoint: Story = {
    args: {
        data: [{ close: 120, open: 120, high: 140, low: 100, date: new Date(), volume: 1_000_000 }],
    },
    parameters: {
        controls: { include: [] },
    },
};

export const TwoDataPoints: Story = {
    args: {
        data: [
            { close: 120, open: 120, high: 140, low: 100, date: new Date(2020, 7, 8, 10, 0, 0, 0), volume: 1_000_000 },
            { close: 140, open: 120, high: 140, low: 100, date: new Date(2020, 7, 8, 10, 1, 0, 0), volume: 1_000_000 },
        ],
    },
    parameters: {
        controls: { include: [] },
    },
};

export const ThreeDataPoints: Story = {
    args: {
        data: [
            { close: 120, open: 120, high: 140, low: 100, date: new Date(2020, 7, 8, 10, 0, 0, 0), volume: 1_000_000 },
            { close: 140, open: 120, high: 150, low: 100, date: new Date(2020, 7, 8, 10, 1, 0, 0), volume: 1_000_000 },
            { close: 120, open: 120, high: 140, low: 100, date: new Date(2020, 7, 8, 10, 2, 0, 0), volume: 1_000_000 },
        ],
    },
    parameters: {
        controls: { include: [] },
    },
};

const EmptyThenThreeAsyncComponent = () => {
    const [data, setData] = useState<any[]>([]);
    useEffect(() => {
        const timeout = setTimeout(() => {
            console.log("Set data");
            setData([
                {
                    close: 120,
                    open: 120,
                    high: 140,
                    low: 100,
                    date: new Date(2020, 7, 8, 10, 0, 0, 0),
                    volume: 1_000_000,
                },
                {
                    close: 140,
                    open: 120,
                    high: 150,
                    low: 100,
                    date: new Date(2020, 7, 8, 10, 1, 0, 0),
                    volume: 1_000_000,
                },
                {
                    close: 120,
                    open: 120,
                    high: 140,
                    low: 100,
                    date: new Date(2020, 7, 8, 10, 2, 0, 0),
                    volume: 1_000_000,
                },
            ]);
        }, 1000);
        return () => clearTimeout(timeout);
    }, []);
    return <BasicLineSeries data={data} />;
};

export const EmptyThenThreeAsync: Story = {
    render: () => <EmptyThenThreeAsyncComponent />,
    parameters: {
        controls: { include: [] },
    },
};
