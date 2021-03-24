class WT_G3x5_BaseInstrument extends BaseInstrument {
    constructor() {
        super();

        this._isModConfigLoaded = false;

        this._icaoWaypointFactory = new WT_ICAOWaypointFactory();
        this._icaoSearchers = {
            airport: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.AIRPORT),
            vor: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.VOR),
            ndb: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.NDB),
            int: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.INT)
        };

        this._unitsController = new WT_G3x5_UnitsController();
    }

    /**
     * @readonly
     * @type {WT_PlayerAirplane}
     */
    get airplane() {
        return this._airplane;
    }

    /**
     * @readonly
     * @type {WT_ICAOWaypointFactory}
     */
    get icaoWaypointFactory() {
        return this._icaoWaypointFactory;
    }

    /**
     * @readonly
     * @type {{airport:WT_ICAOSearcher, vor:WT_ICAOSearcher, ndb:WT_ICAOSearcher, int:WT_ICAOSearcher}}
     */
    get icaoSearchers() {
        return this._icaoSearchers;
    }

    /**
     * @readonly
     * @type {WT_FlightPlanManager}
     */
    get flightPlanManagerWT() {
        return this._fpm;
    }

    /**
     * @readonly
     * @type {WT_G3x5_UnitsController}
     */
    get unitsController() {
        return this._unitsController;
    }

    _createAirplane() {
        switch (WT_PlayerAirplane.getAircraftType()) {
            case WT_PlayerAirplane.Type.TBM930:
                return new WT_TBM930Airplane();
            case WT_PlayerAirplane.Type.CITATION_LONGITUDE:
                return new WT_CitationLongitudeAirplane();
        }
    }

    _initAirplane() {
        this._airplane = this._createAirplane();
    }

    _initFlightPlanManager() {
        this._fpm = new WT_FlightPlanManager(this.airplane, this.icaoWaypointFactory);
        this._lastFPMSyncTime = 0;
        this.airplane.fms.setFlightPlanManager(this._fpm);
    }

    async _loadModConfig() {
        await WT_g3000_ModConfig.initialize();
        this._initAirplane();
        this._initFlightPlanManager();
        this._isModConfigLoaded = true;
    }

    connectedCallback() {
        super.connectedCallback();

        this._loadModConfig();
    }

    createMainLoop() {
        if (this._isConnected) {
            return;
        }
        this._lastTime = Date.now();
        let updateLoop = () => {
            if (!this._isConnected) {
                console.log("Exiting MainLoop...");
                return;
            }
            try {
                if (BaseInstrument.allInstrumentsLoaded && !this.xmlConfigLoading && this._isModConfigLoaded && SimVar.IsReady()) {
                    if (!this._isInitialized)
                        this.Init();
                    this.doUpdate();
                }
            } catch (e) {
                console.error(this.instrumentIdentifier + " : " + e, e.stack);
            }
            requestAnimationFrame(updateLoop);
        };
        this._isConnected = true;
        console.log("MainLoop created");
        requestAnimationFrame(updateLoop);
    }

    _updateICAOWaypointFactory() {
        this.icaoWaypointFactory.update();
    }

    _updateFlightPlanManager() {
        let currentTime = Date.now() / 1000;
        if (currentTime - this._lastFPMSyncTime >= WT_G3x5_BaseInstrument.FLIGHT_PLAN_SYNC_INTERVAL) {
            this.flightPlanManagerWT.syncActiveFromGame();
            this._lastFPMSyncTime = currentTime;
        }
    }

    onUpdate(deltaTime) {
        this._updateICAOWaypointFactory();
        this._updateFlightPlanManager();
    }
}
WT_G3x5_BaseInstrument.FLIGHT_PLAN_SYNC_INTERVAL = 2;