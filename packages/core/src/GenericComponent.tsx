import * as React from "react";
import { functor, identity, isDefined } from "./utils";
import { ICanvasContexts } from "./CanvasContainer";
import { ChartCanvasContext } from "./ChartCanvas";
import { ChartConfig } from "./utils/ChartDataUtil";

const aliases: Record<string, string> = {
    mouseleave: "mousemove", // to draw interactive after mouse exit
    panend: "pan",
    mouseup: "mousemove",
    mousedown: "mousemove",
    keydown: "keydown",
    click: "mousemove",
    contextmenu: "mousemove",
    dblclick: "mousemove",
    dragstart: "drag",
    dragend: "drag",
    dragcancel: "drag",
    pinchzoom: "zoom",
    zoom: "zoom",
};

interface GenericComponentProps {
    /**
     * Function to render SVG elements. Receives moreProps as argument.
     * Used for SVG-based drawing (e.g., overlays, annotations).
     */
    readonly svgDraw?: (moreProps: any) => React.ReactNode;
    /**
     * Function to render canvas elements (executed after preCanvasDraw and before postCanvasDraw).
     * Receives the canvas context and all calculated chart props.
     */
    readonly canvasDraw?: (ctx: CanvasRenderingContext2D, moreProps: any) => void;
    /**
     * Function to select which canvas to draw on (e.g., mouse, axis, etc.).
     * Receives all available canvas contexts (mouseCoord, bg, and axes) and returns the one to use.
     * Default implementation returns the mouseCoord canvas.
     */
    readonly canvasToDraw?: (contexts: ICanvasContexts) => CanvasRenderingContext2D | undefined;
    /**
     * If true, applies a clip path to restrict drawing to the chart area.
     */
    readonly clip?: boolean;
    /**
     * If true, disables panning for this component.
     */
    readonly disablePan?: boolean;
    /**
     * List of event types (e.g., 'mousemove', 'pan', 'drag') that should trigger a redraw or event handling for this component.
     * These types are matched against incoming chart events, and if present, the component will update or handle the event accordingly.
     * Common values include: 'mousemove', 'pan', 'drag', 'zoom', 'click', 'mouseleave', etc.
     */
    readonly drawOn: string[];
    /**
     * If true, applies edge clipping to restrict drawing to the full chart area including axes margins,
     * extending 10px above and below the chart area. This is different from the regular clip which
     * only restricts to the chart's plotting area.
     */
    readonly edgeClip?: boolean;
    /**
     * If true, enables drag interaction when hovering over the component, even when the component is not selected.
     * This allows interactive elements to be draggable when hovered without needing to click to select them first.
     */
    readonly enableDragOnHover?: boolean;
    /**
     * CSS class to apply to the cursor when the component is interactive and selected.
     * Used to indicate when an element can be dragged or otherwise interacted with.
     * Common values include "reincharts-move-cursor" or "reincharts-pointer-cursor".
     */
    readonly interactiveCursorClass?: string;
    /**
     * Function to determine if the mouse is hovering over the component. Receives moreProps and the mouse event.
     */
    readonly isHover?: (moreProps: any, e: React.MouseEvent) => boolean;
    /**
     * Called when the chart the component is on is clicked.
     */
    readonly onClick?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when the component is clicked while it is being hovered.
     */
    readonly onClickWhenHover?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when the component is clicked but not hovered.
     */
    readonly onClickOutside?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when a pan event is in progress (e.g., mouse drag for panning the chart).
     */
    readonly onPan?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when a pan event ends.
     */
    readonly onPanEnd?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when a drag interaction starts.
     */
    readonly onDragStart?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called during a drag interaction.
     */
    readonly onDrag?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when a drag interaction completes.
     */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when the chart the component is on is double-clicked.
     */
    readonly onDoubleClick?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when the component is double-clicked while it is being hovered.
     */
    readonly onDoubleClickWhenHover?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when a context menu event (right-click) occurs on the component.
     */
    readonly onContextMenu?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when a context menu event occurs while hovering over the component.
     */
    readonly onContextMenuWhenHover?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called on every mouse move event (invoked for all mousemove events, regardless of hover state).
     */
    readonly onMouseMove?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when the mouse button is pressed down anywhere on the chart the component is on.
     */
    readonly onMouseDown?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when the mouse button is pressed down on the component while it is being hovered.
     */
    readonly onMouseDownWhenHover?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when the mouse button is released on the component.
     */
    readonly onMouseUp?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when a key is pressed.
     */
    readonly onKeyDown?: (e: React.KeyboardEvent, moreProps: any) => void;
    /**
     * Called when the mouse enters a hover state over the component.
     */
    readonly onHover?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * Called when the mouse leaves a hover state over the component.
     */
    readonly onUnHover?: (e: React.MouseEvent, moreProps: any) => void;
    /**
     * If true, marks the component as selected. Selected components display the interactiveCursorClass when hovered
     * and are prioritized for drag operations. Also affects visual styling in many interactive components.
     */
    readonly selected?: boolean;
}

