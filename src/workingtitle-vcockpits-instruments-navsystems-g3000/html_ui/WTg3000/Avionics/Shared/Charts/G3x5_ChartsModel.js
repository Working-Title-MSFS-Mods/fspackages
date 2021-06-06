class WT_G3x5_ChartsModel {
    constructor(navigraphNetworkAPI) {
        this._navigraphNetworkAPI = navigraphNetworkAPI;
        this._navigraphStatus = navigraphNetworkAPI.isAccountLinked ? WT_G3x5_ChartsModel.NavigraphStatus.ACCESS_AVAILABLE : WT_G3x5_ChartsModel.NavigraphStatus.UNLINKED;

        this._chartID = "";
        this._airportIdent = "";
        this._airportCharts = [];
        this._airportChartsReadOnly = new WT_ReadOnlyArray(this._airportCharts);
        this._chart = null;
        this._chartDayURL = "";
        this._chartNightURL = "";

        this._offset = new WT_GVector2(0, 0);

        this._taskID = 0;

        this._optsManager = new WT_OptionsManager(this, WT_G3x5_ChartsModel.OPTION_DEFS);
    }

    /**
     * @readonly
     * @type {WT_NavigraphNetworkAPI}
     */
    get navigraphNetworkAPI() {
        return this._navigraphNetworkAPI;
    }

    /**
     * @readonly
     * @type {WT_G3x5_ChartsModel.NavigraphStatus}
     */
    get navigraphStatus() {
        return this._navigraphStatus;
    }

    async updateNavigraphStatus() {
        let status;
        if (this.navigraphNetworkAPI.isAccountLinked) {
            let isAccessAvail = await this.navigraphNetworkAPI.validateToken();
            if (isAccessAvail) {
                status = WT_G3x5_ChartsModel.NavigraphStatus.ACCESS_AVAILABLE;
            } else {
                status = WT_G3x5_ChartsModel.NavigraphStatus.ACCESS_EXPIRED;
            }
        } else {
            status = WT_G3x5_ChartsModel.NavigraphStatus.UNLINKED;
        }

        this._navigraphStatus = status;
    }

    async _retrieveCharts(ident) {
        try {
            let response = await this.navigraphNetworkAPI.getChartsList(ident);
            this._navigraphStatus = WT_G3x5_ChartsModel.NavigraphStatus.ACCESS_AVAILABLE;
            if (response) {
                return response.charts;
            }
        } catch (e) {
            console.log(e);
            this.updateNavigraphStatus();
        }
        return [];
    }

    async _retrieveChartURLs(chart) {
        try {
            let urls = await Promise.all([this.navigraphNetworkAPI.getChartPngUrl(chart, true), this.navigraphNetworkAPI.getChartPngUrl(chart, false)]);
            this._navigraphStatus = WT_G3x5_ChartsModel.NavigraphStatus.ACCESS_AVAILABLE;
            return urls;
        } catch (e) {
            console.log(e);
            this.updateNavigraphStatus();
        }
        return ["", ""];
    }

    async _updateCharts() {
        let taskID = ++this._taskID;
        let charts = await this._retrieveCharts(this._airportIdent);
        let chart = charts.find(chart => chart.id === this._chartID, this);
        if (chart) {
            [this._chartDayURL, this._chartNightURL] = await this._retrieveChartURLs(chart);
        } else {
            this._chartDayURL = "";
            this._chartNightURL = "";
        }

        if (taskID !== this._taskID) {
            return;
        }

        this._airportCharts = charts;
        this._airportChartsReadOnly = new WT_ReadOnlyArray(this._airportCharts);
        this._chart = chart ? chart : null;
    }

    get chartID() {
        return this._chartID;
    }

    set chartID(id) {
        if (id === this._chartID) {
            return;
        }

        this._chartID = id;
        this._airportIdent = id ? WT_NavigraphChartOperations.getAirportIdentFromID(id) : "";
        this._updateCharts();
    }

    /**
     * @readonly
     * @type {String}
     */
    get airportIdent() {
        return this._airportIdent;
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_NavigraphChartDefinition>}
     */
    get airportCharts() {
        return this._airportChartsReadOnly;
    }

    /**
     * @readonly
     * @type {WT_NavigraphChartDefinition}
     */
    get chart() {
        return this._chart;
    }

    /**
     * @readonly
     * @type {String}
     */
    get chartDayViewURL() {
        return this._chartDayURL;
    }

    /**
     * @readonly
     * @type {String}
     */
    get chartNightViewURL() {
        return this._chartNightURL;
    }

    /**
     * @type {WT_GVector2}
     */
    get offset() {
        return this._offset.readonly();
    }

    set offset(offset) {
        this._offset.set(offset);
    }
}
WT_G3x5_ChartsModel.NAME_DEFAULT = "charts";
/**
 * @enum {Number}
 */
WT_G3x5_ChartsModel.NavigraphStatus = {
    UNLINKED: 0,
    ACCESS_EXPIRED: 1,
    ACCESS_AVAILABLE: 2
};
/**
 * @enum {Number}
 */
WT_G3x5_ChartsModel.SectionMode = {
    ALL: 0,
    PLAN: 1
};
WT_G3x5_ChartsModel.OPTION_DEFS = {
    chartID: {default: ""},
    useNightView: {default: false, auto: true},
    sectionMode: {default: WT_G3x5_ChartsModel.SectionMode.ALL, auto: true},
    rotation: {default: 0, auto: true},
    scaleFactor: {default: 1, auto: true}
};