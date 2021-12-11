class WT_G3x5_PFDNavStatusHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_PFDNavStatusContext}
         */
        this._context = null;
        /**
         * @type {{model:WT_G3x5_NavDataInfo, view:WT_G3x5_NavDataInfoView, formatter:WT_G3x5_NavDataInfoViewFormatter}[]}
         */
        this._infos = [];
        this._isInit = false;

        this._tempFoot = WT_Unit.FOOT.createNumber(0);
        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempSecond = WT_Unit.SECOND.createNumber(0);
    }

    _getTemplate() {
        return WT_G3x5_PFDNavStatusHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector("#wrapper"));

        this._left = new WT_CachedElement(this.shadowRoot.querySelector("#mainleft"), {cacheAttributes: false});
        this._right = new WT_CachedElement(this.shadowRoot.querySelector("#mainright"), {cacheAttributes: false});
        this._infosContainer = this.shadowRoot.querySelector("#infoscontainer");

        this._navDataInfoViewRecycler = new WT_G3x5_NavDataInfoViewRecycler(this._infosContainer);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._updateFromContext();
    }

    _clearNavDataInfos() {
        this._navDataInfoViewRecycler.recycleAll();
        this._infos = [];
    }

    _cleanUpContext() {
        if (!this._context) {
            return;
        }

        this._clearNavDataInfos();
    }

    _initNavDataInfos() {
        this._context.infos.forEach(info => {
            this._infos.push({
                model: info.model,
                view: this._navDataInfoViewRecycler.request(),
                formatter: info.formatter
            });
        }, this);
    }

    _updateFromContext() {
        if (this._context) {
            this._initNavDataInfos();
        }
    }

    /**
     *
     * @param {WT_G3x5_PFDAirspeedIndicatorContext} context
     */
    setContext(context) {
        if (this._context === context) {
            return;
        }

        this._cleanUpContext();
        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
     _isLegFAF(leg) {
        return leg.segment === WT_FlightPlan.Segment.APPROACH && leg.index === leg.flightPlan.legs.length - 2;
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     * @returns {String}
     */
    _getWaypointText(waypoint) {
        let text = waypoint.ident;
        if (!text) {
            text = "?";
        }
        return text;
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @returns {String}
     */
    _getWaypointDisplay(leg) {
        let innerHTML = this._getWaypointText(leg.fix);
        if (this._isLegFAF(leg)) {
            innerHTML += " faf";
        }
        return innerHTML;
    }

    _updateDirectTo() {
        let fpm = this._context.airplane.fms.flightPlanManager;
        let destination = fpm.directTo.getDestination();

        let innerHTML = this._getWaypointText(destination);
        let leg = fpm.getDirectToLeg(true);
        if (leg && this._isLegFAF(leg)) {
            innerHTML += " faf";
        }
        this._left.innerHTML = "";
        this._right.innerHTML = innerHTML;
    }

    /**
     *
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _updateLeg(activeLeg, previousLeg) {
        this._left.innerHTML = this._getWaypointDisplay(previousLeg);
        this._right.innerHTML = this._getWaypointDisplay(activeLeg);
    }

    _updateMain() {
        let fpm = this._context.airplane.fms.flightPlanManager;
        if (fpm.directTo.isActive()) {
            this._wrapper.setAttribute("mode", "drct");
            this._updateDirectTo();
        } else {
            let activeLeg = fpm.getActiveLeg(true);
            let previousLeg = activeLeg ? fpm.activePlan.legs.get(activeLeg.index - 1) : null;
            if (previousLeg) {
                this._wrapper.setAttribute("mode", "leg");
                this._updateLeg(activeLeg, previousLeg);
            } else {
                this._wrapper.setAttribute("mode", "none");
            }
        }
    }

    _updateNavDataInfos() {
        this._infos.forEach(entry => entry.view.update(entry.model, entry.formatter));
    }

    _setTODWarning(value) {
        this._wrapper.setAttribute("todwarning", `${value}`);
    }

    /**
     *
     * @param {WT_VNAVPathReadOnly} activeVNAVPath
     */
    _shouldShowTODWarning(activeVNAVPath) {
        if (!activeVNAVPath || activeVNAVPath.deltaAltitude.number > 0) {
            return false;
        }

        // conditions for showing TOD warning:
        // * VNAV path is a descent
        // * current altitude > 250 ft below VNAV target altitude
        // * time to TOD <= 1 minute
        // * flight path angle required to meet VNAV target altitude restriction within limits

        let indicatedAltitude = this._context.airplane.sensors.getAltimeter(this._context.airplane.fms.flightPlanManager.altimeterIndex).altitudeIndicated(this._tempFoot);
        let distanceRemaining = this._context.airplane.fms.flightPlanManager.distanceToActiveVNAVWaypoint(true, this._tempNM);
        let fpaRequired = activeVNAVPath.getFlightPathAngleRequiredAt(distanceRemaining, indicatedAltitude);
        let altitudeDelta = indicatedAltitude.subtract(activeVNAVPath.finalAltitude);
        let timeToTOD = this._context.airplane.fms.flightPlanManager.timeToTOD(true, this._tempSecond);

        return altitudeDelta.compare(WT_G3x5_PFDNavStatusHTMLElement.TIME_TO_TOD_WARNING_ALTITUDE_DELTA_THRESHOLD) >= 0 &&
            fpaRequired >= WT_G3x5_PFDNavStatusHTMLElement.TIME_TO_TOD_WARNING_FPA_REQUIRED_THRESHOLD &&
            (timeToTOD && timeToTOD.compare(WT_G3x5_PFDNavStatusHTMLElement.TIME_TO_TOD_WARNING_THRESHOLD) <= 0);
    }

    _updateTODWarning() {
        let activeVNAVPath = this._context.airplane.fms.flightPlanManager.getActiveVNAVPath(true);
        let shouldShowTODWarning = this._shouldShowTODWarning(activeVNAVPath);
        this._setTODWarning(shouldShowTODWarning);
    }

    _doUpdate() {
        this._updateNavDataInfos();
        this._updateMain();
        this._updateTODWarning();
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._doUpdate();
    }
}
WT_G3x5_PFDNavStatusHTMLElement.TIME_TO_TOD_WARNING_THRESHOLD = WT_Unit.MINUTE.createNumber(1);
WT_G3x5_PFDNavStatusHTMLElement.TIME_TO_TOD_WARNING_ALTITUDE_DELTA_THRESHOLD = WT_Unit.FOOT.createNumber(-250);
WT_G3x5_PFDNavStatusHTMLElement.TIME_TO_TOD_WARNING_FPA_REQUIRED_THRESHOLD = -6;
WT_G3x5_PFDNavStatusHTMLElement.NAME = "wt-pfd-navstatus";
WT_G3x5_PFDNavStatusHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_PFDNavStatusHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        @keyframes todwarning-blink {
            0% {
                visibility: visible;
                color: var(--wt-g3x5-bggray);
            }
            67% {
                visibility: visible;
                color: transparent;
            }
            100% {
                visibility: visible;
                color: var(--wt-g3x5-bggray);
            }
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            #top {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: var(--navstatus-toprow-height, 50%);
            }
                #main {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-flow: row nowrap;
                    justify-content: center;
                    align-items: center;
                    font-size: var(--navstatus-main-font-size, 1.2em);
                }
                    .mainsub {
                        margin: 0 0.1em;
                        color: var(--wt-g3x5-purple);
                    }
                    #wrapper[mode="none"] .mainsub {
                        display: none;
                    }
                        .middleicon {
                            width: 1.1em;
                            height: 1.1em;
                            display: none;
                        }
                        #wrapper[mode="leg"] #arrow {
                            display: block;
                        }
                        #wrapper[mode="drct"] #drct {
                            display: block;
                        }
                        #arrow {
                            fill: var(--wt-g3x5-purple);
                        }
                        #drctarrow {
                            fill: var(--wt-g3x5-purple);
                        }
                        #drctletterD {
                            fill: transparent;
                            stroke: var(--wt-g3x5-purple);
                            stroke-width: 10;
                        }
            #bottom {
                position: absolute;
                left: 0%;
                bottom: 0%;
                width: 100%;
                height: calc(100% - var(--navstatus-toprow-height, 50%));
            }
                #infoscontainer {
                    position: absolute;
                    width: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex;
                    flex-flow: row nowrap;
                    justify-content: center;
                    align-items: center;
                }
                    wt-navdatainfo-view {
                        position: relative;
                        width: var(--navstatus-info-width, 40%);
                        height: 1.1em;
                        margin: 0 var(--navstatus-info-margin-horiz, 0.25em);
                        font-size: var(--navstatus-info-font-size, 1em);
                        --navdatainfo-justify-content: center;
                        --navdatainfo-value-color: var(--wt-g3x5-purple);
                    }
                #todwarning {
                    visibility: hidden;
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 90%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    background: white;
                    border-radius: 3px;
                    font-weight: bold;
                    font-size: var(--navstatus-todwarning-font-size, 1em);
                }
                #wrapper[todwarning="true"] #todwarning {
                    animation: todwarning-blink 1s step-end 10;
                }
    </style>
    <div id="wrapper">
        <div id="top">
            <div id="main">
                <div id="mainleft" class="mainsub"></div>
                <div id="mainmiddle" class="mainsub">
                    <svg id="arrow" class="middleicon" viewBox="0 0 100 100">
                        <path d="M 5 45 L 70 45 L 70 30 L 90 50 L 70 70 L 70 55 L 5 55 Z" />
                    </svg>
                    <svg id="drct" class="middleicon" viewBox="0 0 100 100">
                        <path id="drctarrow" d="M 5 45 L 70 45 L 70 30 L 90 50 L 70 70 L 70 55 L 5 55 Z" />
                        <path id="drctletterD" d="M 20 20 C 65 20 65 80 20 80 Z" />
                    </svg>
                </div>
                <div id="mainright" class="mainsub"></div>
            </div>
        </div>
        <div id="bottom">
            <div id="infoscontainer">
            </div>
            <div id="todwarning">TOD within 1 minute</div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_PFDNavStatusHTMLElement.NAME, WT_G3x5_PFDNavStatusHTMLElement);

