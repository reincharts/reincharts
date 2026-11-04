import * as React from "react";
import {
    createDrawingController,
    type DrawingController,
    type DrawingControllerOptions,
    type DrawingControllerState,
} from "./controller";

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** Options of `useDrawings` (the controller options). `tools` and `builtinTools` are read once. */
export type UseDrawingsOptions = DrawingControllerOptions;

/**
 * Creates a drawing controller for `<Drawings>`, `<DrawingToolbar>` and `<DrawingStyleToolbar>`.
 * Uncontrolled with `defaultDrawings`, controlled with `drawings` + `onChange`.
 * The component re-renders when the controller state changes.
 */
export function useDrawings(options: UseDrawingsOptions = {}): DrawingController {
    const [controller] = React.useState(() => createDrawingController(options));
    useIsoLayoutEffect(() => {
        controller.setOptions(options);
    });
    useDrawingState(controller);
    return controller;
}

/** Subscribes a component to a controller's state. */
export function useDrawingState(controller: DrawingController): DrawingControllerState {
    return React.useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
}
