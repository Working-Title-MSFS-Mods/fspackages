/**
 * A model containing a single WT_NumberUnit value paired with a nominal unit type, representing a numeric value (with
 * unit) that may be expressed in one of many interconvertable unit types.
 */
class WT_NumberUnitModel {
    /**
     * @param {WT_Unit} unit - the reference unit type of the new model's number value. The nominal unit type of the new
     *                         model will also be initialized to this unit.
     * @param {Number} [value] - the initial numeric value of the new model. Defaults to 0.
     */
    constructor(unit, value = 0) {
        this._value = new WT_NumberUnit(value, unit);

        this._unit = unit;
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
        return copy ? this._value.copy() : this._value.readonly();
    }

    /**
     * Sets the value of this model.
     * @param {WT_NumberUnit} value - the new value.
     */
    setValue(value) {
        this._value.set(value);
    }

    /**
     * Gets the nominal unit type of this model. The nominal unit type determines the behavior of the getNumber()
     * method.
     * @returns {WT_Unit} the nominal unit type of this model.
     */
    getUnit() {
        return this._unit;
    }

    /**
     * Sets the nominal unit type of this model. The nominal unit type determines the behavior of the getNumber()
     * method. If an invalid unit (defined as any unit not in the same family as the reference unit of this model's
     * value) is chosen, the nominal unit type will remain unchanged.
     * @param {WT_Unit} unit - the new nominal unit type.
     */
    setUnit(unit) {
        if (unit.family !== this._value.unit.family) {
            return;
        }

        this._unit = unit;
    }

    /**
     * Gets the numeric value of this model measured in this model's nominal unit type.
     * @returns {Number} the numeric value of this model measured in this model's nominal unit type.
     */
    getNumber() {
        return this._value.asUnit(this.getUnit());
    }
}

/**
 * A NumberUnit model whose value is automatically updated prior to retrieval.
 */
class WT_NumberUnitModelAutoUpdated extends WT_NumberUnitModel {
    /**
     * @param {WT_Unit} unit - the reference unit type of the new model's number value. The nominal unit type of the new
     *                         model will also be initialized to this unit.
     * @param {{updateValue(value:WT_NumberUnit)}} valueUpdater - an object that is used to update the numeric value of
     *                                                            the new model.
     */
    constructor(unit, valueUpdater) {
        super(unit);

        this._valueUpdater = valueUpdater;
    }

    _updateValue() {
        this._valueUpdater.updateValue(this._value);
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

/**
 * A NumberUnit model whose value is automatically updated from a SimVar prior to retrieval.
 */
class WT_NumberUnitModelSimVar extends WT_NumberUnitModelAutoUpdated {
    /**
     * @param {WT_Unit} unit - the reference unit type of the new model's number value. The nominal unit type of the new
     *                         model will also be initialized to this unit.
     * @param {String} simVarName - the name of the SimVar used to update the new model's value.
     * @param {String} simVarUnit - the unit to use when retrieving the SimVar used to update the new model's value.
     * @param {WT_Unit} [setUnit] - the unit to use when interpreting the value of the SimVar used to update the new
     *                              model's value. Defaults to the reference unit type of the new model's number value.
     */
    constructor(unit, simVarName, simVarUnit, setUnit) {
        super(unit, {updateValue(value) {value.set(SimVar.GetSimVarValue(simVarName, simVarUnit), setUnit)}});
    }
}

/**
 * A NumberUnit model whose reference unit is in the nav angle family and whose value is automatically updated from a
 * SimVar prior to retrieval.
 */
class WT_NavAngleModelSimVar extends WT_NumberUnitModelSimVar {
    /**
     * @param {Boolean} isMagnetic - whether the reference unit of the new model's value uses a magnetic reference.
     * @param {String} simVarName - the name of the SimVar used to update the new model's value.
     * @param {String} simVarUnit - the unit to use when retrieving the SimVar used to update the new model's value.
     * @param {WT_Unit} [simVarIsMagnetic] - whether to interpret the value of the SimVar used to update the new
     *                                       model's value as magnetic. Defaults to the same as that of the reference
     *                                       unit of the new model's value.
     */
    constructor(isMagnetic, locationUpdater, simVarName, simVarUnit, simVarIsMagnetic) {
        let setUnit = simVarIsMagnetic !== undefined ? new WT_NavAngleUnit(simVarIsMagnetic) : undefined;
        super(new WT_NavAngleUnit(isMagnetic), simVarName, simVarUnit, setUnit);

        this._setUnit = setUnit;
        this._locationUpdater = locationUpdater;
        this._location = new WT_GeoPoint(0, 0);
    }

    _updateLocation() {
        this._locationUpdater.updateLocation(this._location);
        this._value.unit.setLocation(this._location);
        if (this._setUnit) {
            this._setUnit.setLocation(this._location);
        }
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
        this._updateLocation();
        return super.getValue(copy);
    }
}