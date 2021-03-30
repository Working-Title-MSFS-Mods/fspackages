class WT_TASDistributedModelMaster {
    /**
     * @param {String} id
     * @param {WT_TrafficAvoidanceSystem} trafficAvoidanceSystem
     */
    constructor(id, trafficAvoidanceSystem) {
        this._id = id;
        this._trafficAvoidanceSystem = trafficAvoidanceSystem;

        this._ownAirplane = new WT_TASDistributedModelOwnAirplane();
        /**
         * @type {Map<WT_TrafficAvoidanceSystemIntruder,WT_TASDistributedModelIntruder>}
         */
        this._intruderModels = new Map();
        /**
         * @type {Set<WT_TrafficAvoidanceSystemIntruder>}
         */
        this._needDeletion = new Set();

        this._eventKeyPrefix = `${WT_TASDistributedModelMaster.EVENT_KEY_PREFIX}_${id}`;
        this._ownAirplaneSerializer = new WT_TASDistributedModelOwnAirplaneSerializer();
        this._intruderSerializer = new WT_TASDistributedModelIntruderSerializer();
    }

    /**
     * @readonly
     * @type {String}
     */
    get id() {
        return this._id;
    }

    _fireEvent(event, data) {
        WT_CrossInstrumentEvent.fireEvent(`${this._eventKeyPrefix}_${event}`, data);
    }

    _updateOwnAirplane() {
        let airplane = this._trafficAvoidanceSystem.ownAirplane;
        this._ownAirplane.setParameters(airplane.protectedRadius, airplane.protectedHeight, airplane.positionVector, airplane.velocityVector);
        this._fireEvent(WT_TASDistributedModelMaster.EVENT_UPDATE_OWNAIRPLANE, this._ownAirplaneSerializer.serialize(this._ownAirplane));
    }

    /**
     *
     * @param {WT_TrafficAvoidanceSystemIntruder} intruder
     */
    _createIntruder(intruder) {
        let model = new WT_TASDistributedModelIntruder(intruder.contact.id, this._ownAirplane);
        this._intruderModels.set(intruder, model);
        this._fireEvent(WT_TASDistributedModelMaster.EVENT_CREATE_INTRUDER, model.id);
    }

    /**
     *
     * @param {WT_TrafficAvoidanceSystemIntruder} intruder
     * @param {WT_TASDistributedModelIntruder} model
     */
    _updateIntruder(intruder, model) {
        let isPredictionValid = intruder.isPredictionValid;
        if (!isPredictionValid && model.isPredictionValid) {
            model.invalidatePrediction();
            this._fireEvent(WT_TASDistributedModelMaster.EVENT_UPDATE_INTRUDER, this._intruderSerializer.serialize(model));
        } else if (isPredictionValid) {
            model.setPrediction(intruder.positionVector, intruder.velocityVector, intruder.tca, intruder.tcaNorm, intruder.tcaDisplacement);
            this._fireEvent(WT_TASDistributedModelMaster.EVENT_UPDATE_INTRUDER, this._intruderSerializer.serialize(model));
        }
    }

    /**
     *
     * @param {WT_TrafficAvoidanceSystemIntruder} intruder
     */
    _deleteIntruder(intruder) {
        this._intruderModels.delete(intruder);
        this._fireEvent(WT_TASDistributedModelMaster.EVENT_DELETE_INTRUDER, intruder.contact.id);
    }

    _updateIntruders() {
        this._intruderModels.forEach((model, intruder) => this._needDeletion.add(intruder), this);
        this._trafficAvoidanceSystem.intruders.forEach(intruder => {
            let model = this._intruderModels.get(intruder);
            if (model) {
                this._needDeletion.delete(intruder);
                this._updateIntruder(intruder, model);
            } else {
                this._createIntruder(intruder);
            }
        }, this);

        this._needDeletion.forEach(intruder => this._deleteIntruder(intruder));
    }

    update() {
        this._trafficAvoidanceSystem.update();
        this._updateOwnAirplane();
        this._updateIntruders();
    }
}
WT_TASDistributedModelMaster.EVENT_KEY_PREFIX = "WT_TASDistributedModelEvent";
WT_TASDistributedModelMaster.EVENT_UPDATE_OWNAIRPLANE = "OwnAirplane_Update";
WT_TASDistributedModelMaster.EVENT_CREATE_INTRUDER = "Intruder_Create";
WT_TASDistributedModelMaster.EVENT_UPDATE_INTRUDER = "Intruder_Update";
WT_TASDistributedModelMaster.EVENT_DELETE_INTRUDER = "Intruder_Delete";

