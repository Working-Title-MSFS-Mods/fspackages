/**
 * An intersection (fix).
 */
class WT_Intersection extends WT_ICAOWaypoint {
    constructor(data) {
        super(data, WT_ICAOWaypoint.Type.INT);

        this._airways = [];
    }

    _initFromData(data) {
        super._initFromData(data);

        this._nearestVOR = {
            icao: data.nearestVorICAO,
            vorType: data.nearestVorType,
            frequency: new WT_Frequency(data.nearestVorFrequencyMHz, WT_Frequency.Prefix.MHz),
            distance: WT_Unit.NMILE.createNumber(WT_Unit.METER.convert(data.nearestVorDistance, WT_Unit.NMILE)),
            radialTrue: data.nearestVorTrueRadial,
            radialMagnetic: data.nearestVorMagneticRadial
        };

        this._nearestVORReadOnly = {
            _source: this._nearestVOR,
            get icao() {
                return this._source.icao;
            },
            get vorType() {
                return this._source.vorType;
            },
            get frequency() {
                return this._source.frequency;
            },
            get distance() {
                return this._source.distance.readonly();
            },
            get radialTrue() {
                return this._source.radialTrue;
            },
            get radialMagnetic() {
                return this._source.radialMagnetic;
            }
        }
    }

    /**
     * Information on the closest VOR to this intersection.
     * @readonly
     * @type {WT_IntersectionNearestVOR}
     */
    get nearestVOR() {
        return this._nearestVORReadOnly;
    }

    /**
     * A list of airways passing through this intersection.
     * @readonly
     * @type {WT_Airway[]}
     */
    get airways() {
        return this._airways;
    }
}

/**
 * @typedef WT_IntersectionNearestVOR
 * @property {readonly String} icao - the ICAO string for the nearest VOR.
 * @property {readonly WT_VOR.Type} vorType - the type of the nearest VOR.
 * @property {readonly WT_Frequency} frequency - the frequency of the nearest VOR.
 * @property {readonly WT_NumberUnitReadOnly} distance - the distance to the nearest VOR.
 * @property {readonly Number} radialTrue - the true radial of nearest VOR on which the intersection lies.
 * @property {readonly Number} radialMagnetic - the magnetic radial of the nearest VOR on which the intersection lies.
 */