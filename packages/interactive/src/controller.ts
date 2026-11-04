import { builtinTools } from "./tools";
import type { CursorMode, Drawing, DrawingStyle, MagnetMode, ToolDefinition } from "./types";

/** Snapshot of the controller state (immutable, safe for React). */
export interface DrawingControllerState {
    /** All drawings, in creation order (render order also uses `z`). */
    readonly drawings: readonly Drawing[];
    readonly selectedIds: readonly string[];
    /** Tool being drawn, or null for the cursor. */
    readonly activeTool: string | null;
    /** Stay in the active tool after finishing a drawing. */
    readonly keepDrawing: boolean;
    readonly magnet: MagnetMode;
    /** Pointer mode when no tool is active. */
    readonly cursor: CursorMode;
    /** "Lock all drawings" toggle. */
    readonly locked: boolean;
    /** "Hide all drawings" toggle. */
    readonly hidden: boolean;
    /** Drawing whose text is being edited inline. */
    readonly editingId: string | null;
    readonly canUndo: boolean;
    readonly canRedo: boolean;
}

/** Fired when new data crosses a line drawing (price alerts). */
export interface CrossEvent {
    readonly drawing: Drawing;
    /** "up" when the price crossed from below. */
    readonly direction: "up" | "down";
    /** The bar (datum) that crossed. */
    readonly bar: unknown;
    /** Price of the drawing at the bar. */
    readonly value: number;
}

export interface DrawingControllerEvents {
    /** Drawings changed (any reason, including drags). */
    change: readonly Drawing[];
    /** A drawing was created. */
    create: Drawing;
    /** A drawing was edited (not fired for every drag frame). */
    update: Drawing;
    /** A drawing was removed. */
    remove: Drawing;
    /** Selection changed. */
    select: readonly Drawing[];
    /** New data crossed a line drawing. */
    cross: CrossEvent;
    /** Active tool changed. */
    tool: string | null;
}

/** Input of `add`: a drawing without id (the pane defaults to "main"). */
export type NewDrawing = Omit<Drawing, "id" | "pane" | "style"> & { id?: string; pane?: string; style?: DrawingStyle };

/** Serialized drawings (`toJSON` / `load`). */
export interface DrawingsJSON {
    /** Format version. */
    readonly version: 1;
    /** All drawings. */
    readonly drawings: readonly Drawing[];
}

export interface DrawingControllerOptions {
    /** Extra / overriding tool definitions (custom tools). */
    readonly tools?: readonly ToolDefinition[];
    /** Include the built-in tools (default true). */
    readonly builtinTools?: boolean;
    /** Initial drawings (uncontrolled mode). */
    readonly defaultDrawings?: readonly Drawing[];
    /** Controlled drawings. Pair with `onChange`. */
    readonly drawings?: readonly Drawing[];
    /** Called with the next drawings on every change (controlled and uncontrolled). */
    readonly onChange?: (drawings: readonly Drawing[]) => void;
    /** A drawing was created (by the user, paste or `add`). */
    readonly onCreate?: (drawing: Drawing) => void;
    /** A drawing was edited (move / resize finished, style change...). */
    readonly onUpdate?: (drawing: Drawing) => void;
    /** A drawing was removed. */
    readonly onRemove?: (drawing: Drawing) => void;
    /** Selection changed. */
    readonly onSelect?: (drawings: readonly Drawing[]) => void;
    /** New data crossed a horizontal line, price line or trend line. */
    readonly onCross?: (drawing: Drawing, direction: "up" | "down", bar: unknown) => void;
    /** Style applied to every new drawing (on top of tool defaults). */
    readonly defaultStyle?: DrawingStyle;
    /** Initial magnet mode. Default "off". */
    readonly defaultMagnet?: MagnetMode;
    /** Max undo steps. Default 100. */
    readonly historyLimit?: number;
}

