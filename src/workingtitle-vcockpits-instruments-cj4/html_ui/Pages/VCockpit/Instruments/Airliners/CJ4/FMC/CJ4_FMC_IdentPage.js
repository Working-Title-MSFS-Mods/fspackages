class CJ4_FMC_IdentPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        let model = SimVar.GetSimVarValue("ATC MODEL", "string", "FMC");
        if (!model) {
            model = "unkn.";
        }
        fmc.setTemplate([
            ["IDENT"],
            ["MODEL", "ENGINES"],
            ["CJ4", "FJ44-4A"],
            ["NAV DATA", "ACTIVE"],
            ["N4VD4T4-42", "MAY4JUL4/20"],
            ["DRAG/FF"],
            [""],
            ["OP PROGRAM", "CO DATA"],
            ["AW-P010-0-0", "VS1001"],
            ["OPC"],
            ["AW-C010-0-0", ""],
            ["--------------------------"],
            ["<INDEX", "POS INIT>"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_IdentPage.js.map