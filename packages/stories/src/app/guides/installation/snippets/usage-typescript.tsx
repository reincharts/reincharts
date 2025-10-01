import type { LineSeriesProps } from "@reincharts/series";

type Data = { date: Date; value: number };
const accessor: LineSeriesProps["yAccessor"] = (d: Data) => d.value;
