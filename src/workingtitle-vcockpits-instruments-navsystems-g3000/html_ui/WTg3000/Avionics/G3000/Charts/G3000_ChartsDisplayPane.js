class WT_G3000_ChartsDisplayPane extends WT_G3x5_ChartsDisplayPane {
    _getBacklightLevel() {
        return SimVar.GetSimVarValue("L:XMLVAR_AS3000_DisplayLighting", "number");
    }
}