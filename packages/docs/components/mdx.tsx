import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ComponentPreview } from "./preview/component-preview";
import { AutoTypeTable } from "./type-table";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
    return {
        ...defaultMdxComponents,
        Callout,
        Card,
        Cards,
        Step,
        Steps,
        Tab,
        Tabs,
        ComponentPreview,
        AutoTypeTable,
        ...components,
    };
}

export const useMDXComponents = getMDXComponents;
