class CJ4_FMC_MfdAdvPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" LEFT DISPLAY ADVANCE[blue]"],
            [" ACT PLAN MAP CENTER[s-text blue]"],
            ["<PREV WPT"],
            [""],
            ["<NEXT WPT"],
            [""],
            ["<TO WPT"],
            // [" CTR WPT[s-text blue]"],
            // ["<-----"],
            [""],
            [""],
            [""],
            [""],
            ["", "SIDE [s-text blue]"],
            ["", "L[green]/[white]R[s-text]>"]
        ]);
        fmc.updateSideButtonActiveStatus();

        fmc.onLeftInput[0] = () => {
            let wpindex = SimVar.GetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number");
            let newIndex = Math.max(0, wpindex - 1);
            SimVar.SetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number", newIndex);
        };

        fmc.onLeftInput[1] = () => {
            let wpindex = SimVar.GetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number");
            let newIndex = Math.min(wpindex + 1, fmc.flightPlanManager.getWaypointsCount()-1);
            SimVar.SetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number", newIndex);
        };

        fmc.onLeftInput[2] = () => {
            let newIndex = fmc.flightPlanManager.getActiveWaypointIndex();
            SimVar.SetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number", newIndex);
        };
    }
    static ShowPage2(fmc) {
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" LEFT DISPLAY ADVANCE[blue]"],
            ["    TEXT DISPLAY[s-text blue]"],
            ["<PREV PAGE"],
            [""],
            ["<NEXT PAGE"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["", "SIDE [s-text blue]"],
            ["", "L[green]/[white]R[s-text]>"]
        ]);
        fmc.updateSideButtonActiveStatus();
    }
}
