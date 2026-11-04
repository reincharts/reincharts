import type { SymbolInfo } from "@reincharts/datafeed";
import * as React from "react";
import { useWidget } from "../context";
import { Dialog, SearchInput } from "./Dialog";

export interface SymbolSearchDialogProps {
    /** "symbol" changes the symbol of `cell`, "compare" adds a compare symbol. */
    readonly mode: "symbol" | "compare";
    readonly cell?: number;
    readonly onClose: () => void;
}

/** Symbol search (datafeed.searchSymbols), also used to add compare symbols. */
export function SymbolSearchDialog({ mode, cell = 0, onClose }: SymbolSearchDialogProps) {
    const { datafeed, dispatch, state } = useWidget();
    const [query, setQuery] = React.useState("");
    // results of the last answered search, with the query they belong to (Enter may come before the answer)
    const [found, setFound] = React.useState<{ query: string; list: SymbolInfo[] } | null>(null);
    const results = found?.list ?? [];
    const [active, setActive] = React.useState(0);
    const alive = React.useRef(true);
    React.useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);

    React.useEffect(() => {
        const search = datafeed?.searchSymbols;
        if (!search) {
            setFound(null);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            search(query)
                .then((list) => {
                    if (!cancelled) {
                        setFound({ query, list: list.slice(0, 100) });
                        setActive(0);
                    }
                })
                .catch(() => !cancelled && setFound({ query, list: [] }));
        }, 120);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [datafeed, query]);

    const pick = (symbol: string | undefined) => {
        if (!symbol || !alive.current) {
            return;
        }
        dispatch(mode === "compare" ? { type: "addCompare", symbol } : { type: "symbol", symbol, cell });
        onClose();
    };

    /** Enter: the highlighted result, or (results not answered yet) the best match of the typed text. */
    const pickTyped = async () => {
        const typed = query.trim();
        const search = datafeed?.searchSymbols;
        if (!search) {
            pick(typed.toUpperCase());
        } else if (found?.query === query) {
            pick(results[active]?.symbol);
        } else {
            const list = await search(query).catch((): SymbolInfo[] => []);
            pick((list.find((s) => s.symbol.toLowerCase() === typed.toLowerCase()) ?? list[0])?.symbol);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(results.length - 1, a + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            void pickTyped();
        }
    };

    return (
        <Dialog title={mode === "compare" ? "Compare symbol" : "Symbol search"} onClose={onClose} width={560}>
            <SearchInput value={query} onChange={setQuery} placeholder="Search" onKeyDown={onKeyDown} />
            <div className="rc-w-list" role="listbox" aria-label="Symbols">
                {results.map((s, k) => {
                    const added =
                        mode === "compare" && (state.compare?.includes(s.symbol) || s.symbol === state.symbol);
                    return (
                        <button
                            key={s.symbol}
                            type="button"
                            role="option"
                            aria-selected={k === active}
                            className="rc-w-list-item rc-w-symbol-row"
                            data-active={k === active ? "" : undefined}
                            disabled={added}
                            onPointerEnter={() => setActive(k)}
                            onClick={() => pick(s.symbol)}
                        >
                            <span className="rc-w-symbol-code">{s.symbol}</span>
                            <span className="rc-w-symbol-desc">{s.description ?? s.name}</span>
                            <span className="rc-w-symbol-meta">{[s.type, s.exchange].filter(Boolean).join(" · ")}</span>
                        </button>
                    );
                })}
                {results.length === 0 && (found || !datafeed?.searchSymbols) && (
                    <div className="rc-w-empty">
                        {datafeed?.searchSymbols ? "No symbols match your criteria" : "Type a symbol and press Enter"}
                    </div>
                )}
            </div>
        </Dialog>
    );
}
