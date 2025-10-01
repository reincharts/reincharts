import StockChart, { MinutesStockChart, SecondsStockChart } from "./StockChart";
import type { Meta } from "@storybook/react-vite";

const meta: Meta<typeof StockChart> = {
    component: StockChart,
    title: "Features/Full Screen",
};

export default meta;

export const Daily = () => <StockChart />;

export const Minutes = () => <MinutesStockChart dateTimeFormat="%H:%M" />;

export const Seconds = () => <SecondsStockChart dateTimeFormat="%H:%M:%S" />;
