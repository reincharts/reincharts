"use client";
import { useSyncExternalStore } from "react";

/** True when the media query matches (false during SSR). */
export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (notify) => {
            const mql = window.matchMedia(query);
            mql.addEventListener("change", notify);
            return () => mql.removeEventListener("change", notify);
        },
        () => window.matchMedia(query).matches,
        () => false,
    );
}
