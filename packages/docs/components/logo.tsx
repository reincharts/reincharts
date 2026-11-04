/** Hexagon cells (like the cells of Reinhardt's barrier shield) arranged into an R. Same shapes as public/logo.svg. */
const CELLS = [
    "M5.08 1.95 7.54 3.38V6.23L5.08 7.65 2.61 6.23V3.38Z",
    "M10.62 1.95 13.08 3.38V6.23L10.62 7.65 8.15 6.23V3.38Z",
    "M16.16 1.95 18.62 3.38V6.23L16.16 7.65 13.69 6.23V3.38Z",
    "M7.85 6.75 10.31 8.18V11.03L7.85 12.45 5.38 11.03V8.18Z",
    "M18.93 6.75 21.39 8.18V11.03L18.93 12.45 16.46 11.03V8.18Z",
    "M5.08 11.55 7.54 12.97V15.83L5.08 17.25 2.61 15.83V12.97Z",
    "M10.62 11.55 13.08 12.97V15.83L10.62 17.25 8.15 15.83V12.97Z",
    "M16.16 11.55 18.62 12.97V15.83L16.16 17.25 13.69 15.83V12.97Z",
    "M7.85 16.35 10.31 17.77V20.63L7.85 22.05 5.38 20.63V17.77Z",
    "M18.93 16.35 21.39 17.77V20.63L18.93 22.05 16.46 20.63V17.77Z",
];

/** Reincharts wordmark: the hexagon R mark + name. */
export function Logo() {
    return (
        <span className="flex items-center gap-2 font-semibold tracking-tight">
            <svg viewBox="0 0 24 24" className="size-5 fill-fd-foreground" aria-hidden="true">
                {CELLS.map((d) => (
                    <path key={d} d={d} />
                ))}
            </svg>
            <span>Reincharts</span>
        </span>
    );
}
