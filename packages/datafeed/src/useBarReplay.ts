import * as React from "react";

/** Options of `useBarReplay`. */
export interface UseBarReplayOptions {
    /** Index of the last bar shown when replay starts. Negative counts from the end. Default: middle of the data. */
    readonly startIndex?: number;
    /** Playback speed in bars per second. Default 1. */
    readonly speed?: number;
    /** Start playing immediately. Default false. */
    readonly autoPlay?: boolean;
}

/** State and controls returned by `useBarReplay`. */
export interface UseBarReplayResult<T> {
    /** `data` up to and including the replay cursor — pass it to `<ChartCanvas data>`. */
    readonly data: readonly T[];
    /** Index of the last visible bar in the full data. */
    readonly index: number;
    /** True while playing. */
    readonly playing: boolean;
    /** True when the cursor is on the last bar. */
    readonly atEnd: boolean;
    /** Current speed (bars per second). */
    readonly speed: number;
    /** Starts playback (restarts from the start index when at the end). */
    readonly play: () => void;
    /** Pauses playback. */
    readonly pause: () => void;
    /** Toggles play / pause. */
    readonly toggle: () => void;
    /** Reveals the next `count` bars (default 1). */
    readonly step: (count?: number) => void;
    /** Hides the last `count` bars (default 1). */
    readonly stepBack: (count?: number) => void;
    /** Changes the speed (bars per second). */
    readonly setSpeed: (speed: number) => void;
    /** Moves the cursor (pauses). Negative counts from the end. */
    readonly setStart: (index: number) => void;
    /** Pauses and goes back to the start index. */
    readonly reset: () => void;
}

const resolveIndex = (index: number | undefined, length: number) => {
    const raw = index === undefined ? Math.floor((length - 1) / 2) : index < 0 ? length + index : index;
    return Math.max(0, Math.min(length - 1, raw));
};

/**
 * Bar replay: hides future bars and reveals them one by one,
 * at `speed` bars per second, with step / step back / seek. Keeps its cursor when older history is prepended.
 */
interface Cursor<T> {
    /** Data the indexes refer to. */
    data: readonly T[];
    index: number;
    start: number;
}

/** Number of bars prepended to `old` to obtain `data` (0 for appends / unrelated data). */
const prependedCount = <T>(old: readonly T[], data: readonly T[]) => {
    if (old === data || old.length === 0 || data.length <= old.length || data[0] === old[0]) {
        return 0;
    }
    return Math.max(0, data.indexOf(old[0]));
};

const rebase = <T>(c: Cursor<T>, data: readonly T[], startIndex: number | undefined): Cursor<T> => {
    if (c.data.length === 0 && data.length > 0) {
        // data arrived after mount (async datafeed): resolve the start index now
        const index = resolveIndex(startIndex, data.length);
        return { data, index, start: index };
    }
    const shift = prependedCount(c.data, data);
    return c.data === data ? c : { data, index: c.index + shift, start: c.start + shift };
};

/** Bar replay: hides bars after a start index and reveals them one by one (play, pause, step, step back, speed). Returns the visible slice as `data` plus the controls. */
export function useBarReplay<T>(data: readonly T[], options: UseBarReplayOptions = {}): UseBarReplayResult<T> {
    const { startIndex, autoPlay = false } = options;
    const n = data.length;
    const [state, setState] = React.useState<Cursor<T>>(() => {
        const index = resolveIndex(startIndex, n);
        return { data, index, start: index };
    });
    const [playing, setPlaying] = React.useState(autoPlay);
    const [speed, setSpeed] = React.useState(options.speed ?? 1);
    const latest = React.useRef({ data, startIndex });
    latest.current = { data, startIndex };

    React.useEffect(() => {
        if (options.speed !== undefined) {
            setSpeed(options.speed);
        }
    }, [options.speed]);

    // keep the same bar under the cursor when history is prepended (pagination)
    const cursorState = rebase(state, data, startIndex);
    React.useEffect(() => {
        if (cursorState !== state) {
            setState(cursorState);
        }
    }, [cursorState, state]);

    const cursor = n === 0 ? -1 : Math.min(cursorState.index, n - 1);
    const atEnd = cursor >= n - 1;

    /** Applies `fn` to the cursor rebased on the latest data. */
    const move = React.useCallback((fn: (c: Cursor<T>, max: number) => Partial<Cursor<T>>) => {
        setState((prev) => {
            const c = rebase(prev, latest.current.data, latest.current.startIndex);
            const max = latest.current.data.length - 1;
            const next = { ...c, ...fn({ ...c, index: Math.min(c.index, max) }, max) };
            return next.index === prev.index && next.start === prev.start && next.data === prev.data ? prev : next;
        });
    }, []);

    React.useEffect(() => {
        if (!playing) {
            return;
        }
        if (atEnd) {
            setPlaying(false);
            return;
        }
        const timer = setInterval(
            () => move((c, max) => ({ index: Math.min(max, c.index + 1) })),
            1000 / Math.max(speed, 1e-3),
        );
        return () => clearInterval(timer);
    }, [playing, atEnd, speed, move]);

    const play = React.useCallback(() => {
        move((c, max) => ({ index: c.index >= max ? c.start : c.index }));
        setPlaying(true);
    }, [move]);
    const pause = React.useCallback(() => setPlaying(false), []);
    const toggle = React.useCallback(() => (playing ? pause() : play()), [playing, pause, play]);
    const step = React.useCallback(
        (count = 1) => move((c, max) => ({ index: Math.min(max, c.index + count) })),
        [move],
    );
    const stepBack = React.useCallback((count = 1) => move((c) => ({ index: Math.max(0, c.index - count) })), [move]);
    const setStart = React.useCallback(
        (i: number) => {
            move((_, max) => {
                const index = resolveIndex(i, max + 1);
                return { index, start: index };
            });
            setPlaying(false);
        },
        [move],
    );
    const reset = React.useCallback(() => {
        move((c) => ({ index: c.start }));
        setPlaying(false);
    }, [move]);

    const visible = React.useMemo(() => data.slice(0, cursor + 1), [data, cursor]);
    return {
        data: visible,
        index: cursor,
        playing,
        atEnd,
        speed,
        play,
        pause,
        toggle,
        step,
        stepBack,
        setSpeed,
        setStart,
        reset,
    };
}
