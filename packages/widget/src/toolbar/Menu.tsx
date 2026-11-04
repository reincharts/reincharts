import * as React from "react";
import { Icon, type IconName } from "../icons";
import { onOutside } from "../utils";

export interface DropdownProps {
    /** Button content. */
    readonly label: React.ReactNode;
    /** Accessible name / tooltip of the button. */
    readonly title: string;
    /** Menu content; receives `close`. */
    readonly children: (close: () => void) => React.ReactNode;
    /** Show a chevron after the label. Default false. */
    readonly chevron?: boolean;
    /** Align the menu to the right edge of the button. */
    readonly alignRight?: boolean;
    /** Open the menu above the button (bottom bar). */
    readonly up?: boolean;
    readonly className?: string;
}

/**
 * Keeps a popup inside the widget: limits its height to the space left below (or above) it and shifts it
 * horizontally when it would overflow an edge (the widget clips its content).
 */
function fitInWidget(menu: HTMLElement, up = false) {
    const root = menu.closest<HTMLElement>(".rc-widget");
    if (!root) {
        return;
    }
    const r = root.getBoundingClientRect();
    menu.style.maxHeight = "";
    menu.style.transform = "";
    const m = menu.getBoundingClientRect();
    const space = up ? m.bottom - r.top : r.bottom - m.top;
    menu.style.maxHeight = `${Math.max(96, Math.floor(space - 8))}px`;
    const dx = Math.max(r.left + 4 - m.left, Math.min(0, r.right - 4 - m.right));
    if (dx) {
        menu.style.transform = `translateX(${Math.round(dx)}px)`;
    }
}

/** Arrow / Home / End keys move the focus between the items of a menu. */
export function onMenuKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") {
        return;
    }
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)')];
    if (!items.length) {
        return;
    }
    e.preventDefault();
    const i = items.indexOf(document.activeElement as HTMLElement);
    const last = items.length - 1;
    const next =
        e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : e.key === "ArrowDown"
                ? (i + 1) % items.length
                : i <= 0
                  ? last
                  : i - 1;
    items[next].focus();
}

/** Focuses the checked item of a menu, or its first item. */
const focusFirstItem = (menu: HTMLElement) =>
    (
        menu.querySelector<HTMLElement>('[aria-checked="true"], [data-active] > [role^="menuitem"]') ??
        menu.querySelector<HTMLElement>('[role^="menuitem"]:not(:disabled)')
    )?.focus();

/** A toolbar button with a popup menu (closes on outside click / Escape, which gives the focus back to the button). */
export function Dropdown({ label, title, children, chevron, alignRight, up, className }: DropdownProps) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLSpanElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const close = React.useCallback(() => setOpen(false), []);
    React.useEffect(
        () =>
            open
                ? onOutside(ref.current, (reason) => {
                      setOpen(false);
                      if (reason === "escape") {
                          buttonRef.current?.focus();
                      }
                  })
                : undefined,
        [open],
    );
    // opened with the keyboard: move the focus into the menu
    const keyboard = React.useRef(false);
    React.useLayoutEffect(() => {
        if (open && menuRef.current) {
            fitInWidget(menuRef.current, up);
            if (keyboard.current) {
                focusFirstItem(menuRef.current);
            }
        }
    }, [open, up]);
    return (
        <span ref={ref} className="rc-w-dropdown">
            <button
                ref={buttonRef}
                type="button"
                className={`rc-w-btn${className ? ` ${className}` : ""}`}
                title={title}
                aria-label={title}
                aria-haspopup="menu"
                aria-expanded={open}
                data-open={open ? "" : undefined}
                onClick={(e) => {
                    keyboard.current = e.detail === 0;
                    setOpen((o) => !o);
                }}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && !open) {
                        e.preventDefault();
                        keyboard.current = true;
                        setOpen(true);
                    }
                }}
            >
                {label}
                {chevron && <Icon name="chevronDown" size={14} className="rc-w-chevron" />}
            </button>
            {open && (
                <div
                    ref={menuRef}
                    className="rc-w-menu"
                    role="menu"
                    aria-label={title}
                    data-align={alignRight ? "right" : undefined}
                    data-up={up ? "" : undefined}
                    onKeyDown={onMenuKeyDown}
                >
                    {children(close)}
                </div>
            )}
        </span>
    );
}

export interface MenuItemProps {
    /** Leading icon; `null` keeps the icon space empty (aligns with rows that have icons). */
    readonly icon?: IconName | null;
    readonly label: React.ReactNode;
    readonly onClick: () => void;
    readonly active?: boolean;
    readonly disabled?: boolean;
    /** Right side content (shortcut, star...). */
    readonly extra?: React.ReactNode;
}

/** One row of a popup menu. */
export function MenuItem({ icon, label, onClick, active, disabled, extra }: MenuItemProps) {
    return (
        <div className="rc-w-menu-row" role="none" data-active={active ? "" : undefined}>
            <button type="button" role="menuitem" className="rc-w-menu-item" disabled={disabled} onClick={onClick}>
                {icon ? <Icon name={icon} /> : icon === null ? <span className="rc-w-menu-icon-space" /> : null}
                <span className="rc-w-menu-label">{label}</span>
            </button>
            {extra}
        </div>
    );
}

/** Menu section title. */
export const MenuHeading = ({ children }: { readonly children: React.ReactNode }) => (
    <div className="rc-w-menu-heading" aria-hidden="true">
        {children}
    </div>
);

/** Menu divider. */
export const MenuDivider = () => <div className="rc-w-menu-divider" role="separator" />;
