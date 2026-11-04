import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Source of examples/<name>.tsx (build time). Throws a helpful error for unknown names. */
export function readExample(name: string, caller = "ComponentPreview") {
    const file = join(process.cwd(), "examples", `${name}.tsx`);
    if (!existsSync(file)) {
        throw new Error(`<${caller} name="${name}" />: examples/${name}.tsx does not exist.`);
    }
    return readFileSync(file, "utf8").trim();
}
