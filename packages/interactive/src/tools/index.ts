import type { ToolDefinition } from "../types";
import { annotationTools } from "./annotation";
import { fibTools } from "./fib";
import { lineTools } from "./lines";
import { measureTools } from "./measure";
import { freehandTools, shapeTools } from "./shapes";

export * from "./annotation";
export { defineTool, FIB_LEVELS, lineCross } from "./common";
export * from "./fib";
export * from "./lines";
export * from "./measure";
export * from "./shapes";

/** Every built-in tool, in toolbar order. */
export const builtinTools: readonly ToolDefinition[] = [
    ...lineTools,
    ...freehandTools,
    ...fibTools,
    ...shapeTools,
    ...annotationTools,
    ...measureTools,
];

/** Toolbar groups (toolbar order). */
export const toolGroups: readonly { readonly id: string; readonly label: string }[] = [
    { id: "lines", label: "Lines" },
    { id: "freehand", label: "Freehand" },
    { id: "fib", label: "Fibonacci & Gann" },
    { id: "shapes", label: "Shapes" },
    { id: "annotation", label: "Annotation" },
    { id: "measure", label: "Projection & Measure" },
];
