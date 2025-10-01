import { MoreProps } from "@reincharts/core";
import * as React from "react";
import { useState, useCallback, cloneElement, isValidElement, Children, useRef, useEffect } from "react";
import { InteractiveObjectSelector } from "./InteractiveObjectSelector";
import { getSelected } from "./utils";
import {
    DrawingIcon,
    EquidistantChannelIcon,
    FibonacciRetracementIcon,
    GannFanIcon,
    InteractiveTextIcon,
    InteractiveYCoordinateIcon,
    StandardDeviationChannelIcon,
    TrendLineIcon,
    SaveIcon,
    IconProps,
} from "./components/icons";

/**
 * Props interface for the InteractiveManager component
 */
export interface InteractiveManagerProps {
    /** React children containing chart components and interactive tools */
    children: React.ReactNode;
    /** Position of the interactive tools sidebar.
     *   Note that when sidebarPosition is "top" or "bottom", the sidebar will take up height of the chart area
     *   and it does not automatically resize the chart components to account for this. You will need to update
     *   the height and origin props of each Chart component to use a function to scale based on the
     *   ChartCanvas size.
     */
    sidebarPosition?: "left" | "right" | "top" | "bottom";
    /** Whether to show the sidebar with interactive tool buttons */
    showSidebar?: boolean;
    /** Height of the chart */
    height: number;
    /** Width of the chart */
    width: number;
    /** Callback fired when an interactive tool is toggled on/off */
    onInteractiveToggle?: (type: string, enabled: boolean) => void;
    /** Size of the sidebar (width for vertical, height for horizontal) */
    size?: number;
    /** Callback fired when the save button is clicked */
    onSave?: (data: string) => void;
    /** Initial states to render in the chart */
    initialStates?: Record<string, Array<any>>;
    /** Custom icons to be used in the toolbar. String key must be interactive
     *  component name and value must be react component
     */
    interactiveIcons?: Record<string, React.ElementType>;
}

/**
 * Configuration object for each detected interactive tool
 */
interface InteractiveToolConfig {
    /** Name/type of the interactive component (e.g., "TrendLine") */
    type: string;
    /** React icon component to display in the sidebar button */
    icon: React.ElementType;
    /** Label for the tool that is displayed when hovering */
    label: string;
    /** Whether this tool is currently enabled/active */
    enabled: boolean;
}

/**
 * Mapping of interactive component names to their display icons
 * These are the React icon components from the icons package
 */
const INTERACTIVE_COMPONENTS: Record<string, React.ComponentType<IconProps>> = {
    TrendLine: TrendLineIcon,
    FibonacciRetracement: FibonacciRetracementIcon,
    EquidistantChannel: EquidistantChannelIcon,
    StandardDeviationChannel: StandardDeviationChannelIcon,
    GannFan: GannFanIcon,
    Drawing: DrawingIcon,
    InteractiveText: InteractiveTextIcon,
    InteractiveYCoordinate: InteractiveYCoordinateIcon,
    default: DrawingIcon,
};

/**
 * Mapping of interactive component names to their state prop names
 * These are the prop names used to pass the interactive state data to each component
 */
const INTERACTIVE_STATE_PROP_NAMES: Record<string, string> = {
    Drawing: "drawings",
    TrendLine: "trends",
    FibonacciRetracement: "retracements",
    InteractiveYCoordinate: "yCoordinateList",
    EquidistantChannel: "channels",
    StandardDeviationChannel: "channels",
    GannFan: "fans",
    InteractiveText: "textList",
};

type InteractiveNodeEntry = {
    type: string;
    chartId?: string | number;
    node: HTMLElement;
};

