import * as React from "react";
import type { DrawingController } from "./controller";
import { icons } from "./icons";
import { toolGroups } from "./tools";
import type { CursorMode, MagnetMode, ToolDefinition } from "./types";
import { useDrawingState } from "./useDrawings";

export interface DrawingToolbarProps {
    /** Controller from `useDrawings()`. */
    readonly controller: DrawingController;
    /** Tool types to show (default: every registered tool). */
    readonly tools?: readonly string[];
    /** Group order and labels. Default: lines, freehand, fib, shapes, annotation, measure (+ any custom group). */
    readonly groups?: readonly { readonly id: string; readonly label: string }[];
    /** Layout direction. Default "vertical" (a left-hand toolbar). */
    readonly orientation?: "vertical" | "horizontal";
    /** Tool types shown as direct buttons in a favorites section. */
    readonly favorites?: readonly string[];
    /** Enables star buttons in the flyouts to edit favorites. */
    readonly onFavoritesChange?: (favorites: readonly string[]) => void;
    /** Color scheme; by default inherits `data-theme="dark"` / `.dark` from an ancestor. */
    readonly theme?: "light" | "dark";
    /** Show the cursor / magnet / keep drawing / lock / hide / remove buttons. Default true. */
    readonly utilities?: boolean;
    /** Extra CSS class. */
    readonly className?: string;
    /** Inline style of the toolbar element. */
    readonly style?: React.CSSProperties;
}

const cursorModes: { mode: CursorMode; label: string; icon: React.ReactElement }[] = [
    { mode: "cross", label: "Cross", icon: icons.cross },
    { mode: "arrow", label: "Arrow", icon: icons.cursor },
    { mode: "eraser", label: "Eraser", icon: icons.eraser },
];

const magnetModes: { mode: MagnetMode; label: string }[] = [
    { mode: "weak", label: "Weak Magnet" },
    { mode: "strong", label: "Strong Magnet" },
];

/** Closes a flyout when clicking anywhere else. */
const useOutsideClose = (ref: React.RefObject<HTMLElement | null>, open: boolean, close: () => void) => {
    React.useEffect(() => {
        if (!open) {
            return;
        }
        const onDown = (e: PointerEvent) => {
            if (!ref.current?.contains(e.target as Node)) {
                close();
            }
        };
        document.addEventListener("pointerdown", onDown);
        return () => document.removeEventListener("pointerdown", onDown);
    }, [ref, open, close]);
};

/**
 * Menu next to a toolbar item. Positioned with `position: fixed` from the item's screen rect, so containers with
 * `overflow: hidden / auto` (e.g. a scrollable toolbar column) can't clip it.
 */
function Flyout({ children }: { children: React.ReactNode }) {
    const ref = React.useRef<HTMLDivElement>(null);
    const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);
    React.useLayoutEffect(() => {
        const el = ref.current;
        const item = el?.parentElement;
        if (!el || !item) {
            return;
        }
        const place = () => {
            const r = item.getBoundingClientRect();
            const horizontal = !!item.closest(".rc-dt-horizontal");
            let left = horizontal ? r.left : r.right + 8;
            let top = horizontal ? r.bottom + 8 : r.top;
            left = Math.max(8, Math.min(left, window.innerWidth - el.offsetWidth - 8));
            top = Math.max(8, Math.min(top, window.innerHeight - el.offsetHeight - 8));
            setPos((p) => (p && p.left === left && p.top === top ? p : { left, top }));
        };
        place();
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, []);
    return (
        <div
            ref={ref}
            className="rc-dt-flyout"
            role="menu"
            style={{
                position: "fixed",
                left: pos?.left ?? 0,
                top: pos?.top ?? 0,
                visibility: pos ? "visible" : "hidden",
            }}
        >
            {children}
        </div>
    );
}

interface ButtonProps {
    readonly icon: React.ReactElement;
    readonly label: string;
    readonly active?: boolean;
    readonly onClick: () => void;
    readonly onArrow?: () => void;
    readonly open?: boolean;
    readonly children?: React.ReactNode;
}

function ToolButton({ icon, label, active, onClick, onArrow, open, children }: ButtonProps) {
    return (
        <div className="rc-dt-item">
            <button
                type="button"
                className={`rc-dt-btn${active ? " rc-active" : ""}`}
                title={label}
                aria-label={label}
                aria-pressed={active}
                onClick={onClick}
            >
                {icon}
            </button>
            {onArrow && (
                <button
                    type="button"
                    className={`rc-dt-arrow${open ? " rc-open" : ""}`}
                    aria-label={`${label} options`}
                    onClick={onArrow}
                >
                    <svg viewBox="0 0 6 10" width="6" height="10" aria-hidden="true">
                        <path d="M1 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                </button>
            )}
            {open && children}
        </div>
    );
}

