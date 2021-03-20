class WT_AirspaceSearcher {
    constructor() {
        this._queue = [];
        this._isBusy = false;
    }

    get isBusy() {
        return this._isBusy;
    }

    _finishSearch() {
        this._isBusy = false;
        let next = this._queue.shift();
        if (next) {
            next();
        }
    }

    _enqueueSearch(center, resolve) {
        this._queue.push(this._doSearch.bind(this, center, resolve));
    }

    async _doSearch(center, resolve) {
        this._isBusy = true;
        await Coherent.call("SET_LOAD_LATLON", center.lat, center.long);
        let airspaceData = await Coherent.call("GET_NEAREST_AIRSPACES");
        resolve(airspaceData);
        this._finishSearch();
    }

    search(center) {
        return new Promise(resolve => {
            if (this._isBusy) {
                this._enqueueSearch(center, resolve);
            } else {
                this._doSearch(center, resolve);
            }
        });
    }
}