class WT_TASDistributedModelSlave {
    constructor(id) {
        this._id = id;

        this._ownAirplane = new WT_TASDistributedModelOwnAirplane();
        /**
         * @type {Map<String,WT_TASDistributedModelIntruder>}
         */
        this._intruders = new Map();
        this._intrudersArray = [];
        /**
         * @type {WT_ReadOnlyArray<WT_TASDistributedModelIntruder>}
         */
        this._intrudersArrayReadOnly = new WT_ReadOnlyArray(this._intrudersArray);

        this._eventKeyPrefix = `${WT_TASDistributedModelMaster.EVENT_KEY_PREFIX}_${id}`;
        this._ownAirplaneSerializer = new WT_TASDistributedModelOwnAirplaneSerializer();
        this._intruderSerializer = new WT_TASDistributedModelIntruderSerializer();

        this._initListeners();
    }

    _initListeners() {
        WT_CrossInstrumentEvent.addListener(`${this._eventKeyPrefix}_${WT_TASDistributedModelMaster.EVENT_UPDATE_OWNAIRPLANE}`, this._onOwnAirplaneUpdated.bind(this));
        WT_CrossInstrumentEvent.addListener(`${this._eventKeyPrefix}_${WT_TASDistributedModelMaster.EVENT_CREATE_INTRUDER}`, this._onIntruderCreated.bind(this));
        WT_CrossInstrumentEvent.addListener(`${this._eventKeyPrefix}_${WT_TASDistributedModelMaster.EVENT_UPDATE_INTRUDER}`, this._onIntruderUpdated.bind(this));
        WT_CrossInstrumentEvent.addListener(`${this._eventKeyPrefix}_${WT_TASDistributedModelMaster.EVENT_DELETE_INTRUDER}`, this._onIntruderDeleted.bind(this));
    }

    /**
     * @readonly
     * @type {String}
     */
    get id() {
        return this._id;
    }

    /**
     * @readonly
     * @type {WT_TASDistributedModelOwnAirplane}
     */
    get ownAirplane() {
        return this._ownAirplane;
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_TASDistributedModelIntruder>}
     */
    get intruders() {
        return this._intrudersArrayReadOnly;
    }

    /**
     *
     * @param {String} key
     * @param {String} data
     */
    _onOwnAirplaneUpdated(key, data) {
        this._ownAirplaneSerializer.deserialize(data, this.ownAirplane);
    }

    _createIntruder(id) {
        let intruder = new WT_TASDistributedModelIntruder(id, this._ownAirplane);
        this._intruders.set(id, intruder);
        this._intrudersArray.push(intruder);
        return intruder;
    }

    /**
     *
     * @param {String} key
     * @param {String} data
     */
    _onIntruderCreated(key, data) {
        let id = data;
        if (!this._intruders.has(id)) {
            this._createIntruder(id);
        }
    }

    /**
     *
     * @param {String} key
     * @param {String} data
     */
    _onIntruderUpdated(key, data) {
        let id = data.substring(0, data.indexOf(":"));
        let intruder = this._intruders.get(id);
        if (!intruder) {
            intruder = this._createIntruder(id);
        }
        this._intruderSerializer.deserialize(data, intruder);
    }

    /**
     *
     * @param {String} key
     * @param {String} data
     */
    _onIntruderDeleted(key, data) {
        let id = data;
        let intruder = this._intruders.get(id);
        if (intruder) {
            this._intruders.delete(id);
            let index = this._intrudersArray.indexOf(intruder);
            this._intrudersArray.splice(index, 1);
        }
    }
}

class WT_TASDistributedModelOwnAirplane {
    constructor() {
        this._protectedRadius = WT_Unit.METER.createNumber(0);
        this._protectedHeight = WT_Unit.METER.createNumber(0);

        this._positionVector = new WT_GVector3(0, 0, 0);
        this._velocityVector = new WT_GVector3(0, 0, 0);
    }