interface GenericComponentState {
    updateCount: number;
}

export class GenericComponent extends React.Component<GenericComponentProps, GenericComponentState> {
    public static defaultProps = {
        svgDraw: functor(null),
        draw: [],
        canvasToDraw: (contexts: ICanvasContexts) => contexts.mouseCoord,
        clip: true,
        edgeClip: false,
        selected: false,
        disablePan: false,
        enableDragOnHover: false,
    };

    declare public context: React.ContextType<typeof ChartCanvasContext>;

    public moreProps: any = {};

    private dragInProgress = false;
    private evaluationInProgress = false;
    private iSetTheCursorClass = false;
    private subscriberId: number = 0;

    public constructor(props: GenericComponentProps) {
        super(props);
        this.drawOnCanvas = this.drawOnCanvas.bind(this);
        this.getMoreProps = this.getMoreProps.bind(this);
        this.draw = this.draw.bind(this);
        this.updateMoreProps = this.updateMoreProps.bind(this);
        this.evaluateType = this.evaluateType.bind(this);
        this.isHover = this.isHover.bind(this);
        this.preCanvasDraw = this.preCanvasDraw.bind(this);
        this.postCanvasDraw = this.postCanvasDraw.bind(this);
        this.getPanConditions = this.getPanConditions.bind(this);
        this.shouldTypeProceed = this.shouldTypeProceed.bind(this);
        this.preEvaluate = this.preEvaluate.bind(this);

        this.state = {
            updateCount: 0,
        };

        this.syncMorePropsWithContext(this.context);
    }

