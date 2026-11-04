import * as React from "react";
import { Icon } from "../icons";

const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DialogProps {
    readonly title: React.ReactNode;
    readonly onClose: () => void;
    readonly children: React.ReactNode;
    /** Footer buttons. */
    readonly footer?: React.ReactNode;
    /** Dialog width in px. Default 480. */
    readonly width?: number;
    readonly className?: string;
}

/** Modal dialog: traps focus, closes on Escape and backdrop click, restores focus on close. */
export function Dialog({ title, onClose, children, footer, width = 480, className }: DialogProps) {
    const ref = React.useRef<HTMLDivElement>(null);
    const titleId = React.useId();
    const closeRef = React.useRef(onClose);
    closeRef.current = onClose;

    React.useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        const el = ref.current;
        // search field, then the first form field, then anything focusable (the close button)
        const first =
            el?.querySelector<HTMLElement>("[data-autofocus]") ??
            el?.querySelector<HTMLElement>(".rc-w-form input, .rc-w-form select, .rc-w-tab[data-active]") ??
            el?.querySelector<HTMLElement>(FOCUSABLE);
        first?.focus();
        // Escape closes from anywhere while the dialog is open (focus may have left it, e.g. when the focused
        // button was removed from the list)
        const onEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                closeRef.current();
            }
        };
        document.addEventListener("keydown", onEscape, true);
        return () => {
            document.removeEventListener("keydown", onEscape, true);
            previous?.focus?.();
        };
    }, []);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== "Tab" || !ref.current) {
            return;
        }
        const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!items.length) {
            return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    return (
        <div
            className="rc-w-backdrop"
            onPointerDown={(e) => {
                if (e.target === e.currentTarget) {
                    closeRef.current();
                }
            }}
        >
            <div
                ref={ref}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={className ? `rc-w-dialog ${className}` : "rc-w-dialog"}
                style={{ width }}
                onKeyDown={onKeyDown}
            >
                <div className="rc-w-dialog-header">
                    <h2 id={titleId}>{title}</h2>
                    <button type="button" className="rc-w-btn" title="Close" aria-label="Close" onClick={onClose}>
                        <Icon name="close" />
                    </button>
                </div>
                {children}
                {footer && <div className="rc-w-dialog-footer">{footer}</div>}
            </div>
        </div>
    );
}

export interface SearchInputProps {
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly placeholder: string;
    readonly onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/** Full-width search field with a magnifier icon (dialog header). */
export function SearchInput({ value, onChange, placeholder, onKeyDown }: SearchInputProps) {
    return (
        <label className="rc-w-search">
            <Icon name="search" />
            <input
                data-autofocus
                type="text"
                value={value}
                placeholder={placeholder}
                aria-label={placeholder}
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
            />
            {value && (
                <button
                    type="button"
                    className="rc-w-btn"
                    aria-label="Clear"
                    title="Clear"
                    onClick={() => onChange("")}
                >
                    <Icon name="close" size={16} />
                </button>
            )}
        </label>
    );
}
