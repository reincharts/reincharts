import React from "react";

type Props = {
    children: React.ReactNode;
};

export function ChartContainer({ children }: Props) {
    return <div className="my-6 border rounded-lg p-4 bg-gray-50">{children}</div>;
}
