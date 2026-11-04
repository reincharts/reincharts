import {
    useChart,
    useChartEvent,
    useChartState,
    useHitTarget,
    useRenderable,
    type ChartPointerEvent,
} from "@reincharts/core";
import * as React from "react";
import type { DrawingController } from "./controller";
import { createEditor, type DrawingEditor } from "./editor";
import { createGeometry } from "./geometry";
import type { Drawing } from "./types";
import { useDrawingState } from "./useDrawings";

export interface DrawingsProps {
    /** Controller from `useDrawings()`. */
    readonly controller: DrawingController;
    /** Bar value used by the regression channel and `onCross` alerts. Default `d.close ?? d.value ?? d.y`. */
    readonly source?: (d: any, index: number) => number | undefined;
    /** Show drawing prices / times on the axes (horizontal lines, selected drawings). Default true. */
    readonly axisLabels?: boolean;
    /** Stacking order among renderables (series are 0, axes 100). Default 50. */
    readonly zIndex?: number;
    /** Right click on a drawing (the drawing is selected first). */
    readonly onContextMenu?: (drawing: Drawing, e: ChartPointerEvent) => void;
    /** Double click on a drawing (text drawings open the inline editor). */
    readonly onDoubleClick?: (drawing: Drawing, e: ChartPointerEvent) => void;
}

const sameIds = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

function PaneDrawings({ paneId, editor, zIndex }: { paneId: string; editor: DrawingEditor; zIndex: number }) {
    useRenderable({ pane: paneId, layer: "scene", zIndex, draw: (ctx, scope) => editor.drawScene(paneId, ctx, scope) });
    useRenderable({ pane: paneId, layer: "top", zIndex, draw: (ctx, scope) => editor.drawTop(paneId, ctx, scope) });
    const target = React.useMemo(() => editor.target(paneId), [editor, paneId]);
    useHitTarget({ ...target, pane: paneId, zIndex: zIndex + 1000 });
    return null;
}

/**
 * Renders and edits the drawings of a controller. Place one inside `<ChartCanvas>`;
 * each drawing is drawn in the pane named by its `pane`.
 */
export function Drawings({
    controller,
    source,
    axisLabels = true,
    zIndex = 50,
    onContextMenu,
    onDoubleClick,
}: DrawingsProps) {
    const engine = useChart();
    const optionsRef = React.useRef({ source, axisLabels, onContextMenu, onDoubleClick });
    optionsRef.current = { source, axisLabels, onContextMenu, onDoubleClick };
    const editor = React.useMemo(
        () => createEditor(engine, controller, () => optionsRef.current),
        [engine, controller],
    );
    const paneIds = useChartState((s) => s.layout.panes.map((p) => p.id), sameIds);
    const state = useDrawingState(controller);

    React.useLayoutEffect(() => {
        let tool = controller.getState().activeTool;
        return controller.subscribe(() => {
            const s = controller.getState();
            if (s.activeTool !== tool) {
                tool = s.activeTool;
                editor.cancel();
            }
            engine.invalidate("scene");
        });
    }, [controller, editor, engine]);

    React.useLayoutEffect(() => {
        engine.toolCursor = state.activeTool ? "crosshair" : state.cursor === "arrow" ? "default" : null;
    }, [engine, state.activeTool, state.cursor]);
    React.useLayoutEffect(
        () => () => {
            engine.toolCursor = null;
        },
        [engine],
    );

    useRenderable({ pane: null, layer: "top", zIndex: zIndex - 10, clip: false, draw: (ctx) => editor.drawAxes(ctx) });
    useChartEvent("pointerdown", editor.onPointerDown);
    useChartEvent("pointermove", editor.onPointerMove);
    useChartEvent("drag", editor.onDrag);
    useChartEvent("dragend", editor.onDragEnd);
    useChartEvent("click", editor.onClick);
    useChartEvent("dblclick", editor.onDoubleClick);
    useChartEvent("keydown", editor.onKeyDown);
    useChartEvent("datachange", editor.onDataChange);

    return (
        <>
            {paneIds.map((id) => (
                <PaneDrawings key={id} paneId={id} editor={editor} zIndex={zIndex} />
            ))}
            {state.editingId && <TextEditor key={state.editingId} controller={controller} id={state.editingId} />}
        </>
    );
}

/** Inline textarea over a text drawing. Enter commits (Shift+Enter = new line), Esc cancels. */
function TextEditor({ controller, id }: { controller: DrawingController; id: string }) {
    const engine = useChart();
    useChartState((s) => s.version);
    const drawing = controller.drawings.find((d) => d.id === id);
    const [value, setValue] = React.useState(drawing?.style.text ?? "");
    const ref = React.useRef<HTMLTextAreaElement>(null);
    const done = React.useRef(false);
    React.useEffect(() => {
        ref.current?.focus();
        ref.current?.select();
    }, []);
    const pane = drawing && engine.layout.panes.find((p) => p.id === drawing.pane);
    const tool = drawing && controller.getTool(drawing.type);
    if (!drawing || !pane || !tool) {
        return null;
    }
    const g = createGeometry(drawing, {
        engine,
        scale: engine.getScale(drawing.pane, drawing.scale ?? "right"),
        theme: engine.theme,
        width: pane.width,
        height: pane.height,
    });
    const at = tool.textAnchor?.(g) ?? g.points[0];
    const close = (commit: boolean) => {
        if (done.current) {
            return;
        }
        done.current = true;
        if (commit && value !== drawing.style.text) {
            controller.update(id, { style: { text: value } });
        }
        controller.edit(null);
    };
    const size = drawing.style.fontSize ?? 14;
    const lines = value.split("\n");
    return (
        <textarea
            ref={ref}
            className="rc-text-editor"
            value={value}
            rows={Math.max(1, lines.length)}
            cols={Math.max(4, ...lines.map((l) => l.length + 1))}
            style={{
                left: pane.left + at.x,
                top: pane.top + at.y,
                fontSize: size,
                fontFamily: engine.theme.fontFamily,
                color: (drawing.style.textColor as string | undefined) ?? g.color,
                borderColor: g.color,
            }}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => close(true)}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Escape") {
                    close(false);
                } else if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    close(true);
                }
            }}
        />
    );
}
