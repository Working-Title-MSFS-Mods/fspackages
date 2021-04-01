/**
 * Styles flight plan legs to resemble what is seen in the real-life G3000/G5000 units.
 */
class WT_G3x5_MapViewFlightPlanLegCanvasStyler extends WT_MapViewFlightPlanLegCanvasStyler {
    constructor() {
        super();

        this._initLegRenderers();
        this._initOptionChangeFuncs();
        this._optsManager.addOptions(WT_G3x5_MapViewFlightPlanLegCanvasStyler.OPTIONS_DEF);
    }

    _initLegRenderersHelper(active) {
        let renderers = [];
        renderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_STANDARD] = new WT_MapViewFlightPlanLegCanvasLineRenderer();
        renderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_THIN] = new WT_MapViewFlightPlanLegCanvasLineRenderer();
        renderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED] = new WT_MapViewFlightPlanLegCanvasLineRenderer();
        renderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD] = new WT_MapViewFlightPlanLegCanvasArrowRenderer();
        renderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT] = new WT_MapViewFlightPlanLegCanvasArrowRenderer();
        return renderers;
    }

    _initLegRenderers() {
        this._inactiveLegRenderers = this._initLegRenderersHelper(false);
        this._activeLegRenderers = this._initLegRenderersHelper(true);
    }

    _initOptionChangeFuncs() {
        this._optionChangeFuncs = [];
        this._optionChangeFuncs["standardLineStrokeWidth"] = this._setStandardLineStrokeWidth.bind(this);
        this._optionChangeFuncs["standardLineOutlineWidth"] = this._setStandardLineOutlineWidth.bind(this);

        this._optionChangeFuncs["thinLineStrokeWidth"] = this._setThinLineStrokeWidth.bind(this);
        this._optionChangeFuncs["thinLineOutlineWidth"] = this._setThinLineOutlineWidth.bind(this);

        this._optionChangeFuncs["dottedLineStrokeWidth"] = this._setDottedLineStrokeWidth.bind(this);
        this._optionChangeFuncs["dottedLineOutlineWidth"] = this._setDottedLineOutlineWidth.bind(this);
        this._optionChangeFuncs["dottedLineDash"] = this._setDottedLineDash.bind(this);

        this._optionChangeFuncs["standardArrowWidth"] = this._setStandardArrowWidth.bind(this);
        this._optionChangeFuncs["standardArrowHeight"] = this._setStandardArrowHeight.bind(this);
        this._optionChangeFuncs["standardArrowSpacing"] = this._setStandardArrowSpacing.bind(this);
        this._optionChangeFuncs["standardArrowOutlineWidth"] = this._setStandardArrowOutlineWidth.bind(this);

        this._optionChangeFuncs["altArrowWidth"] = this._setAltArrowWidth.bind(this);
        this._optionChangeFuncs["altArrowHeight"] = this._setAltArrowHeight.bind(this);
        this._optionChangeFuncs["altArrowSpacing"] = this._setAltArrowSpacing.bind(this);
        this._optionChangeFuncs["altArrowOutlineWidth"] = this._setAltArrowOutlineWidth.bind(this);

        this._optionChangeFuncs["inactiveColor"] = this._setInactiveColor.bind(this);
        this._optionChangeFuncs["inactiveOutlineColor"] = this._setInactiveOutlineColor.bind(this);
        this._optionChangeFuncs["activeColor"] = this._setActiveColor.bind(this);
        this._optionChangeFuncs["activeOutlineColor"] = this._setActiveOutlineColor.bind(this);
    }

    _setStandardLineStrokeWidth(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_STANDARD].strokeWidth = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_STANDARD].strokeWidth = value;
    }

    _setStandardLineOutlineWidth(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_STANDARD].outlineWidth = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_STANDARD].outlineWidth = value;
    }

    _setThinLineStrokeWidth(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_THIN].strokeWidth = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_THIN].strokeWidth = value;
    }

    _setThinLineOutlineWidth(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_THIN].outlineWidth = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_THIN].outlineWidth = value;
    }

    _setDottedLineStrokeWidth(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED].strokeWidth = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED].strokeWidth = value;
    }

    _setDottedLineOutlineWidth(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED].outlineWidth = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED].outlineWidth = value;
    }

    _setDottedLineDash(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED].dash = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED].dash = value;
    }

    _setStandardArrowWidth(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].width = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].width = value;
    }

    _setStandardArrowHeight(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].height = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].height = value;
    }

    _setStandardArrowSpacing(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].spacing = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].spacing = value;
    }

    _setStandardArrowOutlineWidth(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].outlineWidth = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].outlineWidth = value;
    }

    _setAltArrowWidth(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].width = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].width = value;
    }

    _setAltArrowHeight(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].height = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].height = value;
    }

    _setAltArrowSpacing(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].spacing = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].spacing = value;
    }

    _setAltArrowOutlineWidth(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].outlineWidth = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].outlineWidth = value;
    }

    _setInactiveColor(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_STANDARD].strokeColor = value;
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_THIN].strokeColor = value;
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED].strokeColor = value;
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].fillColor = value;
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].fillColor = value;
    }

    _setInactiveOutlineColor(value) {
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_STANDARD].outlineColor = value;
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_THIN].outlineColor = value;
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED].outlineColor = value;
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].outlineColor = value;
        this._inactiveLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].outlineColor = value;
    }

    _setActiveColor(value) {
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_STANDARD].strokeColor = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_THIN].strokeColor = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED].strokeColor = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].fillColor = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].fillColor = value;
    }

    _setActiveOutlineColor(value) {
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_STANDARD].outlineColor = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_THIN].outlineColor = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED].outlineColor = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD].outlineColor = value;
        this._activeLegRenderers[WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT].outlineColor = value;
    }

    /**
     * @param {String} name - the name of the option that changed.
     * @param {*} oldValue - the old value of the option.
     * @param {*} newValue - the new value of the option.
     */
    onOptionChanged(name, oldValue, newValue) {
        let func = this._optionChangeFuncs[name];
        if (func) {
            func(newValue);
        }
    }

    /**
     * Selects a style with which to render a flight plan leg.
     * @param {WT_FlightPlanLeg} leg - the flight plan leg to render.
     * @param {WT_FlightPlanLeg} activeLeg - the active leg in the flight plan, or null if there is no active leg.
     * @param {Boolean} discontinuity - whether the previous flight plan leg ended in a discontinuity.
     * @returns {WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle} the style with which to render the flight plan leg.
     */
    _chooseStyle(leg, activeLeg, discontinuity) {
        let activeIndexDelta = activeLeg ? leg.index - activeLeg.index : undefined;
        if (discontinuity) {
            if (activeLeg && activeIndexDelta >= 0) {
                if (activeIndexDelta <= 1) {
                    return WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_ALT;
                } else {
                    return WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_DOTTED;
                }
            }
            return WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.NONE;
        }

        if (leg instanceof WT_FlightPlanProcedureLeg) {
            switch (leg.procedureLeg.type) {
                case WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_DISTANCE_FROM_REFERENCE:
                case WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_REFERENCE_RADIAL_CROSSING:
                case WT_ProcedureLeg.Type.FLY_HEADING_TO_INTERCEPT:
                case WT_ProcedureLeg.Type.FLY_HEADING_TO_ALTITUDE:
                    return WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.ARROW_STANDARD;
            }
        }

        if (activeLeg && leg.segment === activeLeg.segment && activeIndexDelta >= 0) {
            return WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_STANDARD;
        } else {
            return WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.LINE_THIN;
        }
    }

    /**
     * Selects an appropriate leg renderer to render a flight plan leg.
     * @param {WT_FlightPlanLeg} leg - the flight plan leg to render.
     * @param {WT_FlightPlanLeg} activeLeg - the active leg in the flight plan, or null if there is no active leg.
     * @param {Boolean} discontinuity - whether the previous flight plan leg ended in a discontinuity.
     * @returns {WT_MapViewFlightPlanLegCanvasRenderer} a leg renderer, or null if the leg should not be rendered.
     */
    chooseRenderer(leg, activeLeg, discontinuity) {
        let style = this._chooseStyle(leg, activeLeg, discontinuity);
        if (style === WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle.NONE) {
            return null;
        } else {
            return leg === activeLeg ? this._activeLegRenderers[style] : this._inactiveLegRenderers[style];
        }
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_MapViewFlightPlanLegCanvasStyler.LegStyle = {
    NONE: -1,
    LINE_STANDARD: 0,
    LINE_THIN: 1,
    LINE_DOTTED: 2,
    ARROW_STANDARD: 3,
    ARROW_ALT: 4
};
WT_G3x5_MapViewFlightPlanLegCanvasStyler.OPTIONS_DEF = {
    standardLineStrokeWidth: {default: 6, auto: true, observed: true},
    standardLineOutlineWidth: {default: 1, auto: true, observed: true},
    thinLineStrokeWidth: {default: 4, auto: true, observed: true},
    thinLineOutlineWidth: {default: 1, auto: true, observed: true},
    dottedLineStrokeWidth: {default: 4, auto: true, observed: true},
    dottedLineOutlineWidth: {default: 1, auto: true, observed: true},
    dottedLineDash: {default: [4, 4], auto: true, observed: true},

    standardArrowWidth: {default: 8, auto: true, observed: true},
    standardArrowHeight: {default: 12, auto: true, observed: true},
    standardArrowSpacing: {default: 12, auto: true, observed: true},
    standardArrowOutlineWidth: {default: 1, auto: true, observed: true},

    altArrowWidth: {default: 8, auto: true, observed: true},
    altArrowHeight: {default: 12, auto: true, observed: true},
    altArrowSpacing: {default: 4, auto: true, observed: true},
    altArrowOutlineWidth: {default: 1, auto: true, observed: true},

    inactiveColor: {default: "white", auto: true, observed: true},
    inactiveOutlineColor: {default: "#454545", auto: true, observed: true},
    activeColor: {default: "#9c70b1", auto: true, observed: true},
    activeOutlineColor: {default: "#652f70", auto: true, observed: true},
};