// Integration point with @reincharts/interactive (drawing tools). Everything drawing related lives here.
import {
    Drawings,
    DrawingStyleToolbar,
    DrawingToolbar,
    createDrawingController,
    type Drawing,
    type DrawingController,
} from "@reincharts/interactive";
import * as React from "react";

/** One drawing in the object tree. */
export interface DrawingListItem {
    readonly id: string;
    readonly name: string;
    /** Pane the drawing lives in. */
    readonly pane: string;
    readonly hidden?: boolean;
    readonly locked?: boolean;
}

/** What the rest of the widget needs from the drawing tools. */
export interface DrawingIntegration {
    /** Drawing tools are available. */
    readonly available: boolean;
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly undo: () => void;
    readonly redo: () => void;
    /** Removes every drawing (undoable). */
    readonly clear: () => void;
    /** Drawings for the object tree. */
    readonly list: readonly DrawingListItem[];
    /** Shows / hides one drawing. */
    readonly toggle: (id: string) => void;
    /** Locks / unlocks one drawing. */
    readonly toggleLock: (id: string) => void;
    readonly remove: (id: string) => void;
    /** Selects a drawing (object tree click). */
    readonly select: (id: string) => void;
    readonly selectedIds: readonly string[];
    /** Pushes pending edits to the widget state now (before `save()`). */
    readonly flush: () => void;
    /** The controller handed to the chart / toolbar components. */
    readonly controller: DrawingController;
}

type Slice = Pick<DrawingIntegration, "canUndo" | "canRedo" | "list" | "selectedIds">;

const sameList = (a: readonly DrawingListItem[], b: readonly DrawingListItem[]) =>
    a.length === b.length &&
    a.every(
        (x, i) =>
            x.id === b[i].id &&
            x.name === b[i].name &&
            x.pane === b[i].pane &&
            x.hidden === b[i].hidden &&
            x.locked === b[i].locked,
    );

const sliceOf = (controller: DrawingController): Slice => {
    const s = controller.getState();
    return {
        canUndo: s.canUndo,
        canRedo: s.canRedo,
        selectedIds: s.selectedIds,
        list: s.drawings.map((d) => ({
            id: d.id,
            name: controller.getTool(d.type)?.label ?? d.type,
            pane: d.pane,
            hidden: d.hidden,
            locked: d.locked,
        })),
    };
};

/**
 * Creates the widget's drawing controller from `state.drawings`. Edits are pushed back to the widget state once per
 * animation frame (dragging a drawing does not re-render the widget on every pointer move); a new `drawings` value
 * coming from outside (load, controlled state) is loaded into the controller.
 */
export function useDrawingIntegration(
    drawings: readonly unknown[],
    onChange: (drawings: unknown[]) => void,
): DrawingIntegration {
    const onChangeRef = React.useRef(onChange);
    onChangeRef.current = onChange;
    const sent = React.useRef(drawings);
    const pending = React.useRef<readonly Drawing[] | null>(null);
    const frame = React.useRef(0);
    const flush = React.useCallback(() => {
        if (frame.current) {
            cancelAnimationFrame(frame.current);
            frame.current = 0;
        }
        const next = pending.current;
        if (next) {
            pending.current = null;
            sent.current = next;
            onChangeRef.current(next as unknown[]);
        }
    }, []);
    const [controller] = React.useState(() =>
        createDrawingController({
            defaultDrawings: drawings as readonly Drawing[],
            onChange: (all) => {
                pending.current = all;
                if (!frame.current) {
                    frame.current = requestAnimationFrame(flush);
                }
            },
        }),
    );
    React.useLayoutEffect(() => {
        if (drawings !== sent.current) {
            sent.current = drawings;
            pending.current = null;
            if (drawings !== controller.drawings) {
                controller.load(drawings as readonly Drawing[]);
            }
        }
    }, [controller, drawings]);
    React.useEffect(
        () => () => {
            cancelAnimationFrame(frame.current);
            // a remount (StrictMode, Activity) must be able to schedule flushes again
            frame.current = 0;
        },
        [],
    );

    // subscribe to what the toolbar / object tree show only (not to point moves)
    const cache = React.useRef<Slice | null>(null);
    const get = () => {
        const next = sliceOf(controller);
        const c = cache.current;
        if (
            c &&
            c.canUndo === next.canUndo &&
            c.canRedo === next.canRedo &&
            c.selectedIds === next.selectedIds &&
            sameList(c.list, next.list)
        ) {
            return c;
        }
        cache.current = next;
        return next;
    };
    const slice = React.useSyncExternalStore(controller.subscribe, get, get);

    return React.useMemo(
        () => ({
            available: true,
            ...slice,
            undo: () => {
                controller.undo();
                flush();
            },
            redo: () => {
                controller.redo();
                flush();
            },
            clear: () => {
                controller.removeAll();
                flush();
            },
            toggle: (id: string) => {
                controller.update(id, (d) => ({ hidden: !d.hidden }));
                flush();
            },
            toggleLock: (id: string) => {
                controller.update(id, (d) => ({ locked: !d.locked }));
                flush();
            },
            remove: (id: string) => {
                controller.remove(id);
                flush();
            },
            select: (id: string) => controller.select(id),
            flush,
            controller,
        }),
        [controller, slice, flush],
    );
}

/** Drawings layer + floating style toolbar, rendered inside the ChartCanvas of the first chart. */
export function ChartDrawings({ integration }: { readonly integration: DrawingIntegration }) {
    return (
        <>
            <Drawings controller={integration.controller} />
            <DrawingStyleToolbar controller={integration.controller} />
        </>
    );
}

/** Left drawing toolbar (with flyouts, magnet, keep drawing, lock / hide / remove all). */
export function DrawingSidebar({
    integration,
    theme,
    favorites,
    onFavoritesChange,
}: {
    readonly integration: DrawingIntegration;
    readonly theme: "light" | "dark";
    readonly favorites?: readonly string[];
    readonly onFavoritesChange?: (favorites: readonly string[]) => void;
}) {
    return (
        <DrawingToolbar
            controller={integration.controller}
            theme={theme}
            favorites={favorites}
            onFavoritesChange={onFavoritesChange}
            className="rc-w-drawing-toolbar"
        />
    );
}
