class WT_MapViewPointerInfoLayer extends WT_MapViewLayer {
    constructor(className = WT_MapViewPointerInfoLayer.CLASS_DEFAULT, configName = WT_MapViewPointerInfoLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        let distanceFormatterOpts = {
            precision: 0.01,
            forceDecimalZeroes: false,
            maxDigits: 3,
            unitCaps: true
        };
        let distanceHTMLFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                getNumberClassList: this._getDistanceNumberClassList.bind(this),
                getUnitClassList: this._getDistanceUnitClassList.bind(this)
            }
        };
        this._distanceFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(distanceFormatterOpts), distanceHTMLFormatterOpts);

        let bearingFormatterOpts = {
            precision: 1
        };
        this._bearingFormatter = new WT_NumberFormatter(bearingFormatterOpts);

        this._coordinateFormatter = new WT_CoordinateFormatter();

        this._tempVector = new WT_GVector2(0, 0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0, 0);
        this._tempDistance = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._tempAngle = new WT_NumberUnit(0, WT_Unit.DEGREE);
    }

    _createHTMLElement() {
        this._infoBox = document.createElement("div");
        this._infoBox.style.position = "absolute";
        this._infoBox.style.overflow = "hidden";
        this._infoBox.style.transform = "rotate(0deg)";

        this._distanceCell = document.createElement("div");
        this._distanceCell.classList.add(WT_MapViewPointerInfoLayer.DISTANCE_CLASS);
        this._distanceTitle = document.createElement("div");
        this._distanceTitle.classList.add(WT_MapViewPointerInfoLayer.TITLE_CLASS);
        this._distanceTitle.innerHTML = "DIS";
        this._distanceValue = document.createElement("div");
        this._distanceValue.classList.add(WT_MapViewPointerInfoLayer.VALUE_CLASS);
        this._distanceCell.appendChild(this._distanceTitle);
        this._distanceCell.appendChild(this._distanceValue);

        this._bearingCell = document.createElement("div");
        this._bearingCell.classList.add(WT_MapViewPointerInfoLayer.BEARING_CLASS);
        this._bearingTitle = document.createElement("div");
        this._bearingTitle.classList.add(WT_MapViewPointerInfoLayer.TITLE_CLASS);
        this._bearingTitle.innerHTML = "BRG";
        this._bearingValue = document.createElement("div");
        this._bearingValue.classList.add(WT_MapViewPointerInfoLayer.VALUE_CLASS);
        this._bearingCell.appendChild(this._bearingTitle);
        this._bearingCell.appendChild(this._bearingValue);

        this._latCell = document.createElement("div");
        this._latCell.classList.add(WT_MapViewPointerInfoLayer.LAT_CLASS);
        this._longCell = document.createElement("div");
        this._longCell.classList.add(WT_MapViewPointerInfoLayer.LONG_CLASS);

        this._infoBox.appendChild(this._distanceCell);
        this._infoBox.appendChild(this._bearingCell);
        this._infoBox.appendChild(this._latCell);
        this._infoBox.appendChild(this._longCell);

        return this._infoBox;
    }

    _getDistanceNumberClassList() {
        return ["distanceNumber"];
    }

    _getDistanceUnitClassList() {
        return ["distanceUnit"];
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.pointer.show;
    }

    /**
     * @param {WT_MapViewState} state
     * @param {LatLong} reference
     * @param {LatLong} pointer
     */
    _updateDistance(state, reference, pointer) {
        let distance = state.projection.distance(reference, pointer, this._tempDistance);
        this._distanceValue.innerHTML = this._distanceFormatter.getFormattedHTML(distance);
    }

    /**
     * @param {WT_MapViewState} state
     * @param {LatLong} reference
     * @param {LatLong} pointer
     */
    _updateBearing(state, reference, pointer) {
        let bearing = this._tempAngle.set(state.projection.bearing(reference, pointer));
        this._bearingValue.innerHTML = this._bearingFormatter.getFormattedString(bearing);
    }

    /**
     * @param {WT_MapViewState} state
     * @param {LatLong} pointer
     */
    _updateLatLong(state, pointer) {
        let latSign = Math.sign(pointer.lat);
        let latPrefix = latSign < 0 ? "S" : "N";
        let lat = this._tempAngle.set(latSign * pointer.lat);
        let latText = latPrefix + this._coordinateFormatter.getFormattedString(lat);
        this._latCell.innerHTML = latText;

        let longSign = Math.sign(pointer.long);
        let longPrefix = longSign < 0 ? "W" : "E";
        let long = this._tempAngle.set(longSign * pointer.long);
        let longText = longPrefix + this._coordinateFormatter.getFormattedString(long);
        this._longCell.innerHTML = longText;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        let reference = state.model.pointer.measureReference;
        if (!reference) {
            reference = state.model.airplane.position;
        }
        let pointer = state.projection.invert(state.projection.relXYToAbsXY(state.model.pointer.position, this._tempVector), this._tempGeoPoint);
        this._updateDistance(state, reference, pointer);
        this._updateBearing(state, reference, pointer);
        this._updateLatLong(state, pointer);
    }
}
WT_MapViewPointerInfoLayer.CLASS_DEFAULT = "pointerInfoLayer";
WT_MapViewPointerInfoLayer.CONFIG_NAME_DEFAULT = "pointerInfo";
WT_MapViewPointerInfoLayer.DISTANCE_CLASS = "distance";
WT_MapViewPointerInfoLayer.BEARING_CLASS = "bearing";
WT_MapViewPointerInfoLayer.LAT_CLASS = "lat";
WT_MapViewPointerInfoLayer.LONG_CLASS = "long";
WT_MapViewPointerInfoLayer.TITLE_CLASS = "title";
WT_MapViewPointerInfoLayer.VALUE_CLASS = "value";