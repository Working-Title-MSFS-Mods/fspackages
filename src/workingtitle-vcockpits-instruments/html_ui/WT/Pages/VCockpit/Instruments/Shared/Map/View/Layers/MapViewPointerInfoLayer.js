class WT_MapViewPointerInfoLayer extends WT_MapViewLayer {
    constructor(className = WT_MapViewPointerInfoLayer.CLASS_DEFAULT, configName = WT_MapViewPointerInfoLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);
    }

    _createHTMLElement() {
        this._pointerInfo = new WT_MapViewPointerInfo();
        return this._pointerInfo;
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.pointer.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._pointerInfo.update(state);
    }
}
WT_MapViewPointerInfoLayer.CLASS_DEFAULT = "pointerInfoLayer";
WT_MapViewPointerInfoLayer.CONFIG_NAME_DEFAULT = "pointerInfo";

class WT_MapViewPointerInfo extends HTMLElement {
    constructor() {
        super();

        let template = document.createElement("template");
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 24vh;
                    height: 4.5vh;
                    background-color: black;
                    border: solid 1px white;
                    border-radius: 3px;
                    font-weight: bold;
                    font-size: 1.75vh;
                    line-height: 2vh;
                    color: white;
                }
                    #grid {
                        margin: 0 0.5vh;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        grid-template-rows: 1fr 1fr;
                        grid-template-areas:
                            "distance lat"
                            "bearing long";
                    }

                    #distance {
                        grid-area: distance;
                        display: flex;
                        flex-flow: row nowrap;
                        justify-content: space-between;
                    }
                        .distanceUnit {
                            font-size: 0.75em;
                        }

                    #bearing {
                        grid-area: bearing;
                        display: flex;
                        flex-flow: row nowrap;
                        justify-content: space-between;
                    }

                    #lat {
                        padding-left: 1vh;
                        grid-area: lat;
                        text-align: start;
                    }
                    #long {
                        padding-left: 1vh;
                        grid-area: long;
                        text-align: start;
                    }

                    .title {
                        text-align: start;
                    }
                    .value {
                        text-align: end;
                    }
            </style>
            <div id="grid">
                <div id="distance">
                    <div class="title">DIS</div>
                    <div class="value"></div>
                </div>
                <div id="bearing">
                    <div class="title">BRG</div>
                    <div class="value"></div>
                </div>
                <div id="lat"></div>
                <div id="long"></div>
            </div>
        `;
        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        let distanceFormatterOpts = {
            precision: 0.01,
            forceDecimalZeroes: false,
            maxDigits: 3,
            unitCaps: true
        };
        let distanceHTMLFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                getNumberClassList() {
                    return ["distanceNumber"];
                },
                getUnitClassList() {
                    return ["distanceUnit"];
                }
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

    connectedCallback() {
        this._distanceValue = this.shadowRoot.querySelector(`#distance .value`);
        this._bearingValue = this.shadowRoot.querySelector(`#bearing .value`);
        this._latCell = this.shadowRoot.querySelector(`#lat`);
        this._longCell = this.shadowRoot.querySelector(`#long`);
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
    update(state) {
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

customElements.define("map-view-pointerinfo", WT_MapViewPointerInfo);