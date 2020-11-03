/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class CJ4_FMC_ThrustLimPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc.setTemplate([
            ["THRUST LIM"],
            ["SEL", "TO EPR", "OAT"],
            [""],
            [""],
            ["<TO", "<CLB", "<SEL>", "<ARM>"],
            ["TO 1"],
            ["", "<CLB 1"],
            ["TO 2"],
            ["", "<CLB 2"],
            [""],
            [""],
            ["-------------------------"],
            ["<INDEX", "<TAKEOFF"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_ThrustLimPage.js.map