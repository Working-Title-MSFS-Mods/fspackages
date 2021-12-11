class AS3000_TSC_Horizontal extends AS3000_TSC {
    get templateID() { return "AS3000_TSC_Horizontal"; }

    _defineLabelBar() {
        this.topKnobText = this.getChildById("SoftKey_1");
        this.bottomKnobText = this.getChildById("SoftKey_5");
    }

    _createTransponderPopUp() {
        return new AS3000_TSC_Transponder();
    }

    connectedCallback() {
        super.connectedCallback();

        this._defineLabelBar();
    }

    parseXMLConfig() {
        super.parseXMLConfig();
        this.SwitchToMenuName("PFD");
    }

    _createSpeedBugsPage() {
        return new WT_G3000_TSCSpeedBugs("PFD");
    }

    _createPFDSettingsPage() {
        return new WT_G3000_TSCPFDSettings("PFD", "PFD Home", "PFD");
    }

    _createTrafficMapSettingsPage(homePageGroup, homePageName) {
        return new WT_G3000_TSCTrafficMapSettings(homePageGroup, homePageName, WT_G3x5_TrafficSystem.ID);
    }

    _createNavMapTrafficSettingsPage(homePageGroup, homePageName, mapSettings) {
        return new WT_G3000_TSCNavMapTrafficSettings(homePageGroup, homePageName, WT_G3x5_TrafficSystem.ID, mapSettings);
    }

    _createAircraftSystemsPage() {
        return new WT_G3000_TSCAircraftSystems("MFD", "MFD Home");
    }

    _createChartsLightThresholdPopUp() {
        return new WT_G3x5_TSCChartsLightThreshold(() => WTDataStore.get(AS3000_TSC_LightingConfig.VARNAME_DISPLAY_LIGHTING, 1));
    }

    _initPaneControlSettings() {
        this.getPaneSettings(`MFD-${WT_G3x5_MFDHalfPane.ID.LEFT}`).control.setValue(WT_G3x5_PaneControlSetting.Touchscreen.LEFT | WT_G3x5_PaneControlSetting.Touchscreen.RIGHT);
        this.getPaneSettings(`MFD-${WT_G3x5_MFDHalfPane.ID.RIGHT}`).control.setValue(0);
    }

    _initPaneControl() {
        this._setSelectedMFDHalfPane(WT_G3x5_MFDHalfPane.ID.LEFT);
    }
}
registerInstrument("as3000-tsc-horizontal-element", AS3000_TSC_Horizontal);
//# sourceMappingURL=AS3000_TSC_Horizontal.js.map