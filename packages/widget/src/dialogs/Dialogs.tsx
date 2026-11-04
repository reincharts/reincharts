import { useWidget } from "../context";
import { IndicatorsDialog } from "./IndicatorsDialog";
import { IndicatorSettingsDialog } from "./IndicatorSettingsDialog";
import { SettingsDialog } from "./SettingsDialog";
import { SymbolSearchDialog } from "./SymbolSearchDialog";

/** Renders the open dialog. */
export function Dialogs() {
    const { dialog, openDialog } = useWidget();
    const close = () => openDialog(null);
    switch (dialog?.kind) {
        case "symbol":
            return <SymbolSearchDialog mode="symbol" cell={dialog.cell} onClose={close} />;
        case "compare":
            return <SymbolSearchDialog mode="compare" onClose={close} />;
        case "indicators":
            return <IndicatorsDialog onClose={close} />;
        case "indicatorSettings":
            return <IndicatorSettingsDialog key={dialog.id} id={dialog.id} onClose={close} />;
        case "settings":
            return <SettingsDialog onClose={close} />;
        default:
            return null;
    }
}
