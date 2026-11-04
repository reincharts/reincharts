import { CHART_TYPES, chartTypeInfo } from "../chartTypes";
import { useWidget } from "../context";
import { chartTypeIcon, Icon } from "../icons";
import { Dropdown, MenuDivider, MenuItem } from "./Menu";

/** Chart type dropdown (icon button). */
export function ChartTypeMenu() {
    const { state, dispatch } = useWidget();
    const current = chartTypeInfo(state.chartType);
    return (
        <Dropdown title={`Chart type: ${current.label}`} label={<Icon name={chartTypeIcon[current.id]} />}>
            {(close) =>
                CHART_TYPES.map((t, k) => (
                    <div key={t.id} role="none">
                        {k > 0 && CHART_TYPES[k - 1].group !== t.group && <MenuDivider />}
                        <MenuItem
                            icon={chartTypeIcon[t.id]}
                            label={t.label}
                            active={t.id === state.chartType}
                            onClick={() => {
                                dispatch({ type: "chartType", chartType: t.id });
                                close();
                            }}
                        />
                    </div>
                ))
            }
        </Dropdown>
    );
}