/** Drawing tools toolbar with group flyouts, magnet, keep drawing, lock / hide / remove all. */
export function DrawingToolbar({
    controller,
    tools: toolTypes,
    groups = toolGroups,
    orientation = "vertical",
    favorites,
    onFavoritesChange,
    theme,
    utilities = true,
    className,
    style,
}: DrawingToolbarProps) {
    const state = useDrawingState(controller);
    const [open, setOpen] = React.useState<string | null>(null);
    const [lastUsed, setLastUsed] = React.useState<Record<string, string>>({});
    const ref = React.useRef<HTMLDivElement>(null);
    const close = React.useCallback(() => setOpen(null), []);
    useOutsideClose(ref, open !== null, close);

    const tools = controller.tools.filter((t) => !toolTypes || toolTypes.includes(t.type));
    const groupIds = [
        ...groups.map((g) => g.id),
        ...tools.map((t) => t.group).filter((g) => !groups.some((x) => x.id === g)),
    ];
    const byGroup = [...new Set(groupIds)]
        .map((id) => ({
            id,
            label: groups.find((g) => g.id === id)?.label ?? id,
            tools: tools.filter((t) => t.group === id),
        }))
        .filter((g) => g.tools.length > 0);

    const activate = (t: ToolDefinition) => {
        controller.setTool(state.activeTool === t.type ? null : t.type);
        setLastUsed((m) => ({ ...m, [t.group]: t.type }));
        setOpen(null);
    };
    const toggleFavorite = (type: string) => {
        const list = favorites ?? [];
        onFavoritesChange?.(list.includes(type) ? list.filter((f) => f !== type) : [...list, type]);
    };
    const toggleFlyout = (id: string) => setOpen(open === id ? null : id);
    const cursor = cursorModes.find((c) => c.mode === state.cursor) ?? cursorModes[0];
    const magnetOn = state.magnet !== "off";

    return (
        <div
            ref={ref}
            className={`rc-dt rc-dt-${orientation}${className ? ` ${className}` : ""}`}
            data-theme={theme}
            style={style}
            role="toolbar"
            aria-orientation={orientation}
        >
            {utilities && (
                <ToolButton
                    icon={cursor.icon}
                    label={cursor.label}
                    active={!state.activeTool}
                    onClick={() => controller.setCursor(cursor.mode)}
                    onArrow={() => toggleFlyout("cursor")}
                    open={open === "cursor"}
                >
                    <Flyout>
                        {cursorModes.map((c) => (
                            <button
                                key={c.mode}
                                type="button"
                                role="menuitem"
                                className={`rc-dt-menuitem${c.mode === state.cursor ? " rc-active" : ""}`}
                                onClick={() => {
                                    controller.setCursor(c.mode);
                                    setOpen(null);
                                }}
                            >
                                {c.icon}
                                <span>{c.label}</span>
                            </button>
                        ))}
                    </Flyout>
                </ToolButton>
            )}
            {favorites && favorites.length > 0 && (
                <>
                    {utilities && <div className="rc-dt-sep" />}
                    {favorites
                        .map((type) => controller.getTool(type))
                        .filter((t): t is ToolDefinition => !!t)
                        .map((t) => (
                            <ToolButton
                                key={t.type}
                                icon={t.icon}
                                label={t.label}
                                active={state.activeTool === t.type}
                                onClick={() => activate(t)}
                            />
                        ))}
                </>
            )}
            <div className="rc-dt-sep" />
            {byGroup.map((g) => {
                const current =
                    g.tools.find((t) => t.type === state.activeTool) ??
                    g.tools.find((t) => t.type === lastUsed[g.id]) ??
                    g.tools[0];
                return (
                    <ToolButton
                        key={g.id}
                        icon={current.icon}
                        label={current.label}
                        active={state.activeTool === current.type}
                        onClick={() => activate(current)}
                        onArrow={g.tools.length > 1 ? () => toggleFlyout(g.id) : undefined}
                        open={open === g.id}
                    >
                        <Flyout>
                            <div className="rc-dt-flyout-title">{g.label}</div>
                            {g.tools.map((t) => (
                                <div key={t.type} className="rc-dt-menurow">
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className={`rc-dt-menuitem${state.activeTool === t.type ? " rc-active" : ""}`}
                                        onClick={() => activate(t)}
                                    >
                                        {t.icon}
                                        <span>{t.label}</span>
                                    </button>
                                    {onFavoritesChange && (
                                        <button
                                            type="button"
                                            className={`rc-dt-star${favorites?.includes(t.type) ? " rc-active" : ""}`}
                                            aria-label={`Favorite ${t.label}`}
                                            onClick={() => toggleFavorite(t.type)}
                                        >
                                            {icons.star}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </Flyout>
                    </ToolButton>
                );
            })}
            {utilities && (
                <>
                    <div className="rc-dt-sep" />
                    <ToolButton
                        icon={icons.magnet}
                        label={magnetOn ? (state.magnet === "strong" ? "Strong Magnet" : "Weak Magnet") : "Magnet Mode"}
                        active={magnetOn}
                        onClick={() => controller.setMagnet(magnetOn ? "off" : "weak")}
                        onArrow={() => toggleFlyout("magnet")}
                        open={open === "magnet"}
                    >
                        <Flyout>
                            {magnetModes.map((m) => (
                                <button
                                    key={m.mode}
                                    type="button"
                                    role="menuitem"
                                    className={`rc-dt-menuitem${m.mode === state.magnet ? " rc-active" : ""}`}
                                    onClick={() => {
                                        controller.setMagnet(m.mode);
                                        setOpen(null);
                                    }}
                                >
                                    {icons.magnet}
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </Flyout>
                    </ToolButton>
                    <ToolButton
                        icon={icons.keepDrawing}
                        label="Stay in Drawing Mode"
                        active={state.keepDrawing}
                        onClick={() => controller.setKeepDrawing(!state.keepDrawing)}
                    />
                    <ToolButton
                        icon={state.locked ? icons.lock : icons.unlock}
                        label={state.locked ? "Unlock All Drawings" : "Lock All Drawings"}
                        active={state.locked}
                        onClick={() => controller.lockAll()}
                    />
                    <ToolButton
                        icon={state.hidden ? icons.eyeOff : icons.eye}
                        label={state.hidden ? "Show All Drawings" : "Hide All Drawings"}
                        active={state.hidden}
                        onClick={() => controller.hideAll()}
                    />
                    <ToolButton icon={icons.trash} label="Remove All Drawings" onClick={() => controller.removeAll()} />
                </>
            )}
        </div>
    );
}
