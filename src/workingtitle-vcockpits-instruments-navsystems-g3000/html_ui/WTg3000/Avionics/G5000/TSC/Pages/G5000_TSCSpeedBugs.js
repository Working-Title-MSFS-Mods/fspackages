class WT_G5000_TSCSpeedBugs extends WT_G3x5_TSCSpeedBugs {
    _createSpeedBugCollection() {
        let collection = new WT_SpeedBugCollection(this._speedBugID);
        collection.addBug("1", this.instrument.airplane.references.V1);
        collection.addBug("r", this.instrument.airplane.references.Vr);
        collection.addBug("2", this.instrument.airplane.references.V2);
        collection.addBug("fto", this.instrument.airplane.references.Vfto);
        collection.addBug("ref", this.instrument.airplane.references.Vref);
        collection.addBug("app", this.instrument.airplane.references.Vapp);
        return collection;
    }

    _createTabDefinitions() {
        return [
            {
                title: "Takeoff",
                speedBugs: [
                    this.speedBugCollection.getBug("1"),
                    this.speedBugCollection.getBug("r"),
                    this.speedBugCollection.getBug("2"),
                    this.speedBugCollection.getBug("fto"),
                ]
            },
            {
                title: "Landing",
                speedBugs: [
                    this.speedBugCollection.getBug("app"),
                    this.speedBugCollection.getBug("ref"),
                ]
            }
        ];
    }

    _autoSelectTab() {
        let lastPageName = this.instrument.history[this.instrument.history.length - 1].pageName;
        if (lastPageName == "PFD Home" || lastPageName == "MFD Home") {
            if (this.instrument.airplane.dynamics.isOnGround()) {
                this.htmlElement.selectTab(WT_G5000_TSCSpeedBugs.TabIndex.TAKEOFF);
            } else {
                this.htmlElement.selectTab(WT_G5000_TSCSpeedBugs.TabIndex.LANDING);
            }
        }
    }

    onEnter() {
        super.onEnter();

        this._autoSelectTab();
    }
}
/**
 * @enum {Number}
 */
WT_G5000_TSCSpeedBugs.TabIndex = {
    TAKEOFF: 0,
    LANDING: 1
}