class WT_G3x5_ProcedureDisplayProcedureSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ProcedureDisplayProcedureSetting.DEFAULT_VALUE, key = WT_G3x5_ProcedureDisplayProcedureSetting.KEY) {
        super(model, key, defaultValue, true, false);

        this._airportICAO = "";
        this._procedureType = WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.NONE;
        this._procedureIndex = -1;
        this._transitionIndex = -1;
        this._runwayDesignation = "";
    }

    /**
     * @readonly
     * @type {String}
     */
    get airportICAO() {
        return this._airportICAO;
    }

    /**
     * @readonly
     * @type {WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType}
     */
    get procedureType() {
        return this._procedureType;
    }

    /**
     * @readonly
     * @type {Number}
     */
    get procedureIndex() {
        return this._procedureIndex;
    }

    /**
     * @readonly
     * @type {Number}
     */
    get transitionIndex() {
        return this._transitionIndex;
    }

    /**
     * @readonly
     * @type {String}
     */
    get runwayDesignation() {
        return this._runwayDesignation;
    }

    /**
     *
     * @param {WT_Procedure} procedure
     * @param {WT_ProcedureTransition} [transition]
     * @param {WT_Runway} [runway]
     */
    _serialize(procedure, transition, runway) {
        let json = {
            icao: "",
            type: WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.NONE,
            index: -1,
            transitionIndex: -1,
            runway: ""
        };
        if (procedure) {
            json.icao = procedure.airport.icao;
            if (procedure instanceof WT_Departure) {
                json.type = WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.DEPARTURE;
            } else if (procedure instanceof WT_Arrival) {
                json.type = WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.ARRIVAL;
            } else {
                json.type = WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.APPROACH;
            }
            json.index = procedure.index;

            if (transition) {
                switch (json.type) {
                    case WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.DEPARTURE:
                    case WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.ARRIVAL:
                        json.transitionIndex = procedure.enrouteTransitions.array.indexOf(transition);
                        break;
                    case WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.APPROACH:
                        json.transitionIndex = procedure.transitions.array.indexOf(transition);
                        break;
                }
            }
            if (runway) {
                json.runway = runway.designation;
            }
        }
        return JSON.stringify(json);
    }

    /**
     *
     * @param {WT_Procedure} procedure
     * @param {WT_ProcedureTransition} [transition]
     * @param {WT_Runway} [runway]
     */
    setProcedure(procedure, transition, runway) {
        let value = this._serialize(procedure, transition, runway);
        this.setValue(value);
    }

    /**
     *
     * @param {String} value
     */
    _parseValue(value) {
        let json = JSON.parse(value);
        this._airportICAO = json.icao;
        this._procedureType = json.type;
        this._procedureIndex = json.index;
        this._transitionIndex = json.transitionIndex;
        this._runwayDesignation = json.runway;
    }

    update() {
        let value = this.getValue();
        this._parseValue(value);
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType = {
    NONE: 0,
    DEPARTURE: 1,
    ARRIVAL: 2,
    APPROACH: 3
};
WT_G3x5_ProcedureDisplayProcedureSetting.KEY = "WT_ProcedureDisplay_Procedure";
WT_G3x5_ProcedureDisplayProcedureSetting.DEFAULT_VALUE = JSON.stringify({
    icao: "",
    type: WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.NONE,
    index: -1,
    transitionIndex: -1,
    runway: ""
});