class WT_Procedure {
    constructor(name, procedureIndex) {
        this._name = name;
        this.procedureIndex = procedureIndex;
    }
    getPrimaryFrequency() {
        return null;
    }
    get name() {
        return this._name;
    }
}

class WT_Procedure_Leg {
    constructor(leg) {
        Object.assign(this, leg);
        this.bearing = this.course;
        this.distance /= 1852;
    }
    setFix(fix) {
        this.fix = fix;
    }
    setOrigin(origin) {
        this.origin = origin;
    }
}