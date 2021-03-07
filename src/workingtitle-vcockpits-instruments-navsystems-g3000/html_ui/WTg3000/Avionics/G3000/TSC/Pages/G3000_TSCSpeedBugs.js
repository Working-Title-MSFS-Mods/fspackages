class WT_G3000_TSCSpeedBugs extends WT_G3x5_TSCSpeedBugs {
    _createSpeedBugCollection() {
        let collection = new WT_SpeedBugCollection(this._speedBugID);
        collection.addBug("r", this.instrument.airplane.references.Vr);
        collection.addBug("x", this.instrument.airplane.references.Vx);
        collection.addBug("y", this.instrument.airplane.references.Vy);
        collection.addBug("app", this.instrument.airplane.references.Vapp);
        return collection;
    }

    _createTabDefinitions() {
        return [
            {
                title: "General",
                speedBugs: [
                    this.speedBugCollection.getBug("r"),
                    this.speedBugCollection.getBug("x"),
                    this.speedBugCollection.getBug("y"),
                    this.speedBugCollection.getBug("app"),
                ]
            }
        ];
    }
}