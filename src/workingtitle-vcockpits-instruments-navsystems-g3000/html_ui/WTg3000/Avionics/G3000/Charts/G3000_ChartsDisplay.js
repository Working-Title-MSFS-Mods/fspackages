class WT_G3000_ChartsDisplay extends WT_G3x5_ChartsDisplay {
    _getBacklightLevel() {
        return SimVar.GetSimVarValue("L:XMLVAR_AS3000_DisplayLighting", "number");
    }
}