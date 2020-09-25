class CJ4_FMC_IdentPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        let model = SimVar.GetSimVarValue("ATC MODEL", "string", "FMC");
        if (!model) {
            model = "unkn.";
        }
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "IDENT[blue]"],
            [" MODEL[blue]", "ENGINES [blue]"],
            ["CJ4", "FJ44-4A"],
            [" NAV DATA[blue]", "ACTIVE [blue]"],
            ["N4VD4T4-42", "MAY4JUL4/20"],
            [" DRAG/FF[blue]"],
            [""],
            [" OP PROGRAM[blue]", "CO DATA [blue]"],
            ["AW-P010-0-0", "VS1001"],
            [" OPC[blue]"],
            ["AW-C010-0-0", ""],
            ["--------------------------[blue]"],
            ["<INDEX", "POS INIT>"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_IdentPage.js.map