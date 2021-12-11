class WT_G3x5_FlightPlanDisplayFlightPlanSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_FlightPlanDisplayFlightPlanSetting.DEFAULT_VALUE, key = WT_G3x5_FlightPlanDisplayFlightPlanSetting.KEY) {
        super(model, key, defaultValue, true, false);

        this.update();
    }

    /**
     * The source of the displayed flight plan.
     * @readonly
     * @type {WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source}
     */
    get source() {
        return this._source;
    }

    /**
     * The index of the displayed flight plan. Only used if the flight plan source is CATALOG.
     * @readonly
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    /**
     * The index of the first focused leg, or NaN if there is no focused leg(s). The special values of -1 and -2
     * indicate the origin and destination legs, respectively.
     * @readonly
     * @type {Number}
     */
    get focusLegStartIndex() {
        return this._focusLegStartIndex;
    }

    /**
     * The index of the last focused leg, or NaN if there is no focused leg(s). The special values of -1 and -2
     * indicate the origin and destination legs, respectively.
     * @readonly
     * @type {Number}
     */
    get focusLegEndIndex() {
        return this._focusLegEndIndex;
    }

    /**
     *
     * @param {WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source} source
     * @param {Number} [index]
     * @param {WT_FlightPlanElement} [focusElement]
     */
    _serialize(source, index, focusElement) {
        if (source !== WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.CATALOG || index === undefined) {
            index = -1;
        }
        let focusLegStartIndex;
        let focusLegEndIndex;
        if (!focusElement || !focusElement.flightPlan) {
            focusLegStartIndex = undefined;
            focusLegEndIndex = undefined;
        } else {
            // origin/dest legs aren't always included in the flight plan primary legs sequence, so we need to handle
            // those as special cases
            if (focusElement.segment === WT_FlightPlan.Segment.ORIGIN) {
                focusLegStartIndex = -1;
                focusLegEndIndex = -1;
            } else if (focusElement.segment === WT_FlightPlan.Segment.DESTINATION) {
                focusLegStartIndex = -2;
                focusLegEndIndex = -2;
            } else {
                focusLegStartIndex = Math.max(0, focusElement.legs.first().index - 1); // include the previous leg to make sure the entirety of the first focused leg is shown
                focusLegEndIndex = focusElement.legs.last().index;
            }
        }

        return JSON.stringify({
            source: source,
            index: index,
            focusLegStartIndex: focusLegStartIndex,
            focusLegEndIndex: focusLegEndIndex
        });
    }

    /**
     *
     * @param {WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source} source
     * @param {Number} [index]
     * @param {WT_FlightPlanElement} [focusElement]
     */
    setFlightPlan(source, index, focusElement) {
        let value = this._serialize(source, index, focusElement);
        this.setValue(value);
    }

    /**
     *
     * @param {String} value
     */
    _parseValue(value) {
        try {
            let json = JSON.parse(value);
            this._source = json.source;
            this._index = json.index;
            this._focusLegStartIndex = json.focusLegStartIndex;
            this._focusLegEndIndex = json.focusLegEndIndex;
        } catch (e) {
        }
    }

    update() {
        let value = this.getValue();
        this._parseValue(value);
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source = {
    ACTIVE: 0,
    STANDBY: 1,
    CATALOG: 2
};
WT_G3x5_FlightPlanDisplayFlightPlanSetting.KEY = "WT_FlightPlanDisplay_FlightPlan";
WT_G3x5_FlightPlanDisplayFlightPlanSetting.DEFAULT_VALUE = JSON.stringify({
    source: WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.ACTIVE,
    index: -1,
    focusLegStartIndex: undefined,
    focusLegEndIndex: undefined
});