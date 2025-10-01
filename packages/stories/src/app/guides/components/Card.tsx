import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
    return <div className="p-4 border rounded-lg">{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="font-semibold mb-2">{children}</h3>;
}

export function CardText({ children }: { children: React.ReactNode }) {
    return <p className="text-sm text-muted-foreground">{children}</p>;
}

export default Card;
