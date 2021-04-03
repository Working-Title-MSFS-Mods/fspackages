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

    _createTrafficMapSettingsPage(homePageGroup, homePageName, instrumentID, halfPaneID) {
        return new WT_G3000_TSCTrafficMapSettings(homePageGroup, homePageName, WT_G3x5_TrafficSystem.ID, instrumentID, halfPaneID);
    }

    _createNavMapTrafficSettingsPage(homePageGroup, homePageName, instrumentID, halfPaneID) {
        return new WT_G3000_TSCNavMapTrafficSettings(homePageGroup, homePageName, WT_G3x5_TrafficSystem.ID, instrumentID, halfPaneID);
    }
}
registerInstrument("as3000-tsc-horizontal-element", AS3000_TSC_Horizontal);
//# sourceMappingURL=AS3000_TSC_Horizontal.js.map