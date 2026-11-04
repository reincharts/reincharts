import { useWidget } from "../context";
import { Icon, layoutIcon } from "../icons";
import { LAYOUTS } from "../state";
import { Dropdown } from "./Menu";

const LABELS: Record<string, string> = {
    single: "1 chart",
    "2h": "2 charts, side by side",
    "2v": "2 charts, stacked",
    "3": "3 charts",
    "4": "4 charts",
};

/** Multi-chart layout picker. */
export function LayoutMenu() {
    const { state, dispatch } = useWidget();
    const current = state.layout ?? "single";
    return (
        <Dropdown title="Layout" label={<Icon name={layoutIcon[current]} />} alignRight>
            {(close) => (
                <div className="rc-w-layout-grid" role="none">
                    {LAYOUTS.map((l) => (
                        <button
                            key={l}
                            type="button"
                            role="menuitemradio"
                            aria-checked={l === current}
                            className="rc-w-btn"
                            data-active={l === current ? "" : undefined}
                            title={LABELS[l]}
                            aria-label={LABELS[l]}
                            onClick={() => {
                                dispatch({ type: "layout", layout: l });
                                close();
                            }}
                        >
                            <Icon name={layoutIcon[l]} />
                        </button>
                    ))}
                </div>
            )}
        </Dropdown>
    );
}
