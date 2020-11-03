/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class CJ4_FMC_IdentPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        let model = SimVar.GetSimVarValue("ATC MODEL", "string", "FMC");
        if (!model) {
            model = "unkn.";
        }
        let date = fmc.getNavDataDateRange();
        fmc.setTemplate([
            ["IDENT"],
            ["MODEL", "ENGINES"],
            ["CJ4", "FJ44-1A"],
            ["NAV DATA", "ACTIVE"],
            ["AIRAC", date.toString()],
            ["DRAG/FF"],
            [""],
            ["OP PROGRAM", "CO DATA"],
            ["AW-P010-0-0", "VS1001"],
            ["OPC"],
            ["AW-C010-0-0", ""],
            ["-------------------------"],
            ["<INDEX", "POS INIT>"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_IdentPage.js.map