/**
 * @typedef WT_G3x5_PFDNavStatusContext
 * @property {WT_PlayerAirplane} airplane
 * @property {{model:WT_G3x5_NavDataInfo, formatter:WT_G3x5_NavDataInfoViewFormatter}[]} infos
 */

 class WT_G3x5_PFDNavStatusNumberUnitModel extends WT_NumberUnitModel {
    /**
     * @param {WT_Unit} unit - the reference unit type of the new model's number value. The nominal unit type of the new
     *                         model will also be initialized to this unit.
     * @param {WT_PlayerAirplane} airplane - the player airplane.
     */
    constructor(unit, airplane) {
        super(unit);

        this._airplane = airplane;
    }

    _updateValue() {
    }

    /**
     * Gets the current value of this model.
     * @param {Boolean} [copy] - whether to return the value as a copy of the WT_NumberUnit object maintained in this
     *                           model. If false, a readonly version of this model's WT_NumberUnit object will be
     *                           returned instead. The readonly version will automatically update to reflect any
     *                           subsequent changes made to this model via setValue(). False by default.
     * @returns {WT_NumberUnit|WT_NumberUnitReadOnly} the current value of this model.
     */
    getValue(copy = false) {
        this._updateValue();
        return super.getValue(copy);
    }

    /**
     * This method has no effect. The value of this model is automatically updated with every call to
     * getValue().
     */
    setValue() {
    }
}