/**
 * InteractiveManager - A parent component that automatically manages interactive chart tools
 *
 * This component:
 * 1. Scans its children to find interactive components
 * 2. Renders a sidebar with toggle buttons for each found tool
 * 3. Manages which tool is currently active (only one at a time)
 * 4. Automatically injects the 'enabled' prop into interactive components
 * 5. Handles layout to prevent chart overflow when sidebar is present by adjusting chart dimensions
 * 6. Provides keyboard shortcuts: Delete/Backspace keys to remove the selected interactive item
 *
 * Usage Example:
 * ```tsx
 * <InteractiveManager
 *   width={800}
 *   height={600}
 *   sidebarPosition="left"
 *   showSidebar={true}
 * >
 *   <ChartCanvas width={800} height={600} {...otherProps}>
 *     <Chart id={1}>
 *       <CandlestickSeries />
 *       <TrendLine />
 *       <FibonacciRetracement />
 *     </Chart>
 *   </ChartCanvas>
 * </InteractiveManager>
 * ```
 *
 * The InteractiveManager will:
 * - Automatically resize Chart when sidebar is shown or hidden
 * - Show toggle buttons for TrendLine and FibonacciRetracement tools
 * - Automatically manage the state of interactive tools
 * - Allow deletion of the selected item via Delete/Backspace keys
 */