    /**
     * The radius of the cylindrical protected zone around this airplane.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get protectedRadius() {
        return this._protectedRadius.readonly();
    }

    /**
     * The height of the cylindrical protected zone around this airplane.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get protectedHeight() {
        return this._protectedHeight.readonly();
    }

    /**
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get positionVector() {
        return this._positionVector.readonly();
    }

    /**
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get velocityVector() {
        return this._velocityVector.readonly();
    }

    setParameters(protectedRadius, protectedHeight, positionVector, velocityVector) {
        this._protectedRadius.set(protectedRadius);
        this._protectedHeight.set(protectedHeight);
        this._positionVector.set(positionVector);
        this._velocityVector.set(velocityVector);
    }
}

class WT_TASDistributedModelIntruder {
    constructor(id, ownAirplane) {
        this._id = id;
        this._ownAirplane = ownAirplane;

        this._positionVector = new WT_GVector3(0, 0, 0);
        this._velocityVector = new WT_GVector3(0, 0, 0);
        this._deltaPosition = new WT_GVector3(0, 0, 0);
        this._deltaVelocity = new WT_GVector3(0, 0, 0);

        this._isPredictionValid = false;
        this._tca = WT_Unit.SECOND.createNumber(NaN);
        this._tcaNorm = NaN;
        this._tcaDisplacement = new WT_GVector3(NaN, NaN, NaN);
    }

    /**
     * @readonly
     * @type {String}
     */
    get id() {
        return this._id;
    }

    /**
     * Whether there is a valid prediction for time of closest approach between this intruder and own airplane.
     * @readonly
     * @type {Boolean}
     */
    get isPredictionValid() {
        return this._isPredictionValid;
    }

    /**
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get positionVector() {
        return this._positionVector.readonly();
    }

    /**
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get velocityVector() {
        return this._velocityVector.readonly();
    }

    /**
     * The position of this intruder relative to own airplane. Expressed as a 3D vector in units of meters.
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get relativePositionVector() {
        return this._deltaPosition.readonly();
    }

    /**
     * The velocity of this intruder relative to own airplane. Expressed as a 3D vector in units of meters per second.
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get relativeVelocityVector() {
        return this._deltaVelocity.readonly();
    }

    /**
     * Time to closest approach between this intruder and own airplane.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get tca() {
        return this._tca.readonly();
    }

    /**
     * The cylindrical norm of the predicted displacement vector between this intruder and own airplane at time of
     * closest approach. A value less than or equal to 1 indicates the intruder will be inside the protected zone.
     * Larger values correspond to greater separation.
     * @readonly
     * @type {Number}
     */
    get tcaNorm() {
        return this._tcaNorm;
    }

    /**
     * The predicted displacement vector from own airplane to this intruder at time of closest approach. The coordinate
     * system is defined in units of meters, with the positive x axis pointing due east, the positive y axis pointing
     * due south, and the positive z axis pointing upwards.
     * @readonly
     * @type {WT_GVector3ReadOnly}
     */
    get tcaDisplacement() {
        return this._tcaDisplacement.readonly();
    }

    invalidatePrediction() {
        if (!this.isPredictionValid) {
            return;
        }

        this._isPredictionValid = false;
        this._tca.set(NaN);
        this._tcaNorm = NaN;
        this._tcaDisplacement.set(NaN, NaN, NaN);
    }

    setPrediction(positionVector, velocityVector, tca, tcaNorm, tcaDisplacement) {
        this._isPredictionValid = true;
        this._positionVector.set(positionVector);
        this._velocityVector.set(velocityVector);
        this._deltaPosition.set(this.positionVector).subtract(this._ownAirplane.positionVector);
        this._deltaVelocity.set(this.velocityVector).subtract(this._ownAirplane.velocityVector);
        this._tca.set(tca);
        this._tcaNorm = tcaNorm;
        this._tcaDisplacement.set(tcaDisplacement);
    }
}

class WT_TASDistributedModelOwnAirplaneSerializer {
    constructor() {
        this._tempMeters1 = WT_Unit.METER.createNumber(0);
        this._tempMeters2 = WT_Unit.METER.createNumber(0);
        this._tempVector3_1 = {x: 0, y: 0, z: 0};
        this._tempVector3_2 = {x: 0, y: 0, z: 0};
    }

    /**
     *
     * @param {{x:Number, y:Number, z:Number}} vector
     * @returns {String}
     */
    _serializeVector(vector) {
        return `${vector.x},${vector.y},${vector.z}`;
    }

