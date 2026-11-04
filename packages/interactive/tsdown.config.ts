import { createTsdownConfig } from "../../tsdown.shared.ts";

export default createTsdownConfig({ copy: [{ from: "src/styles.css", to: "dist" }]});
