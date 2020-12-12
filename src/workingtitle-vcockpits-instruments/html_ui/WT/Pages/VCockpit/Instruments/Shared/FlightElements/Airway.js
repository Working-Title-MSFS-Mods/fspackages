/**
 * An airway.
 */
class WT_Airway {
    /**
     * @param {String} name - the name of the new airway.
     * @param {Number} type - the type of the new airway.
     * @param {WT_AirwayBuilder} builder - a builder with which to load waypoints for the new airway.
     */
    constructor(name, type, builder) {
        this._name = name;
        this._type = type;
        this._waypoints = [];
        this._builder = builder;
        this._builder._airway = this;
        this._status = WT_Airway.Status.INCOMPLETE;
    }

    /**
     * @readonly
     * @property {String} name - the name of this airway.
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * @readonly
     * @property {Number} type - the type of this airway.
     * @type {Number}
     */
    get type() {
        return this._type;
    }

    /**
     * @readonly
     * @property {Number} status - the current load status of this airway, which indicates which waypoints in the airway have
     *                             been loaded.
     * @type {Number}
     */
    get status() {
        return this._status;
    }

    _waitForBuilderLoop(resolve) {
        if (this._builder.isDone) {
            resolve();
        } else {
            requestAnimationFrame(this._waitForBuilderLoop.bind(this, resolve));
        }
    }

    _waitForBuilder() {
        return new Promise(resolve => {
            this._waitForBuilderLoop(resolve);
        });
    }

    /**
     * Gets the waypoints belonging to this airway, in order.
     * @returns {Promise<WT_ICAOWaypoint[]>} a Promise to return an array of waypoints belong to this airway.
     */
    async getWaypoints() {
        if (!this._builder.hasStarted) {
            this._builder.startBuild().then(value => this._status = value);
        }
        await this._waitForBuilder();
        return this._waypoints;
    }
}
/**
 * @enum {Number}
 */
WT_Airway.Status = {
    /**
     * @readonly
     * @property {Number} INCOMPLETE - indicates waypoints have not been loaded yet.
     */
    INCOMPLETE: 0,
    /**
     * @readonly
     * @property {Number} COMPLETE - indicates all waypoints have been successfully loaded.
     */
    COMPLETE: 1,
    /**
     * @readonly
     * @property {Number} PARTIAL - indicates some, but not all, waypoints have been successfully loaded.
     */
    PARTIAL: 2
}

/**
 * A builder that loads waypoints for an airway.
 */
class WT_AirwayBuilder {
    constructor() {
        this._hasStarted = false;
        this._isDone = false;
    }

    /**
     * @readonly
     * @property {WT_Airway} airway - this builder's parent airway.
     * @type {WT_Airway}
     */
    get airway() {
        return this._airway;
    }

    /**
     * @readonly
     * @property {Boolean} hasStarted - whether this builder has started loading waypoints.
     * @type {Boolean}
     */
    get hasStarted() {
        return this._hasStarted;
    }

    /**
     * @readonly
     * @property {Boolean} isDone - whether this builder is done loading waypoints.
     * @type {Boolean}
     */
    get isDone() {
        return this._isDone;
    }

    /**
     * Begins loading waypoints for this builder's parent airway.
     * @returns {Promise<Number>} a Promise to return a status code corresponding to WT_Airway.Status when this builder has
     *                            finished loading waypoints.
     */
    startBuild() {
        return Promise.resolve(WT_Airway.Status.INCOMPLETE);
    }
}