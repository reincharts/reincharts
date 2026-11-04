import type { UseBarReplayResult } from "@reincharts/datafeed";
import { useWidget } from "./context";
import { Icon } from "./icons";

const SPEEDS = [0.5, 1, 3, 10];

export interface ReplayBarProps {
    readonly replay: UseBarReplayResult<unknown>;
    /** Waiting for a click on the chart to choose the start bar. */
    readonly selecting: boolean;
    readonly onSelect: () => void;
}

/** Floating bar replay controls: select start, play / pause, step, speed, exit. */
export function ReplayBar({ replay, selecting, onSelect }: ReplayBarProps) {
    const w = useWidget();
    return (
        <div className="rc-w-replay" role="toolbar" aria-label="Bar replay">
            <button
                type="button"
                className="rc-w-btn rc-w-text-btn"
                data-active={selecting ? "" : undefined}
                onClick={onSelect}
                title="Click a bar on the chart to start the replay there"
            >
                {selecting ? "Click a bar…" : "Select bar"}
            </button>
            <span className="rc-w-sep" />
            <button
                type="button"
                className="rc-w-btn"
                onClick={() => replay.stepBack()}
                title="Step back"
                aria-label="Step back"
            >
                <Icon name="stepBack" />
            </button>
            <button
                type="button"
                className="rc-w-btn"
                onClick={replay.toggle}
                title={replay.playing ? "Pause" : "Play"}
                aria-label={replay.playing ? "Pause" : "Play"}
            >
                <Icon name={replay.playing ? "pause" : "play"} />
            </button>
            <button
                type="button"
                className="rc-w-btn"
                onClick={() => replay.step()}
                disabled={replay.atEnd}
                title="Step forward"
                aria-label="Step forward"
            >
                <Icon name="stepForward" />
            </button>
            <select
                className="rc-w-select"
                value={replay.speed}
                onChange={(e) => replay.setSpeed(Number(e.target.value))}
                aria-label="Replay speed"
                title="Speed (bars per second)"
            >
                {SPEEDS.map((s) => (
                    <option key={s} value={s}>
                        {s}x
                    </option>
                ))}
            </select>
            <span className="rc-w-sep" />
            <button
                type="button"
                className="rc-w-btn rc-w-text-btn"
                onClick={() => w.setReplay(false)}
                title="Exit replay"
                aria-label="Exit replay"
            >
                <Icon name="close" size={16} />
                Exit
            </button>
        </div>
    );
}
