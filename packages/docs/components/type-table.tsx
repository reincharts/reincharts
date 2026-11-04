import { AutoTypeTable as Base, type AutoTypeTableProps } from "fumadocs-typescript/ui";
import { generator } from "@/lib/type-table";

type Override = NonNullable<NonNullable<NonNullable<AutoTypeTableProps["options"]>["typeSimplifier"]>["override"]>;

/** Show short unions in full (`"left" | "right"`, `boolean`) instead of the generic "union" label. */
const override: Override = ({ checker, type, location }) => {
    const text = checker.typeToString(type, location);
    if (!text.includes(" | ")) {
        return undefined;
    }
    const members = text.split(" | ").filter((m) => m !== "undefined");
    const simple = members.join(" | ").replace(/\bfalse \| true\b|\btrue \| false\b/, "boolean");
    return simple.length <= 48 ? simple : undefined;
};

/**
 * Props table generated from TypeScript + JSDoc.
 * `path` is relative to packages/docs, e.g. `<AutoTypeTable path="../core/src/react.tsx" name="ChartCanvasProps" />`.
 */
export function AutoTypeTable(props: Omit<AutoTypeTableProps, "generator">) {
    return <Base {...props} generator={generator} options={{ typeSimplifier: { override }, ...props.options }} />;
}