    public updateMoreProps(moreProps: any) {
        Object.keys(moreProps).forEach((key) => {
            this.moreProps[key] = moreProps[key];
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public shouldTypeProceed(_type: string, _moreProps: any) {
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public preEvaluate(_type: string, _moreProps: any, _e: any) {
        /// empty
    }

    private syncMorePropsWithContext(context: React.ContextType<typeof ChartCanvasContext> = this.context) {
        if (!context) {
            return;
        }

        const { xScale, plotData, chartConfigs, getMutableState, chartConfig } = context;
        const mutableState = getMutableState?.() ?? {};

        this.moreProps = {
            ...this.moreProps,
            ...mutableState,
            xScale,
            plotData,
            chartConfigs,
            chartConfig: chartConfig ?? this.moreProps.chartConfig,
        };
    }

    private subscribeToCanvas() {
        const { subscribe, chartId, generateSubscriptionId } = this.context;
        const { clip, edgeClip } = this.props;

        this.subscriberId = generateSubscriptionId ? generateSubscriptionId() : -1;

        subscribe(this.subscriberId, {
            chartId,
            clip,
            edgeClip,
            listener: this.listener,
            draw: this.draw,
            getPanConditions: this.getPanConditions,
        });
    }

    public listener = (type: string, moreProps: any, state: any, e: any) => {
        if (moreProps !== undefined) {
            this.updateMoreProps(moreProps);
        }
        this.evaluationInProgress = true;
        this.evaluateType(type, e);
        this.evaluationInProgress = false;
    };

    public evaluateType(type: string, e: any) {
        // @ts-ignore
        const newType = aliases[type] || type;
        const proceed = this.props.drawOn.indexOf(newType) > -1;
        if (!proceed) {
            return;
        }

        this.preEvaluate(type, this.moreProps, e);

        if (!this.shouldTypeProceed(type, this.moreProps)) {
            return;
        }

        switch (type) {
            case "zoom":
            case "mouseenter":
                // DO NOT DRAW FOR THESE EVENTS
                break;
            case "mouseleave": {
                this.moreProps.hovering = false;

                if (this.props.onUnHover) {
                    this.props.onUnHover(e, this.getMoreProps());
                }
                break;
            }
            case "contextmenu": {
                if (this.props.onContextMenu) {
                    this.props.onContextMenu(e, this.getMoreProps());
                }
                if (this.moreProps.hovering && this.props.onContextMenuWhenHover) {
                    this.props.onContextMenuWhenHover(e, this.getMoreProps());
                }
                break;
            }
            case "mousedown": {
                if (this.props.onMouseDown) {
                    this.props.onMouseDown(e, this.getMoreProps());
                }
                if (this.moreProps.hovering && this.props.onMouseDownWhenHover) {
                    this.props.onMouseDownWhenHover(e, this.getMoreProps());
                }
                break;
            }
            case "keydown": {
                if (this.props.onKeyDown) {
                    this.props.onKeyDown(e, this.getMoreProps());
                }
                break;
            }
            case "mouseup": {
                if (this.props.onMouseUp) {
                    this.props.onMouseUp(e, this.getMoreProps());
                }
                break;
            }
            case "click": {
                const { onClick, onClickOutside, onClickWhenHover } = this.props;
                const moreProps = this.getMoreProps();
                if (moreProps.hovering && onClickWhenHover !== undefined) {
                    onClickWhenHover(e, moreProps);
                } else if (onClickOutside !== undefined) {
                    onClickOutside(e, moreProps);
                }

                if (onClick !== undefined) {
                    onClick(e, moreProps);
                }
                break;
            }
            case "mousemove": {
                const prevHover = this.moreProps.hovering;
                this.moreProps.hovering = this.isHover(e);

                const { amIOnTop, setCursorClass } = this.context;

                if (
                    this.moreProps.hovering &&
                    !this.props.selected &&
                    /* && !prevHover */
                    amIOnTop(this.subscriberId) &&
                    this.props.onHover !== undefined
                ) {
                    setCursorClass("reincharts-pointer-cursor");
                    this.iSetTheCursorClass = true;
                } else if (this.moreProps.hovering && this.props.selected && amIOnTop(this.subscriberId)) {
                    setCursorClass(this.props.interactiveCursorClass);
                    this.iSetTheCursorClass = true;
                } else if (prevHover && !this.moreProps.hovering && this.iSetTheCursorClass) {
                    this.iSetTheCursorClass = false;
                    setCursorClass(null);
                }
                const moreProps = this.getMoreProps();

                if (this.moreProps.hovering && !prevHover) {
                    if (this.props.onHover) {
                        this.props.onHover(e, moreProps);
                    }
                }
                if (prevHover && !this.moreProps.hovering) {
                    if (this.props.onUnHover) {
                        this.props.onUnHover(e, moreProps);
                    }
                }

                if (this.props.onMouseMove) {
                    this.props.onMouseMove(e, moreProps);
                }
                break;
            }
            case "dblclick": {
                const moreProps = this.getMoreProps();

                if (this.props.onDoubleClick) {
                    this.props.onDoubleClick(e, moreProps);
                }
                if (this.moreProps.hovering && this.props.onDoubleClickWhenHover) {
                    this.props.onDoubleClickWhenHover(e, moreProps);
                }
                break;
            }
            case "pan": {
                this.moreProps.hovering = false;
                if (this.props.onPan) {
                    this.props.onPan(e, this.getMoreProps());
                }
                break;
            }
            case "panend": {
                if (this.props.onPanEnd) {
                    this.props.onPanEnd(e, this.getMoreProps());
                }
                break;
            }
            case "dragstart": {
                if (this.getPanConditions().draggable) {
                    const { amIOnTop } = this.context;
                    if (amIOnTop(this.subscriberId)) {
                        this.dragInProgress = true;
                        if (this.props.onDragStart !== undefined) {
                            this.props.onDragStart(e, this.getMoreProps());
                        }
                    }
                }
                break;
            }
            case "drag": {
                if (this.dragInProgress && this.props.onDrag) {
                    this.props.onDrag(e, this.getMoreProps());
                }
                break;
            }
            case "dragend": {
                if (this.dragInProgress && this.props.onDragComplete) {
                    this.props.onDragComplete(e, this.getMoreProps());
                }
                this.dragInProgress = false;
                break;
            }
            case "dragcancel": {
                if (this.dragInProgress || this.iSetTheCursorClass) {
                    const { setCursorClass } = this.context;
                    setCursorClass(null);
                }
                break;
            }
        }
    }

    public isHover(e: React.MouseEvent) {
        const { isHover } = this.props;
        if (isHover === undefined) {
            return false;
        }

        return isHover(this.getMoreProps(), e);
    }

    public getPanConditions() {
        const draggable =
            !!(this.props.selected && this.moreProps.hovering) ||
            (this.props.enableDragOnHover && this.moreProps.hovering);

        return {
            draggable,
            panEnabled: !this.props.disablePan,
        };
    }

    public draw({ trigger, force = false }: { force: boolean; trigger: string }) {
        const type = aliases[trigger] || trigger;
        const proceed = this.props.drawOn.indexOf(type) > -1;

        if (proceed || this.props.selected /* this is to draw as soon as you select */ || force) {
            const { canvasDraw } = this.props;
            if (canvasDraw === undefined) {
                const { updateCount } = this.state;
                this.setState({
                    updateCount: updateCount + 1,
                });
            } else {
                this.drawOnCanvas();
            }
        }
    }

    public componentWillUnmount() {
        const { unsubscribe } = this.context;
        unsubscribe(this.subscriberId);
        if (this.iSetTheCursorClass) {
            const { setCursorClass } = this.context;
            setCursorClass(null);
        }
    }

    public componentDidMount() {
        this.subscribeToCanvas();
        this.syncMorePropsWithContext();
        this.componentDidUpdate(this.props);
    }

    public componentDidUpdate(prevProps: GenericComponentProps) {
        this.syncMorePropsWithContext();
        const { canvasDraw, selected, interactiveCursorClass } = this.props;

        if (prevProps.selected !== selected) {
            const { setCursorClass } = this.context;
            if (selected && this.moreProps.hovering) {
                this.iSetTheCursorClass = true;
                setCursorClass(interactiveCursorClass);
            } else {
                this.iSetTheCursorClass = false;
                setCursorClass(null);
            }
        }
        if (canvasDraw !== undefined && !this.evaluationInProgress) {
            this.updateMoreProps(this.moreProps);
            this.drawOnCanvas();
        }
    }

    public getMoreProps() {
        const { xScale, plotData, chartConfigs, morePropsDecorator, xAccessor, displayXAccessor, width, height } =
            this.context;
        const { chartId, fullData, chartConfig: contextChartConfig } = this.context;

        const chartConfigsToUse = isDefined(this.moreProps.chartConfigs) ? this.moreProps.chartConfigs : chartConfigs;
        let currentChartConfig = this.moreProps.chartConfig ?? contextChartConfig;

        if (isDefined(chartConfigsToUse)) {
            currentChartConfig =
                chartConfigsToUse.find((each: ChartConfig) => each.id == chartId) ?? currentChartConfig;
        }

        const moreProps = {
            xScale,
            plotData,
            chartConfigs,
            xAccessor,
            displayXAccessor,
            width,
            height,
            chartId,
            fullData,
            ...this.moreProps,
            chartConfig: currentChartConfig,
        };

        return (morePropsDecorator || identity)(moreProps);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public preCanvasDraw(_ctx: CanvasRenderingContext2D, _moreProps: any) {
        // do nothing
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public postCanvasDraw(_ctx: CanvasRenderingContext2D, _moreProps: any) {
        // empty
    }

    public drawOnCanvas() {
        const { canvasDraw, canvasToDraw } = this.props;
        if (canvasDraw === undefined || canvasToDraw === undefined) {
            return;
        }

        const { getCanvasContexts } = this.context;

        const moreProps = this.getMoreProps();

        const contexts = getCanvasContexts!()!;

        const ctx = canvasToDraw(contexts);
        if (ctx !== undefined) {
            this.preCanvasDraw(ctx, moreProps);
            canvasDraw(ctx, moreProps);
            this.postCanvasDraw(ctx, moreProps);
        }
    }

    public render() {
        const { canvasDraw, clip, svgDraw } = this.props;
        if (canvasDraw !== undefined || svgDraw === undefined) {
            return null;
        }

        const { chartId } = this.context;

        const suffix = chartId !== undefined ? "-" + chartId : "";

        const style = clip ? { clipPath: `url(#chart-area-clip${suffix})` } : undefined;

        return <g style={style}>{svgDraw(this.getMoreProps())}</g>;
    }
}

GenericComponent.contextType = ChartCanvasContext;

export const getAxisCanvas = (contexts: ICanvasContexts) => {
    return contexts.axes;
};

export const getMouseCanvas = (contexts: ICanvasContexts) => {
    return contexts.mouseCoord;
};