export const InteractiveManager: React.FC<InteractiveManagerProps> = ({
    children,
    sidebarPosition = "left",
    height,
    width,
    showSidebar,
    size = 54,
    onInteractiveToggle,
    onSave,
    initialStates = {},
    interactiveIcons = INTERACTIVE_COMPONENTS,
}) => {
    /**
     * State tracking which interactive tools are enabled
     * and the state for each
     */
    const [interactiveStatus, setInteractiveStatus] = useState<Record<string, boolean>>({});
    const [interactiveStates, setInteractiveStates] = useState<Record<string, Array<any>>>(initialStates);
    const [selectedItem, setSelectedItem] = useState<{ type: string; chartId: string | number; object: any } | null>(
        null,
    );

    // Sync internal state with external initialStates prop changes
    useEffect(() => {
        setInteractiveStates(initialStates);
    }, [initialStates]);

    // Ref for interactive nodes
    const interactiveNodesRef = useRef<Record<string, InteractiveNodeEntry>>({});

    // Track which tool button is hovered for hover styling
    const [hoveredTool, setHoveredTool] = useState<string | null>(null);
    // Track if save button is hovered
    const [saveButtonHovered, setSaveButtonHovered] = useState<boolean>(false);

    // Determine orientation
    const isHorizontal = sidebarPosition === "top" || sidebarPosition === "bottom";

    /**
     * Deletes the currently selected interactive item
     */
    const deleteSelectedItem = useCallback(() => {
        if (!selectedItem) {
            return;
        }

        setInteractiveStates((prev) => {
            const newStates = { ...prev };
            const { type, chartId, object } = selectedItem;
            const stateKey = `${type}_${chartId}`;
            const currentItems = newStates[stateKey] || [];

            // Filter out the selected object
            newStates[stateKey] = currentItems.filter((item) => {
                // Compare objects by id
                if (item.id && object.id) {
                    return item.id !== object.id;
                }
                // Fallback to reference comparison
                return item !== object;
            });

            return newStates;
        });

        // Clear selected item after deletion
        setSelectedItem(null);
    }, [selectedItem]);

    /**
     * Handles keyboard events for deleting selected items and deselecting on escape
     */
    useEffect(() => {
        const handleKeyUp = (event: KeyboardEvent) => {
            // Check if delete or backspace key is pressed
            if (event.key === "Delete" || event.key === "Backspace") {
                event.preventDefault();
                deleteSelectedItem();
            }
            // Check if escape key is pressed to deselect
            else if (event.key === "Escape") {
                event.preventDefault();
                // Clear selected item
                setSelectedItem(null);
                // Disable all interactive tools
                setInteractiveStatus((prev) => {
                    const newState: Record<string, boolean> = {};
                    Object.keys(prev).forEach((key) => {
                        newState[key] = false;
                        // Notify parent component of the state change
                        onInteractiveToggle?.(key, false);
                    });
                    return newState;
                });
            }
        };

        document.addEventListener("keyup", handleKeyUp);

        return () => {
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, [selectedItem, deleteSelectedItem, onInteractiveToggle]);

    /**
     * Determines if a component name corresponds to an interactive tool
     * @param componentName - Name of the React component to check
     * @returns true if this is a supported interactive component
     */
    const isInteractiveComponent = (componentName: string): boolean => {
        return Object.keys(INTERACTIVE_COMPONENTS).includes(componentName);
    };

    /**
     * Extracts the display name of a React component for identification purposes.
     * Handles memoized components, function/class components, and HTML elements.
     * @param child - The React element to extract the name from
     * @returns The display name or tag name of the component
     */
    function getComponentName(child: React.ReactElement): string {
        const componentType = child.type;
        if (typeof componentType === "string") {
            // HTML elements (div, span, etc.)
            return componentType;
        } else {
            // Functional or class components
            return (componentType as any).displayName || (componentType as any).name || "";
        }
    }

    /**
     * Recursively traverses the component tree to find all interactive components
     * Returns an array of InteractiveToolConfig objects for found tools
     */
    const findInteractiveComponents = useCallback(() => {
        const interactiveTools: InteractiveToolConfig[] = [];

        /**
         * Recursive function that walks through React children tree
         * @param children - React.ReactNode to traverse
         */
        const traverseChildren = (children: React.ReactNode) => {
            Children.forEach(children, (child) => {
                // Only process valid React elements
                if (isValidElement(child)) {
                    const componentName = getComponentName(child);

                    // Check if this component is an interactive tool
                    if (isInteractiveComponent(componentName)) {
                        // Only add tool once
                        const existingTool = interactiveTools.find((tool) => tool.type === componentName);
                        if (!existingTool) {
                            interactiveTools.push({
                                type: componentName,
                                icon: interactiveIcons[componentName] || interactiveIcons.default,
                                // Convert camelCase to spaced words
                                label: componentName.replace(/([A-Z])/g, " $1").trim(),
                                enabled: interactiveStatus[componentName] ?? false,
                            });
                        }
                    }

                    // Recursively process children
                    const childProps = child.props as any;
                    if (childProps && childProps.children) {
                        traverseChildren(childProps.children);
                    }
                }
            });
        };

        traverseChildren(children);
        return interactiveTools;
    }, [children, interactiveStatus, interactiveIcons]);

    // Get the list of interactive tools found in the component tree
    const interactiveTools = findInteractiveComponents();

    /**
     * Handles toggling an interactive tool on/off
     * Implements single-tool mode: only one tool can be active at a time
     * @param type - The component name/type to toggle
     */
    const toggleInteractive = useCallback(
        (type: string) => {
            setInteractiveStatus((prev) => {
                const newEnabled = !prev[type];
                const newState = {
                    ...prev,
                    [type]: newEnabled,
                };

                // Enforce single-tool mode: if enabling a tool, disable all others
                if (newEnabled) {
                    Object.keys(newState).forEach((key) => {
                        if (key !== type) {
                            newState[key] = false;
                        }
                    });
                }

                // Notify parent component of the state change
                onInteractiveToggle?.(type, newEnabled);
                return newState;
            });
        },
        [onInteractiveToggle],
    );

    /**
     * Handles selection event updates from the InteractiveObjectSelector.
     *
     * @param e - The selection event
     * @param interactives - Array of interactive objects with their selection state
     * @param moreProps - Additional properties from the chart context
     */
    const handleSelection = useCallback(
        (
            e: React.MouseEvent,
            interactives: Array<{ chartId: string | number; objects: Array<any>; type?: string }>,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            moreProps: any,
        ) => {
            // Convert the interactives array into state updates
            const stateUpdates: Record<string, Array<any>> = {};
            interactives.forEach((interactive) => {
                const { chartId, objects, type } = interactive;
                const stateKey = `${type}_${chartId}`;
                stateUpdates[stateKey] = objects;
            });

            // Apply all state updates at once
            if (Object.keys(stateUpdates).length > 0) {
                setInteractiveStates((prev) => ({
                    ...prev,
                    ...stateUpdates,
                }));
            }

            // Track selected item for deletion functionality
            const selected = getSelected(interactives);
            if (selected.length > 0 && selected[0].objects.length > 0) {
                const selectedGroup = selected[0];
                setSelectedItem({
                    type: selectedGroup.type,
                    chartId: selectedGroup.chartId,
                    object: selectedGroup.objects[0],
                });
            } else {
                setSelectedItem(null);
            }
        },
        [],
    );

    /**
     * Function that stores refs to interactive components
     * This is to keep track of all interactive nodes for selection and interaction
     *
     * @param type - The type of the interactive component
     * @param chartId - Chart ID of the interactive component
     * @returns A ref callback function that accepts a DOM node
     */
    const getRef = (type: string, chartId?: string | number) => {
        const key = `${type}_${chartId}`;
        return (node: HTMLElement) => {
            if (node) {
                interactiveNodesRef.current[key] = { type, chartId, node };
            } else {
                // If node is null, it means the element is being unmounted
                delete interactiveNodesRef.current[key];
            }
        };
    };

    /**
     * Creates enhanced versions of children with injected 'enabled' props and adjusted dimensions
     * This is the core functionality that automatically manages interactive tool states and layout
     */
    const enhancedChildren = useCallback(() => {
        // Calculate available space for chart when sidebar is visible
        const minSidebarSize = Math.max(size, 48); // Ensure minimum 52px for 24px icons + padding + borders
        const sidebarWidth = showSidebar && interactiveTools.length > 0 ? minSidebarSize : 0;
        const sidebarHeight = showSidebar && interactiveTools.length > 0 ? minSidebarSize : 0;

        const chartWidth = isHorizontal ? width : width - sidebarWidth;
        const chartHeight = isHorizontal ? height - sidebarHeight : height;

        /**
         * Recursively processes children and injects props where needed
         * @param children - React children to enhance
         * @param parentChartId - The id of the parent Chart component, if any
         * @returns Enhanced React children with injected props
         */
        const enhanceChildren = (children: React.ReactNode, parentChartId?: number | string): React.ReactNode => {
            return Children.map(children, (child) => {
                if (isValidElement(child)) {
                    const componentName = getComponentName(child);

                    // If this is a Chart component, extract its id prop and use it as current chart ID
                    let currentChartId = parentChartId;
                    if (componentName === "Chart" && child.props) {
                        currentChartId = (child.props as any).id;
                    }

                    // If this is an interactive component, inject the enabled prop and state
                    if (isInteractiveComponent(componentName)) {
                        const isEnabled = interactiveStatus[componentName] ?? false;
                        // Wrap onComplete to capture state updates from the interactive component
                        const onComplete = (e: Event, newState: Array<any>, moreProps: MoreProps) => {
                            const id = moreProps.chartConfig?.id;
                            const key = `${componentName}_${id}`;
                            setInteractiveStates((prev) => ({
                                ...prev,
                                [key]: newState,
                            }));
                            setInteractiveStatus((prev) => {
                                const newState = {
                                    ...prev,
                                    [componentName]: false,
                                };

                                // Notify parent component of the state change
                                onInteractiveToggle?.(componentName, false);
                                return newState;
                            });
                        };

                        // Get the state prop name for this interactive component
                        const statePropName = INTERACTIVE_STATE_PROP_NAMES[componentName];
                        const stateKey = `${componentName}_${currentChartId}`;

                        const enhancedProps: any = {
                            ...(child.props as any),
                            enabled: isEnabled, // Override the enabled prop with our managed state
                            onComplete: onComplete,
                            ref: getRef(componentName, currentChartId),
                        };

                        // Only inject the state prop if we have a mapping for this component
                        if (statePropName) {
                            enhancedProps[statePropName] = interactiveStates[stateKey] ?? [];
                        }

                        return cloneElement(child, enhancedProps);
                    }

                    // For non-interactive components, recursively process their children
                    const childProps = child.props as any;
                    const enhancedProps: any = { ...childProps };

                    // If this is the ChartCanvas component adjust its width/height based on sidebar
                    if (componentName === "ChartCanvas") {
                        enhancedProps.width = chartWidth;
                        enhancedProps.height = chartHeight;
                    }

                    if (enhancedProps && enhancedProps.children) {
                        // Process existing children
                        const processedChildren = enhanceChildren(enhancedProps.children, currentChartId);
                        // If this is the ChartCanvas, append the InteractiveObjectSelector at the end of children
                        const childrenWithSelector =
                            componentName === "ChartCanvas"
                                ? [
                                      processedChildren,
                                      React.createElement(InteractiveObjectSelector, {
                                          key: "InteractiveObjectSelector",
                                          getInteractiveNodes: () => interactiveNodesRef.current,
                                          enabled: true,
                                          onSelect: handleSelection,
                                      }),
                                  ]
                                : processedChildren;
                        return cloneElement(child, {
                            ...enhancedProps,
                            children: childrenWithSelector,
                        } as any);
                    }
                }
                return child;
            });
        };

        return enhanceChildren(children);
    }, [
        children,
        interactiveStatus,
        interactiveStates,
        width,
        height,
        showSidebar,
        size,
        sidebarPosition,
        interactiveTools,
        getRef,
        handleSelection,
        onInteractiveToggle,
    ]);

    // Calculate minimum sidebar size to accommodate icons properly
    const minSidebarSize = Math.max(size, 48); // Ensure minimum 52px for 24px icons + padding + borders

    // Sidebar styling - add very small rounded light grey border on chart-facing side
    const sidebarStyle: React.CSSProperties = {
        backgroundColor: "white",
        padding: "8px",
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        gap: "8px",
        flexShrink: 0,
        boxSizing: "border-box",
        width: isHorizontal ? width : interactiveTools.length > 0 ? minSidebarSize : 0,
        height: isHorizontal ? (interactiveTools.length > 0 ? minSidebarSize : 0) : height,
        // Add border on chart-facing side only with extra padding
        ...(sidebarPosition === "left" && {
            borderRight: "3px solid #eaeaea",
            paddingRight: "12px",
        }),
        ...(sidebarPosition === "right" && {
            borderLeft: "3px solid #eaeaea",
            paddingLeft: "12px",
        }),
        ...(sidebarPosition === "top" && {
            borderBottom: "3px solid #eaeaea",
            paddingBottom: "12px",
        }),
        ...(sidebarPosition === "bottom" && {
            borderTop: "3px solid #eaeaea",
            paddingTop: "12px",
        }),
    };

    // Button styling with hover effects
    const buttonStyle: React.CSSProperties = {
        border: "none",
        borderRadius: "5px",
        padding: "4px", // Reduced padding for smaller background effect
        backgroundColor: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "36px", // Reduced to make background smaller
        minHeight: "36px", // Reduced to make background smaller
        transition: "all 0.1s ease",
        color: "#000000",
    };

    const activeButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        color: "#0e0f0fff",
        // Give active button a visible background to indicate enabled state
        backgroundColor: "#eaeaea",
    };
    // Style for hover state on inactive buttons
    const hoverButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        backgroundColor: "#eaeaea",
    };

    // Flex container for chart + sidebar
    const containerStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: isHorizontal ? "column" : "row",
        alignItems: "flex-start",
    };

    // Render the sidebar
    const renderSidebar = () => {
        if (!showSidebar || interactiveTools.length === 0) {
            return null;
        }

        return (
            <div style={sidebarStyle}>
                {interactiveTools.map((tool) => {
                    const IconComponent = tool.icon;
                    return (
                        <button
                            key={tool.type}
                            style={
                                tool.enabled
                                    ? activeButtonStyle
                                    : hoveredTool === tool.type
                                      ? hoverButtonStyle
                                      : buttonStyle
                            }
                            onClick={() => toggleInteractive(tool.type)}
                            title={`Toggle ${tool.label}`}
                            onMouseEnter={() => setHoveredTool(tool.type)}
                            onMouseLeave={() => setHoveredTool(null)}
                        >
                            <IconComponent />
                        </button>
                    );
                })}
                {onSave && (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            justifyContent: isHorizontal ? "flex-end" : "flex-start",
                            alignItems: isHorizontal ? "center" : "flex-end",
                        }}
                    >
                        <button
                            style={saveButtonHovered ? hoverButtonStyle : buttonStyle}
                            onClick={() => {
                                onSave(JSON.stringify(interactiveStates));
                            }}
                            title="Save"
                            onMouseEnter={() => setSaveButtonHovered(true)}
                            onMouseLeave={() => setSaveButtonHovered(false)}
                        >
                            <SaveIcon />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={containerStyle}>
            {(sidebarPosition === "left" || sidebarPosition === "top") && renderSidebar()}
            <div>{enhancedChildren()}</div>
            {(sidebarPosition === "right" || sidebarPosition === "bottom") && renderSidebar()}
        </div>
    );
};
