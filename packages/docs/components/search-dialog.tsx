"use client";
import { useStaticSearch } from "fumadocs-core/search/client";
import {
    SearchDialog as Dialog,
    SearchDialogClose,
    SearchDialogContent,
    SearchDialogHeader,
    SearchDialogIcon,
    SearchDialogInput,
    SearchDialogList,
    SearchDialogOverlay,
    type SharedProps,
} from "fumadocs-ui/components/dialog/search";

/** Cmd+K search over the static index exported at build time by app/search.json/route.ts. */
export function SearchDialog(props: SharedProps) {
    const search = useStaticSearch({ from: "/search.json" });
    return (
        <Dialog {...search} {...props}>
            <SearchDialogOverlay />
            <SearchDialogContent>
                <SearchDialogHeader>
                    <SearchDialogIcon />
                    <SearchDialogInput />
                    <SearchDialogClose />
                </SearchDialogHeader>
                <SearchDialogList />
            </SearchDialogContent>
        </Dialog>
    );
}