    /**
     *
     * @param {WT_TASDistributedModelOwnAirplane} ownAirplane
     * @returns {String}
     */
    serialize(ownAirplane) {
        let protectedRadiusString = `${ownAirplane.protectedRadius.asUnit(WT_Unit.METER)}`;
        let protectedHeightString = `${ownAirplane.protectedHeight.asUnit(WT_Unit.METER)}`;
        let positionVectorString = this._serializeVector(ownAirplane.positionVector);
        let velocityVectorString = this._serializeVector(ownAirplane.velocityVector);
        return `${protectedRadiusString}:${protectedHeightString}:${positionVectorString}:${velocityVectorString}`;
    }

    /**
     *
     * @param {String} string
     * @param {{x:Number, y:Number, z:Number}} vector
     * @returns {{x:Number, y:Number, z:Number}}
     */
    _deserializeVector(string, vector) {
        let components = string.split(",");
        vector.x = parseFloat(components[0]);
        vector.y = parseFloat(components[1]);
        vector.z = parseFloat(components[2]);
        return vector;
    }

    /**
     *
     * @param {String} string
     * @param {WT_TASDistributedModelOwnAirplane} ownAirplane
     * @returns {WT_TASDistributedModelOwnAirplane}
     */
    deserialize(string, ownAirplane) {
        let parameters = string.split(":");
        let protectedRadius = this._tempMeters1.set(parseFloat(parameters[0]));
        let protectedHeight = this._tempMeters2.set(parseFloat(parameters[1]));
        let positionVector = this._deserializeVector(parameters[2], this._tempVector3_1);
        let velocityVector = this._deserializeVector(parameters[3], this._tempVector3_2);
        ownAirplane.setParameters(protectedRadius, protectedHeight, positionVector, velocityVector);
        return ownAirplane;
    }
}

class WT_TASDistributedModelIntruderSerializer {
    constructor() {
        this._tempVector3_1 = {x: 0, y: 0, z: 0};
        this._tempVector3_2 = {x: 0, y: 0, z: 0};
        this._tempVector3_3 = {x: 0, y: 0, z: 0};
        this._tempSecond = WT_Unit.SECOND.createNumber(0);
    }

    /**
     *
     * @param {{x:Number, y:Number, z:Number}} vector
     * @returns {String}
     */
    _serializeVector(vector) {
        return `${vector.x},${vector.y},${vector.z}`;
    }

    /**
     *
     * @param {WT_TASDistributedModelIntruder} intruder
     * @returns {String}
     */
    serialize(intruder) {
        let isPredictionValidString = `${intruder.isPredictionValid}`;
        let string = `${intruder.id}:${isPredictionValidString}`;
        if (intruder.isPredictionValid) {
            let positionVectorString = this._serializeVector(intruder.positionVector);
            let velocityVectorString = this._serializeVector(intruder.velocityVector);
            let tcaString = `${intruder.tca.asUnit(WT_Unit.SECOND)}`;
            let tcaNormString = `${intruder.tcaNorm}`;
            let tcaDisplacementString = this._serializeVector(intruder.tcaDisplacement);
            string += `:${positionVectorString}:${velocityVectorString}:${tcaString}:${tcaNormString}:${tcaDisplacementString}`;
        }
        return string;
    }

    /**
     *
     * @param {String} string
     * @param {{x:Number, y:Number, z:Number}} vector
     * @returns {{x:Number, y:Number, z:Number}}
     */
    _deserializeVector(string, vector) {
        let components = string.split(",");
        vector.x = parseFloat(components[0]);
        vector.y = parseFloat(components[1]);
        vector.z = parseFloat(components[2]);
        return vector;
    }

    /**
     *
     * @param {String} string
     * @param {WT_TASDistributedModelIntruder} intruder
     * @returns {WT_TASDistributedModelIntruder}
     */
    deserialize(string, intruder) {
        let parameters = string.split(":");
        let id = parameters[0];
        if (id !== intruder.id) {
            return;
        }

        let isPredictionValid = parameters[1] === "true";
        if (isPredictionValid) {
            let positionVector = this._deserializeVector(parameters[2], this._tempVector3_1);
            let velocityVector = this._deserializeVector(parameters[3], this._tempVector3_2);
            let tca = this._tempSecond.set(parseFloat(parameters[4]));
            let tcaNorm = parseFloat(parameters[5]);
            let tcaDisplacement = this._deserializeVector(parameters[6], this._tempVector3_3);
            intruder.setPrediction(positionVector, velocityVector, tca, tcaNorm, tcaDisplacement);
        } else {
            intruder.invalidatePrediction();
        }
        return intruder;
    }
}