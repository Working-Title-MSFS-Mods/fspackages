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
         * @type {{model:WT_NavDataInfo, view:WT_NavDataInfoView, formatter:WT_NavDataInfoViewFormatter}[]}
         */
        this._infos = [];
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_PFDNavStatusHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._main = new WT_CachedElement(this.shadowRoot.querySelector(`#main`));
        this._left = new WT_CachedElement(this.shadowRoot.querySelector(`#mainleft`));
        this._right = new WT_CachedElement(this.shadowRoot.querySelector(`#mainright`));
        this._infosContainer = this.shadowRoot.querySelector(`#infoscontainer`);

        this._navDataInfoViewRecycler = new WT_NavDataInfoViewRecycler(this._infosContainer);
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
        return leg.segment === WT_FlightPlan.Segment.APPROACH && leg.index === leg.flightPlan.legCount() - 2;
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
    _updateLeg(activeLeg) {
        let flightPlan = this._context.airplane.fms.flightPlanManager.activePlan;
        let previousLeg = flightPlan.leg(activeLeg.index - 1);
        this._left.innerHTML = this._getWaypointDisplay(previousLeg);
        this._right.innerHTML = this._getWaypointDisplay(activeLeg);
    }

    _updateMain() {
        let fpm = this._context.airplane.fms.flightPlanManager;
        if (fpm.directTo.isActive()) {
            this._main.setAttribute("mode", "drct");
            this._updateDirectTo();
        } else {
            let activeLeg = fpm.getActiveLeg(true);
            if (activeLeg) {
                this._main.setAttribute("mode", "leg");
                this._updateLeg(activeLeg);
            } else {
                this._main.setAttribute("mode", "none");
            }
        }
    }

    _updateNavDataInfos() {
        this._infos.forEach(entry => entry.view.update(entry.model, entry.formatter));
    }

    _updateDisplay() {
        this._updateNavDataInfos();
        this._updateMain();
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._updateDisplay();
    }
}
WT_G3x5_PFDNavStatusHTMLElement.NAME = "wt-pfd-navstatus";
WT_G3x5_PFDNavStatusHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_PFDNavStatusHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
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
                        .middleicon {
                            width: 1.1em;
                            height: 1.1em;
                            display: none;
                        }
                        #main[mode="leg"] #arrow {
                            display: block;
                        }
                        #main[mode="drct"] #drct {
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
        </div>
    </div>
`;

customElements.define(WT_G3x5_PFDNavStatusHTMLElement.NAME, WT_G3x5_PFDNavStatusHTMLElement);

/**
 * @typedef WT_G3x5_PFDNavStatusContext
 * @property {WT_PlayerAirplane} airplane
 * @property {{model:WT_NavDataInfo, formatter:WT_NavDataInfoViewFormatter}[]} infos
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
            this._value.set(target.distance(this._airplane.navigation.position(this._tempGeoPoint)));
        } else {
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
            this._value.unit.setLocation(airplanePos)
            this._value.set(airplanePos.bearingTo(target));
        } else {
            this._value.set(NaN);
        }
    }
}