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
            ["--------------------------------------"],
            ["<INDEX", "<TAKEOFF"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_TakeOffRefPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_ThrustLimPage.js.map