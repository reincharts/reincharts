import { compareResolutions, formatResolution, parseResolution } from "@reincharts/datafeed";
import { useWidget } from "../context";
import { Icon } from "../icons";
import { DEFAULT_FAVORITES } from "../state";
import { intervalShort } from "../utils";
import { Dropdown, MenuHeading } from "./Menu";

const GROUPS = [
    { id: "second", label: "Seconds" },
    { id: "minute", label: "Minutes" },
    { id: "hour", label: "Hours" },
    { id: "day", label: "Days" },
] as const;

const groupOf = (r: string) => {
    try {
        const { unit, count } = parseResolution(r);
        return unit === "minute" ? (count % 60 === 0 ? "hour" : "minute") : unit === "second" ? "second" : "day";
    } catch {
        return "day";
    }
};

const longLabel = (r: string) => {
    try {
        return formatResolution(r, "long");
    } catch {
        return r;
    }
};

/** Favorite intervals as toolbar buttons + a dropdown with every interval (star to add / remove favorites). */
export function IntervalPicker() {
    const { state, dispatch, resolutions } = useWidget();
    const favorites = (state.favorites ?? DEFAULT_FAVORITES)
        .filter((r) => resolutions.includes(r))
        .sort(compareResolutions);
    const current = state.resolution;
    const select = (resolution: string) => dispatch({ type: "resolution", resolution });
    return (
        <>
            {favorites.map((r) => (
                <button
                    key={r}
                    type="button"
                    className="rc-w-btn rc-w-text-btn rc-w-interval"
                    data-active={r === current ? "" : undefined}
                    aria-pressed={r === current}
                    aria-label={longLabel(r)}
                    title={longLabel(r)}
                    onClick={() => select(r)}
                >
                    {intervalShort(r)}
                </button>
            ))}
            <Dropdown
                title="Interval"
                label={
                    favorites.includes(current) ? null : (
                        <span className="rc-w-active-text">{intervalShort(current)}</span>
                    )
                }
                chevron
                className="rc-w-text-btn"
            >
                {(close) =>
                    GROUPS.map((g) => {
                        const list = resolutions.filter((r) => groupOf(r) === g.id);
                        if (!list.length) {
                            return null;
                        }
                        return (
                            <div key={g.id} role="group" aria-label={g.label}>
                                <MenuHeading>{g.label}</MenuHeading>
                                {list.map((r) => {
                                    const fav = favorites.includes(r);
                                    return (
                                        <div
                                            key={r}
                                            role="none"
                                            className="rc-w-menu-row"
                                            data-active={r === current ? "" : undefined}
                                        >
                                            <button
                                                type="button"
                                                role="menuitemradio"
                                                aria-checked={r === current}
                                                className="rc-w-menu-item"
                                                onClick={() => {
                                                    select(r);
                                                    close();
                                                }}
                                            >
                                                <span className="rc-w-menu-label">{longLabel(r)}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="rc-w-star"
                                                data-on={fav ? "" : undefined}
                                                title={fav ? "Remove from favorites" : "Add to favorites"}
                                                aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                                                onClick={() => dispatch({ type: "toggleFavorite", resolution: r })}
                                            >
                                                <Icon name={fav ? "starFilled" : "star"} size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                }
            </Dropdown>
        </>
    );
}