class WT_G3x5_PFDNavStatusDISModel extends WT_G3x5_PFDNavStatusNumberUnitModel {
    /**
     * @param {WT_PlayerAirplane} airplane - the player airplane.
     */
     constructor(airplane) {
        super(WT_Unit.GA_RADIAN, airplane);

        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    _updateValue() {
        let fpm = this._airplane.fms.flightPlanManager;
        let result;
        if (fpm.directTo.isActive()) {
            result = fpm.distanceToDirectTo(true, this._value);
        } else {
            result = fpm.distanceToActiveLegFix(true, this._value);
        }

        if (!result) {
            this._value.set(NaN);
        }
    }
}

class WT_G3x5_PFDNavStatusBRGModel extends WT_G3x5_PFDNavStatusNumberUnitModel {
    /**
     * @param {WT_PlayerAirplane} airplane - the player airplane.
     */
     constructor(airplane) {
        super(new WT_NavAngleUnit(false), airplane);

        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    _updateValue() {
        let fpm = this._airplane.fms.flightPlanManager;
        let target = null;
        if (fpm.directTo.isActive()) {
            target = fpm.directTo.getDestination().location;
        } else {
            let activeLeg = fpm.getActiveLeg(true);
            if (activeLeg) {
                target = activeLeg.fix.location;
            }
        }

        if (target) {
            let airplanePos = this._airplane.navigation.position(this._tempGeoPoint);
            this._value.unit.setLocation(airplanePos);
            this._value.set(airplanePos.bearingTo(target));
        } else {
            this._value.set(NaN);
        }
    }
}

class WT_G3x5_PFDNavStatusETEModel extends WT_G3x5_PFDNavStatusNumberUnitModel {
    /**
     * @param {WT_PlayerAirplane} airplane - the player airplane.
     */
     constructor(airplane) {
        super(WT_Unit.SECOND, airplane);

        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempKnot = WT_Unit.KNOT.createNumber(0);
    }

    _updateValue() {
        let value = NaN;
        if (!this._airplane.sensors.isOnGround()) {
            let fpm = this._airplane.fms.flightPlanManager;
            let distance = null;
            if (fpm.directTo.isActive()) {
                distance = fpm.distanceToDirectTo(true, this._tempNM);
            } else {
                let activeLeg = fpm.getActiveLeg(true);
                if (activeLeg) {
                    distance = fpm.distanceToActiveLegFix(true, this._tempNM);
                }
            }

            if (distance) {
                let gs = this._airplane.navigation.groundSpeed(this._tempKnot);
                if (gs.number > 0) {
                    value = WT_Unit.HOUR.convert(distance.number / gs.number, this._value.unit);
                }
            }
        }
        this._value.set(value);
    }
}