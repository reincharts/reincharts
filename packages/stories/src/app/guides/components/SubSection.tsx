import React from "react";

export function SubSectionHeading({ children }: { children: React.ReactNode }) {
    return <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-6">{children}</h3>;
}

export default SubSectionHeading;
