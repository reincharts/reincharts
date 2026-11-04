import * as React from "react";
import { useWidget } from "./context";
import { Icon } from "./icons";
import type { ScaleMode } from "./state";
import { MenuDivider, MenuItem, onMenuKeyDown } from "./toolbar/Menu";
import { onOutside } from "./utils";

/** Right-click menu of the charts. */
export function ContextMenu() {
    const w = useWidget();
    const menu = w.contextMenu!;
    const ref = React.useRef<HTMLDivElement>(null);
    const [pos, setPos] = React.useState({ left: menu.x, top: menu.y });
    const { openContextMenu } = w;
    const close = React.useCallback(() => openContextMenu(null), [openContextMenu]);
    React.useEffect(() => onOutside(ref.current, close), [close]);
    React.useLayoutEffect(() => {
        const el = ref.current;
        const root = w.rootRef.current;
        if (!el || !root) {
            return;
        }
        el.style.maxHeight = `${Math.max(96, root.clientHeight - 8)}px`;
        const left = Math.max(4, Math.min(menu.x, root.clientWidth - el.offsetWidth - 4));
        const top = Math.max(4, Math.min(menu.y, root.clientHeight - el.offsetHeight - 4));
        setPos((p) => (p.left === left && p.top === top ? p : { left, top }));
    }, [menu.x, menu.y, w.rootRef]);

    const engine = w.engines.current[menu.cell];
    const run = (fn: () => void) => () => {
        fn();
        close();
    };
    const mode = w.state.scaleMode;
    const setMode = (m: ScaleMode) => w.dispatch({ type: "scaleMode", mode: mode === m ? "linear" : m });
    const auto = engine ? engine.getScale("price").isAuto : true;
    const check = (on: boolean) => (on ? <Icon name="check" className="rc-w-menu-check" /> : null);
    return (
        <div
            ref={ref}
            className="rc-w-menu rc-w-context-menu"
            role="menu"
            aria-label="Chart menu"
            style={pos}
            onKeyDown={onMenuKeyDown}
        >
            <MenuItem icon="reset" label="Reset chart view" onClick={run(() => engine?.resetView())} />
            {menu.priceText !== undefined && (
                <MenuItem
                    icon="copy"
                    label={`Copy price ${menu.priceText}`}
                    onClick={run(
                        () => void navigator.clipboard?.writeText(menu.priceText!.replace(/,/g, "")).catch(() => {}),
                    )}
                />
            )}
            <MenuDivider />
            <MenuItem
                icon="indicators"
                label="Add indicator…"
                onClick={run(() => w.openDialog({ kind: "indicators" }))}
            />
            <MenuItem
                icon="trash"
                label="Remove all indicators"
                disabled={w.state.indicators.length === 0}
                onClick={run(() => w.dispatch({ type: "removeAllIndicators" }))}
            />
            {w.drawings.available && (
                <MenuItem
                    icon="trash"
                    label="Remove all drawings"
                    disabled={w.drawings.list.length === 0}
                    onClick={run(w.drawings.clear)}
                />
            )}
            <MenuDivider />
            <MenuItem icon={null} label="Log scale" extra={check(mode === "log")} onClick={run(() => setMode("log"))} />
            <MenuItem
                icon={null}
                label="Percent scale"
                extra={check(mode === "percent")}
                onClick={run(() => setMode("percent"))}
            />
            <MenuItem
                icon={null}
                label="Indexed to 100"
                extra={check(mode === "indexed")}
                onClick={run(() => setMode("indexed"))}
            />
            <MenuItem
                icon={null}
                label="Auto scale"
                extra={check(auto)}
                onClick={run(() => {
                    for (const s of engine?.paneScales("price") ?? []) {
                        s.resetAuto();
                    }
                    engine?.invalidate("layout");
                })}
            />
            <MenuDivider />
            {w.features.objectTree && (
                <MenuItem icon="objectTree" label="Object tree" onClick={run(() => w.setObjectTreeOpen(true))} />
            )}
            <MenuItem icon="settings" label="Settings…" onClick={run(() => w.openDialog({ kind: "settings" }))} />
        </div>
    );
}
