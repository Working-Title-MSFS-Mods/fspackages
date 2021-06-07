class WT_G3x5_TrafficMapDisplayPane extends WT_G3x5_DisplayPane {
    constructor(paneID, paneSettings, trafficMap) {
        super(paneID, paneSettings);

        this._trafficMap = trafficMap;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TrafficMap}
     */
    get trafficMap() {
        return this._trafficMap;
    }

    getTitle() {
        return "Traffic Map";
    }

    init(root) {
        this.trafficMap.init(root);
    }

    update() {
        this.trafficMap.update();
    }
}