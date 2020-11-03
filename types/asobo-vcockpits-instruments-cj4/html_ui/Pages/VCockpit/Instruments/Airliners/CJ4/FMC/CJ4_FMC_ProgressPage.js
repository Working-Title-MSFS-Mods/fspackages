/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class CJ4_FMC_ProgressPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc.setTemplate([
            ["PROGRESS", "1", "3"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ]);
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_ProgressPage.js.map