let seq = 0;
/** Generates a unique drawing id. */
export const drawingId = () =>
    `d${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const asArray = (ids: string | readonly string[] | undefined | null): readonly string[] =>
    ids === undefined || ids === null ? [] : typeof ids === "string" ? [ids] : ids;

/** Drawings sorted for rendering (by z, then creation order). */
export const renderOrder = (drawings: readonly Drawing[]) =>
    drawings
        .map((d, i) => ({ d, i }))
        .sort((a, b) => (a.d.z ?? 0) - (b.d.z ?? 0) || a.i - b.i)
        .map((e) => e.d);

/**
 * Framework agnostic drawing store: drawings, selection, active tool, undo / redo,
 * clipboard, serialization and events. `useDrawings()` wraps it for React.
 */
export function createDrawingController(options: DrawingControllerOptions = {}) {
    let opts = options;
    const toolMap = new Map<string, ToolDefinition>();
    for (const t of [...(opts.builtinTools === false ? [] : builtinTools), ...(opts.tools ?? [])]) {
        toolMap.set(t.type, t);
    }
    const tools = [...toolMap.values()];
    let state: DrawingControllerState = {
        drawings: opts.drawings ?? opts.defaultDrawings ?? [],
        selectedIds: [],
        activeTool: null,
        keepDrawing: false,
        magnet: opts.defaultMagnet ?? "off",
        cursor: "cross",
        locked: false,
        hidden: false,
        editingId: null,
        canUndo: false,
        canRedo: false,
    };
    const undoStack: (readonly Drawing[])[] = [];
    const redoStack: (readonly Drawing[])[] = [];
    let clipboard: readonly Drawing[] = [];
    const storeListeners = new Set<() => void>();
    const listeners = new Map<string, Set<(e: any) => void>>();

    const set = (patch: Partial<DrawingControllerState>) => {
        state = { ...state, ...patch, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 };
        for (const fn of [...storeListeners]) {
            fn();
        }
    };

    /** The option callback of each event. */
    const callbacks: { [K in keyof DrawingControllerEvents]: (e: DrawingControllerEvents[K]) => void } = {
        change: (e) => opts.onChange?.(e),
        create: (e) => opts.onCreate?.(e),
        update: (e) => opts.onUpdate?.(e),
        remove: (e) => opts.onRemove?.(e),
        select: (e) => opts.onSelect?.(e),
        cross: (e) => opts.onCross?.(e.drawing, e.direction, e.bar),
        tool: () => {},
    };

    const emit = <K extends keyof DrawingControllerEvents>(type: K, e: DrawingControllerEvents[K]) => {
        for (const fn of [...(listeners.get(type) ?? [])]) {
            fn(e);
        }
        callbacks[type](e);
    };

    /** The selected ids that still exist in `drawings`. */
    const selectionIn = (drawings: readonly Drawing[]) => {
        const ids = new Set(drawings.map((d) => d.id));
        return state.selectedIds.filter((id) => ids.has(id));
    };

    const pushUndo = () => {
        undoStack.push(state.drawings);
        if (undoStack.length > (opts.historyLimit ?? 100)) {
            undoStack.shift();
        }
        redoStack.length = 0;
    };

    /** Replaces the drawings, recording history unless `history` is false. */
    const commit = (drawings: readonly Drawing[], history = true) => {
        if (drawings === state.drawings) {
            return;
        }
        if (history) {
            pushUndo();
        }
        set({
            drawings,
            selectedIds: selectionIn(drawings),
            editingId: drawings.some((d) => d.id === state.editingId) ? state.editingId : null,
        });
        emit("change", drawings);
    };

    const byId = (id: string) => state.drawings.find((d) => d.id === id);
    /** The drawings with the given ids, in drawing order. */
    const pick = (ids: string | readonly string[]) => {
        const wanted = new Set(asArray(ids));
        return state.drawings.filter((d) => wanted.has(d.id));
    };
    const selected = () => state.selectedIds.map(byId).filter((d): d is Drawing => !!d);

    const getTool = (type: string) => toolMap.get(type);

    const create = (input: NewDrawing): Drawing => {
        const tool = getTool(input.type);
        return {
            ...input,
            id: input.id ?? drawingId(),
            pane: input.pane ?? "main",
            style: { ...tool?.defaults, ...opts.defaultStyle, ...input.style },
        };
    };

    const clones = (source: readonly Drawing[]) => {
        const maxZ = Math.max(0, ...state.drawings.map((d) => d.z ?? 0));
        return source.map((d, i) => ({
            ...d,
            id: drawingId(),
            locked: false,
            z: d.z !== undefined ? maxZ + 1 + i : undefined,
        }));
    };

    const insert = (items: readonly Drawing[]) => {
        if (!items.length) {
            return;
        }
        commit([...state.drawings, ...items]);
        for (const d of items) {
            emit("create", d);
        }
        select(items.map((d) => d.id));
    };

    const select = (ids: string | readonly string[] | null, additive = false) => {
        let next = asArray(ids).filter((id) => byId(id));
        if (additive) {
            const current = new Set(state.selectedIds);
            for (const id of next) {
                if (current.has(id)) {
                    current.delete(id);
                } else {
                    current.add(id);
                }
            }
            next = [...current];
        }
        if (next.length === state.selectedIds.length && next.every((id, i) => id === state.selectedIds[i])) {
            return;
        }
        set({ selectedIds: next });
        emit("select", selected());
    };

    const remove = (ids: string | readonly string[]) => {
        const removed = pick(ids);
        if (!removed.length) {
            return;
        }
        const gone = new Set(removed);
        commit(state.drawings.filter((d) => !gone.has(d)));
        for (const d of removed) {
            emit("remove", d);
        }
    };

    type Patch = Partial<Omit<Drawing, "id">>;

    const update = (
        ids: string | readonly string[],
        patch: Patch | ((d: Drawing) => Patch),
        { history = true, silent = false }: { history?: boolean; silent?: boolean } = {},
    ): Drawing | undefined => {
        const target = new Set(asArray(ids));
        const changed: Drawing[] = [];
        const drawings = state.drawings.map((d) => {
            if (!target.has(d.id)) {
                return d;
            }
            const p = typeof patch === "function" ? patch(d) : patch;
            const next: Drawing = { ...d, ...p, style: p.style ? { ...d.style, ...p.style } : d.style, id: d.id };
            changed.push(next);
            return next;
        });
        if (!changed.length) {
            return undefined;
        }
        commit(drawings, history);
        if (!silent) {
            for (const d of changed) {
                emit("update", d);
            }
        }
        return changed[0];
    };

    const historyStep = (from: (readonly Drawing[])[], to: (readonly Drawing[])[]) => {
        const prev = from.pop();
        if (!prev) {
            return;
        }
        to.push(state.drawings);
        set({ drawings: prev, selectedIds: selectionIn(prev) });
        emit("change", prev);
    };

    const z = (ids: readonly string[], front: boolean) => {
        const target = new Set(ids);
        if (!target.size) {
            return;
        }
        const zs = state.drawings.map((d) => d.z ?? 0);
        let next = front ? Math.max(...zs) : Math.min(...zs);
        commit(
            state.drawings.map((d) => {
                if (!target.has(d.id)) {
                    return d;
                }
                next += front ? 1 : -1;
                return { ...d, z: next };
            }),
        );
    };

    const controller = {
        /** Registered tools (built-in + custom). */
        tools,
        /** Tool definition by type. */
        getTool,
        /** Current state snapshot. */
        getState: () => state,
        /** Subscribes to state changes (useSyncExternalStore compatible). */
        subscribe: (fn: () => void) => {
            storeListeners.add(fn);
            return () => {
                storeListeners.delete(fn);
            };
        },
        /** All drawings. */
        get drawings() {
            return state.drawings;
        },
        /** Ids of the selected drawings. */
        get selectedIds() {
            return state.selectedIds;
        },
        /** Selected drawings. */
        get selected() {
            return selected();
        },
        /** Active drawing tool type, or null. */
        get activeTool() {
            return state.activeTool;
        },
        /** Stay-in-drawing-mode flag. */
        get keepDrawing() {
            return state.keepDrawing;
        },
        /** Current magnet mode. */
        get magnet() {
            return state.magnet;
        },
        /** Pointer mode when no tool is active. */
        get cursor() {
            return state.cursor;
        },
        /** True when `undo()` has something to undo. */
        get canUndo() {
            return state.canUndo;
        },
        /** True when `redo()` has something to redo. */
        get canRedo() {
            return state.canRedo;
        },
        /** Activates a drawing tool (null = cursor). */
        setTool(type: string | null) {
            if (type !== null && !getTool(type)) {
                return;
            }
            if (state.activeTool !== type) {
                set({ activeTool: type, editingId: null });
                emit("tool", type);
            }
        },
        /** Stay in the active tool after finishing a drawing. */
        setKeepDrawing(keep: boolean) {
            set({ keepDrawing: keep });
        },
        /** Magnet mode used when placing points ("weak" snaps near OHLC, "strong" always). */
        setMagnet(magnet: MagnetMode) {
            set({ magnet });
        },
        /** Pointer mode when no tool is active (cross, arrow, eraser). */
        setCursor(cursor: CursorMode) {
            const changed = state.activeTool !== null;
            set({ cursor, activeTool: null });
            if (changed) {
                emit("tool", null);
            }
        },
        /** Adds a drawing (tool defaults are merged into its style) and selects it. */
        add(input: NewDrawing) {
            const d = create(input);
            insert([d]);
            return d;
        },
        /** Creates a drawing object without adding it. */
        create,
        /** Updates one or more drawings (patch object or function). `{ history: false }` skips undo, `{ silent: true }` skips `update` events. */
        update,
        /** Removes drawings by id. */
        remove,
        /** Removes the selected drawings. */
        removeSelected() {
            remove(state.selectedIds);
        },
        /** Removes every drawing (undoable). */
        removeAll() {
            const all = state.drawings;
            commit([]);
            for (const d of all) {
                emit("remove", d);
            }
        },
        /** Selects drawings. `additive` toggles them in the current selection (shift-click). */
        select,
        /** Deselects everything. */
        clearSelection() {
            select([]);
        },
        /** Toggles the "lock all drawings" mode. */
        lockAll(locked = !state.locked) {
            set({ locked });
        },
        /** Toggles the "hide all drawings" mode. */
        hideAll(hidden = !state.hidden) {
            set({ hidden, selectedIds: hidden ? [] : state.selectedIds });
        },
        /** Draws drawings (default: the selection) above the others. */
        bringToFront(ids: string | readonly string[] = state.selectedIds) {
            z(asArray(ids), true);
        },
        /** Draws drawings (default: the selection) below the others. */
        sendToBack(ids: string | readonly string[] = state.selectedIds) {
            z(asArray(ids), false);
        },
        /** Copies drawings (default: the selection) to the internal clipboard. */
        copy(ids: string | readonly string[] = state.selectedIds) {
            clipboard = pick(ids);
            return clipboard;
        },
        /** Pastes the clipboard as new drawings and selects them. */
        paste() {
            const items = clones(clipboard);
            insert(items);
            return items;
        },
        /** Clones drawings (default: the selection). */
        duplicate(ids: string | readonly string[] = state.selectedIds) {
            const items = clones(pick(ids));
            insert(items);
            return items;
        },
        /** Undoes the last change. */
        undo() {
            historyStep(undoStack, redoStack);
        },
        /** Redoes the last undone change. */
        redo() {
            historyStep(redoStack, undoStack);
        },
        /** Serializable snapshot of all drawings. */
        toJSON(): DrawingsJSON {
            return { version: 1, drawings: state.drawings };
        },
        /** Replaces all drawings (from `toJSON()` output, an array or a JSON string). Undoable. */
        load(json: DrawingsJSON | readonly Drawing[] | string) {
            const parsed = typeof json === "string" ? JSON.parse(json) : json;
            const drawings: readonly Drawing[] = Array.isArray(parsed)
                ? parsed
                : ((parsed as DrawingsJSON).drawings ?? []);
            commit(drawings.map((d) => ({ ...d, pane: d.pane ?? "main", style: d.style ?? {} })));
        },
        /** Subscribes to an event; returns the unsubscribe function. */
        on<K extends keyof DrawingControllerEvents>(type: K, fn: (e: DrawingControllerEvents[K]) => void) {
            let s = listeners.get(type);
            if (!s) {
                s = new Set();
                listeners.set(type, s);
            }
            s.add(fn);
            return () => {
                s!.delete(fn);
            };
        },
        /** Opens (or closes with null) the inline text editor for a drawing. */
        edit(id: string | null) {
            set({ editingId: id });
        },
        /** Records the current drawings as an undo step (call before a series of `update(..., { history: false })`). */
        checkpoint() {
            pushUndo();
            set({});
        },
        /** Fires `update` events (e.g. after a drag made of silent updates). */
        notifyUpdate(ids: string | readonly string[]) {
            for (const id of asArray(ids)) {
                const d = byId(id);
                if (d) {
                    emit("update", d);
                }
            }
        },
        /**
         * Checks line drawings for a price cross between `prev` and `next` at a logical x and fires `cross` events.
         * `<Drawings>` calls it when new data arrives.
         */
        checkCrosses(prev: number, next: number, logical: number, logicalOf: (time: number) => number, bar: unknown) {
            const out: CrossEvent[] = [];
            for (const d of state.drawings) {
                const v = d.hidden ? undefined : getTool(d.type)?.crossValue?.(d, logical, logicalOf);
                if (v === undefined || !Number.isFinite(v)) {
                    continue;
                }
                const direction = prev < v && next >= v ? "up" : prev > v && next <= v ? "down" : null;
                if (direction) {
                    const e = { drawing: d, direction, bar, value: v } as const;
                    out.push(e);
                    emit("cross", e);
                }
            }
            return out;
        },
        /** Updates callbacks / controlled drawings (used by `useDrawings` on every render). */
        setOptions(next: DrawingControllerOptions) {
            const prevDrawings = opts.drawings;
            opts = next;
            if (next.drawings && next.drawings !== prevDrawings && next.drawings !== state.drawings) {
                set({ drawings: next.drawings, selectedIds: selectionIn(next.drawings) });
            }
        },
    };
    return controller;
}

/** The drawing controller returned by `useDrawings()` / `createDrawingController()`. */
export type DrawingController = ReturnType<typeof createDrawingController>;
