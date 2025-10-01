import * as React from "react";
import { getMouseCanvas, GenericChartComponent } from "@reincharts/core";

interface ClickCallbackProps {
    /** Mouse down event handler. */
    readonly onMouseDown?: (e: React.MouseEvent<Element, MouseEvent>, moreProps: any) => void;
    /** Click event handler. */
    readonly onClick?: (e: React.MouseEvent<Element, MouseEvent>, moreProps: any) => void;
    /** Double click event handler. */
    readonly onDoubleClick?: (e: React.MouseEvent<Element, MouseEvent>, moreProps: any) => void;
    /** Context menu event handler. */
    readonly onContextMenu?: (e: React.MouseEvent<Element, MouseEvent>, moreProps: any) => void;
    /** Mouse move event handler. */
    readonly onMouseMove?: (e: React.MouseEvent<Element, MouseEvent>, moreProps: any) => void;
    /** Pan event handler. */
    readonly onPan?: (e: React.MouseEvent<Element, MouseEvent>, moreProps: any) => void;
    /** Pan end event handler. */
    readonly onPanEnd?: (e: React.MouseEvent<Element, MouseEvent>, moreProps: any) => void;
}

export class ClickCallback extends React.Component<ClickCallbackProps> {
    public static displayName = "ClickCallback";

    public static defaultProps = {
        disablePan: false,
    };

    public render() {
        const { onMouseDown, onClick, onDoubleClick, onContextMenu, onMouseMove, onPan, onPanEnd } = this.props;

        return (
            <GenericChartComponent
                onMouseDown={onMouseDown}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onContextMenu={onContextMenu}
                onMouseMove={onMouseMove}
                onPan={onPan}
                onPanEnd={onPanEnd}
                canvasToDraw={getMouseCanvas}
                drawOn={["mousemove", "pan"]}
            />
        );
    }
}
