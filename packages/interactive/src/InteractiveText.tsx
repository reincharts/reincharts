import * as React from "react";
import { flushSync } from "react-dom";
import { ChartContext, isDefined, MoreProps, noop } from "@reincharts/core";
import { HoverTextNearMouse, MouseLocationIndicator } from "./components";
import { generateID, getValueFromOverride, isHoverForInteractiveType, saveNodeType, terminate } from "./utils";
import { EachText } from "./wrapper";

export interface InteractiveTextProps {
    /** Called when drag is complete */
    readonly onDragComplete?: (e: React.MouseEvent, newTextList: any[], moreProps: any) => void;
    /** Callback function triggered when text creation is completed. newTextList is a
     *  list of all text elements with the new/updated text included.
     */
    readonly onComplete?: (e: React.MouseEvent, newTextList: any[], moreProps: any) => void;
    /** Callback function triggered when the text list changes. */
    readonly onChange?: (newTextList: any[], moreProps: any) => void;
    /** Double click event handler. */
    readonly onDoubleClick?: (e: React.MouseEvent, moreProps: any) => void;
    /** Default styling configuration for new text elements. */
    readonly defaultText: {
        readonly bgFill: string;
        readonly bgStrokeWidth?: number;
        readonly bgStroke?: string;
        readonly textFill: string;
        readonly fontFamily: string;
        readonly fontWeight: string;
        readonly fontStyle: string;
        readonly fontSize: number;
        readonly text: string;
    };
    /** Stroke color for the current position indicator. */
    readonly currentPositionStroke?: string;
    /** Width of the current position indicator stroke. */
    readonly currentPositionStrokeWidth?: number;
    /** Opacity of the current position indicator. */
    readonly currentPositionOpacity?: number;
    /** Radius of the current position indicator. */
    readonly currentPositionRadius?: number;
    /** Configuration for hover text display. */
    readonly hoverText: object;
    /** Array of text objects that get drawn. */
    readonly textList: any[];
    /** Whether the interactive text tool is enabled. */
    readonly enabled: boolean;
}

interface InteractiveTextState {
    current?: any;
    override?: any;
}

export class InteractiveText extends React.Component<InteractiveTextProps, InteractiveTextState> {
    public static displayName = "InteractiveText";

    public static defaultProps = {
        enabled: true,
        onComplete: noop,
        defaultText: {
            bgFill: "#D3D3D3",
            bgStrokeWidth: 1,
            textFill: "#F10040",
            fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
            fontSize: 12,
            fontStyle: "normal",
            fontWeight: "normal",
            text: "Enter Text...",
        },
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click to select object",
        },
        currentPositionStroke: "black",
        currentPositionOpacity: 1,
        currentPositionStrokeWidth: 3,
        currentPositionRadius: 4,
        textList: [],
    };

    public static contextType = ChartContext;
    declare public context: React.ContextType<typeof ChartContext>;

    // @ts-ignore
    private getSelectionState: any;
    private saveNodeType: any;

    // @ts-ignore
    private terminate: any;

    public constructor(props: InteractiveTextProps) {
        super(props);

        this.terminate = terminate.bind(this);
        this.saveNodeType = saveNodeType.bind(this);
        this.getSelectionState = isHoverForInteractiveType("textList").bind(this);

        this.state = {};
    }

    public render() {
        const {
            textList,
            defaultText,
            hoverText,
            currentPositionOpacity,
            currentPositionRadius = InteractiveText.defaultProps.currentPositionRadius,
            currentPositionStroke,
            currentPositionStrokeWidth,
            onDoubleClick,
            enabled,
        } = this.props;

        const { override } = this.state;

        return (
            <g>
                {textList.map((each, idx) => {
                    const defaultHoverText = InteractiveText.defaultProps.hoverText;
                    const props = {
                        ...defaultText,
                        ...each,
                        hoverText: {
                            ...defaultHoverText,
                            ...hoverText,
                            ...(each.hoverText || {}),
                        },
                    };
                    return (
                        <EachText
                            key={idx}
                            ref={this.saveNodeType(idx)}
                            index={idx}
                            {...props}
                            selected={each.selected}
                            position={getValueFromOverride(override, idx, "position", each.position)}
                            onDrag={this.handleDrag}
                            onDragComplete={this.handleDragComplete}
                            onChange={this.handleChange}
                            onDoubleClick={onDoubleClick}
                            edgeInteractiveCursor="reincharts-move-cursor"
                        />
                    );
                })}
                <MouseLocationIndicator
                    enabled={enabled}
                    snap={false}
                    snapX={false}
                    r={currentPositionRadius}
                    stroke={currentPositionStroke}
                    opacity={currentPositionOpacity}
                    strokeWidth={currentPositionStrokeWidth}
                    //onMouseDown={this.handleStart}
                    onClick={this.handlePlace}
                />
                ;
            </g>
        );
    }

    private readonly handlePlace = (e: React.MouseEvent, xyValue: number[], moreProps: MoreProps) => {
        const { enabled } = this.props;
        if (enabled) {
            const { currentCharts } = moreProps;
            const { chartId } = this.context;

            if (currentCharts.indexOf(chartId) > -1) {
                const { defaultText, onComplete, textList } = this.props;

                const newText = {
                    ...defaultText,
                    position: xyValue,
                    id: generateID(),
                    selected: true,
                };
                const newTextList = [...textList.map((d) => ({ ...d, selected: false })), newText];

                if (onComplete !== undefined) {
                    onComplete(e, newTextList, moreProps);
                }
            }
        }
    };

    private readonly handleDragComplete = (e: React.MouseEvent, moreProps: MoreProps) => {
        const { override } = this.state;
        if (isDefined(override)) {
            const { textList } = this.props;
            const newTextList = textList.map((each, idx) => {
                const selected = idx === override.index;
                return selected
                    ? {
                          ...each,
                          position: override.position,
                          selected,
                      }
                    : {
                          ...each,
                          selected,
                      };
            });
            this.setState(
                {
                    override: null,
                },
                () => {
                    const { onComplete } = this.props;
                    if (onComplete !== undefined) {
                        onComplete(e, newTextList, moreProps);
                    }
                },
            );
        }
    };

    private readonly handleChange = (newText: string, moreProps: MoreProps, index: number) => {
        const { textList } = this.props;

        const newTextList = textList.map((each, idx) => (idx === index ? { ...each, text: newText } : each));

        const { onChange } = this.props;
        if (onChange !== undefined) {
            onChange(newTextList, moreProps);
        } else {
            // Pass a dummy React.MouseEvent to satisfy the type
            const { onComplete } = this.props;
            if (onComplete !== undefined) {
                onComplete({} as React.MouseEvent, newTextList, moreProps);
            }
        }
    };

    private readonly handleDrag = (_: React.MouseEvent, index: number, position: any) => {
        flushSync(() => {
            this.setState({
                override: {
                    index,
                    position,
                },
            });
        });
    };
}
