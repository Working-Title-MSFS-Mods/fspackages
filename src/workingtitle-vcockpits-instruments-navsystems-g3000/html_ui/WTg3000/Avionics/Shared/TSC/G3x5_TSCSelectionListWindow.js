class WT_G3x5_TSCSelectionListWindow extends WT_TSCSelectionListWindow {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.back.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }

    onExit() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
        super.onExit();
    }

    back() {
        this.gps.goBack();
    }

    backHome() {
        this.gps.closePopUpElement();
        this.gps.SwitchToPageName(this.context.homePageGroup, this.context.homePageName);
    }
}